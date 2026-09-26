import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../shared/database/prisma.js';
import { failure, success } from '../../shared/http.js';
import { requireAuthentication, requireRole } from '../auth/auth.middleware.js';
import { canAccessStudent, pageQuerySchema, parseId, studentForUser, idSchema, paginationMeta } from '../../shared/utils.js';

const router = Router();
router.use(requireAuthentication);

// Deterministic eligibility engine function
export async function checkStudentJobEligibility(studentId: string, jobId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { department: true, studentSkills: { include: { skill: true } } },
  });
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { company: true, jobSkills: { include: { skill: true } } },
  });

  if (!student || !job) return { eligible: false, reason: 'Student or Job record not found.', checks: [] };

  const checks = [];

  // Check 1: CGPA Requirement
  const studentGpa = Number(student.currentGpa);
  const minGpa = Number(job.minGpa);
  const gpaPassed = studentGpa >= minGpa;
  checks.push({
    criterion: 'CGPA',
    required: minGpa,
    actual: studentGpa,
    passed: gpaPassed,
    message: gpaPassed ? 'CGPA requirement satisfied.' : `Minimum CGPA required is ${minGpa}, your CGPA is ${studentGpa}.`,
  });

  // Check 2: Application Deadline
  const isDeadlinePassed = job.applicationDeadline < new Date();
  checks.push({
    criterion: 'Deadline',
    required: 'Before ' + job.applicationDeadline.toISOString(),
    actual: new Date().toISOString(),
    passed: !isDeadlinePassed,
    message: !isDeadlinePassed ? 'Application window open.' : 'Application deadline has passed.',
  });

  // Check 3: Skills match check
  const requiredSkillNames = job.jobSkills.map((js) => js.skill.name);
  const studentSkillNames = student.studentSkills.map((ss) => ss.skill.name);
  const matchedSkills = requiredSkillNames.filter((s) => studentSkillNames.includes(s));
  const skillsPassed = requiredSkillNames.length === 0 || matchedSkills.length > 0;

  checks.push({
    criterion: 'Skills',
    required: requiredSkillNames.join(', ') || 'None specified',
    actual: studentSkillNames.join(', ') || 'None listed',
    passed: skillsPassed,
    message: skillsPassed ? `Matched ${matchedSkills.length} required skill(s).` : 'No matching required skills found.',
  });

  const overallEligible = checks.every((c) => c.passed);

  return {
    eligible: overallEligible,
    jobId: job.id,
    jobTitle: job.title,
    companyName: job.company.name,
    checks,
  };
}

// GET /api/v1/companies
router.get('/companies', requireRole('TPO', 'ADMIN'), async (req, res) => {
  const query = pageQuerySchema.safeParse(req.query);
  if (!query.success) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid query.', query.error.issues);

  const { page, limit, search, sort, order } = query.data;
  const where: any = search ? {
    OR: [
      { name: { contains: search, mode: 'insensitive' } },
      { industry: { contains: search, mode: 'insensitive' } },
    ],
  } : {};

  const total = await prisma.company.count({ where });
  const companies = await prisma.company.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    include: { jobs: true },
    orderBy: sort ? { [sort]: order } : { name: 'asc' },
  });

  return success(res, companies, 200, 'Companies retrieved successfully.', paginationMeta(total, page, limit));
});

// POST /api/v1/companies
router.post('/companies', requireRole('TPO', 'ADMIN'), async (req, res) => {
  const input = z.object({
    name: z.string().trim().min(1).max(150),
    website: z.string().url().optional().or(z.literal('')),
    industry: z.string().trim().max(100).optional(),
  }).safeParse(req.body);

  if (!input.success) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid company payload.', input.error.issues);

  try {
    const company = await prisma.company.create({
      data: {
        name: input.data.name,
        website: input.data.website || null,
        industry: input.data.industry || null,
      },
    });
    return success(res, company, 201, 'Company created successfully.');
  } catch {
    return failure(res, 409, 'CONFLICT', 'Company with this name already exists.');
  }
});

// GET /api/v1/jobs
router.get('/', async (req, res) => {
  const query = pageQuerySchema.extend({
    companyId: z.string().uuid().optional(),
    minGpa: z.coerce.number().optional(),
  }).safeParse(req.query);

  if (!query.success) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid query parameters.', query.error.issues);

  const { page, limit, search, companyId, minGpa, sort, order } = query.data;
  const where: any = {};

  if (companyId) where.companyId = companyId;
  if (minGpa !== undefined) where.minGpa = { lte: minGpa };
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { company: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const total = await prisma.job.count({ where });
  const jobs = await prisma.job.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    include: { company: true, jobSkills: { include: { skill: true } } },
    orderBy: sort ? { [sort]: order } : { applicationDeadline: 'asc' },
  });

  return success(res, jobs, 200, 'Jobs retrieved successfully.', paginationMeta(total, page, limit));
});

// GET /api/v1/jobs/:jobId
router.get('/:jobId', async (req, res) => {
  const jobId = parseId(req.params.jobId);
  if (!jobId) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid job ID.');

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { company: true, jobSkills: { include: { skill: true } } },
  });
  if (!job) return failure(res, 404, 'NOT_FOUND', 'Job posting not found.');

  // If student is calling, calculate structured eligibility engine results
  let eligibilityInfo = null;
  if (req.authUser!.roles.includes('STUDENT')) {
    const student = await studentForUser(req.authUser!.id);
    if (student) {
      eligibilityInfo = await checkStudentJobEligibility(student.id, jobId);
    }
  }

  return success(res, { ...job, eligibility: eligibilityInfo });
});

// GET /api/v1/jobs/:jobId/eligibility
router.get('/:jobId/eligibility', requireRole('STUDENT'), async (req, res) => {
  const jobId = parseId(req.params.jobId);
  if (!jobId) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid job ID.');

  const student = await studentForUser(req.authUser!.id);
  if (!student) return failure(res, 404, 'NOT_FOUND', 'Student profile not found.');

  const result = await checkStudentJobEligibility(student.id, jobId);
  return success(res, result);
});

// POST /api/v1/jobs (TPO/ADMIN create job posting)
router.post('/', requireRole('TPO', 'ADMIN'), async (req, res) => {
  const input = z.object({
    companyId: idSchema,
    title: z.string().trim().min(1).max(150),
    description: z.string().trim().min(1),
    minGpa: z.number().min(0).max(10).default(0.0),
    applicationDeadline: z.coerce.date(),
    skillIds: z.array(idSchema).default([]),
  }).safeParse(req.body);

  if (!input.success) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid job posting payload.', input.error.issues);

  if (input.data.applicationDeadline <= new Date()) {
    return failure(res, 422, 'VALIDATION_ERROR', 'Application deadline must be in the future.');
  }

  try {
    const job = await prisma.job.create({
      data: {
        companyId: input.data.companyId,
        title: input.data.title,
        description: input.data.description,
        minGpa: input.data.minGpa,
        applicationDeadline: input.data.applicationDeadline,
        jobSkills: { create: input.data.skillIds.map((skillId) => ({ skillId })) },
      },
      include: { company: true, jobSkills: { include: { skill: true } } },
    });
    return success(res, job, 201, 'Job posting created successfully.');
  } catch {
    return failure(res, 409, 'CONFLICT', 'Job references invalid company or duplicate data.');
  }
});

// PATCH /api/v1/jobs/:jobId
router.patch('/:jobId', requireRole('TPO', 'ADMIN'), async (req, res) => {
  const jobId = parseId(req.params.jobId);
  if (!jobId) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid job ID.');

  const input = z.object({
    title: z.string().trim().min(1).max(150).optional(),
    description: z.string().trim().min(1).optional(),
    minGpa: z.number().min(0).max(10).optional(),
    applicationDeadline: z.coerce.date().optional(),
  }).safeParse(req.body);

  if (!input.success) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid update payload.', input.error.issues);

  const existing = await prisma.job.findUnique({ where: { id: jobId } });
  if (!existing) return failure(res, 404, 'NOT_FOUND', 'Job not found.');

  const updated = await prisma.job.update({
    where: { id: jobId },
    data: input.data,
    include: { company: true, jobSkills: { include: { skill: true } } },
  });

  return success(res, updated, 200, 'Job updated successfully.');
});

// DELETE /api/v1/jobs/:jobId
router.delete('/:jobId', requireRole('TPO', 'ADMIN'), async (req, res) => {
  const jobId = parseId(req.params.jobId);
  if (!jobId) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid job ID.');

  const existing = await prisma.job.findUnique({ where: { id: jobId } });
  if (!existing) return failure(res, 404, 'NOT_FOUND', 'Job not found.');

  await prisma.job.delete({ where: { id: jobId } });
  return success(res, null, 200, 'Job deleted successfully.');
});

export default router;
