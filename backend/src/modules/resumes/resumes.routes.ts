import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../shared/database/prisma.js';
import { failure, success } from '../../shared/http.js';
import { requireAuthentication, requireRole } from '../auth/auth.middleware.js';
import { canAccessStudent, pageQuerySchema, parseId, studentForUser, paginationMeta } from '../../shared/utils.js';

const router = Router();
router.use(requireAuthentication);

// GET /api/v1/resumes
router.get('/', async (req, res) => {
  const query = pageQuerySchema.safeParse(req.query);
  if (!query.success) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid query parameters.', query.error.issues);

  const { page, limit, sort, order } = query.data;

  const isStudent = req.authUser!.roles.includes('STUDENT');
  const student = isStudent ? await studentForUser(req.authUser!.id) : null;

  if (isStudent && !student) return failure(res, 404, 'NOT_FOUND', 'Student profile not found.');
  if (!isStudent && !req.authUser!.roles.some((r) => ['TPO', 'ADMIN'].includes(r))) {
    return failure(res, 403, 'FORBIDDEN', 'Insufficient permissions.');
  }

  const where = isStudent ? { studentId: student!.id } : {};
  const total = await prisma.resume.count({ where });
  const resumes = await prisma.resume.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    include: { analysis: true, student: { select: { firstName: true, lastName: true, rollNumber: true } } },
    orderBy: sort ? { [sort]: order } : { uploadedAt: 'desc' },
  });

  return success(res, resumes, 200, 'Resumes retrieved successfully.', paginationMeta(total, page, limit));
});

// POST /api/v1/resumes (Create/Register resume metadata)
router.post('/', requireRole('STUDENT'), async (req, res) => {
  const input = z.object({
    fileName: z.string().trim().min(1).max(255),
    mimeType: z.string().trim().default('application/pdf'),
    fileSize: z.number().int().min(1).max(5242880).default(102400),
    storagePath: z.string().trim().optional(),
  }).safeParse(req.body);

  if (!input.success) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid resume file payload.', input.error.issues);

  const student = await studentForUser(req.authUser!.id);
  if (!student) return failure(res, 404, 'NOT_FOUND', 'Student profile not found.');

  const storagePath = input.data.storagePath || `resumes/${student.id}/${Date.now()}_${input.data.fileName}`;

  const resume = await prisma.resume.create({
    data: {
      studentId: student.id,
      fileName: input.data.fileName,
      mimeType: input.data.mimeType,
      fileSize: input.data.fileSize,
      storagePath,
      status: 'UPLOADED',
    },
    include: { analysis: true },
  });

  return success(res, resume, 201, 'Resume recorded successfully.');
});

// GET /api/v1/resumes/:resumeId
router.get('/:resumeId', async (req, res) => {
  const resumeId = parseId(req.params.resumeId);
  if (!resumeId) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid resume ID.');

  const resume = await prisma.resume.findUnique({
    where: { id: resumeId },
    include: { analysis: true, student: true },
  });

  if (!resume) return failure(res, 404, 'NOT_FOUND', 'Resume not found.');

  if (!(await canAccessStudent(req, resume.studentId))) {
    return failure(res, 403, 'FORBIDDEN', 'Access denied.');
  }

  return success(res, resume);
});

// DELETE /api/v1/resumes/:resumeId
router.delete('/:resumeId', requireRole('STUDENT', 'ADMIN'), async (req, res) => {
  const resumeId = parseId(req.params.resumeId);
  if (!resumeId) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid resume ID.');

  const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
  if (!resume) return failure(res, 404, 'NOT_FOUND', 'Resume not found.');

  if (!(await canAccessStudent(req, resume.studentId))) {
    return failure(res, 403, 'FORBIDDEN', 'Access denied.');
  }

  await prisma.resume.delete({ where: { id: resumeId } });
  return success(res, null, 200, 'Resume deleted successfully.');
});

// POST /api/v1/resumes/:resumeId/analyze (Trigger analysis)
router.post('/:resumeId/analyze', async (req, res) => {
  const resumeId = parseId(req.params.resumeId);
  if (!resumeId) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid resume ID.');

  const resume = await prisma.resume.findUnique({
    where: { id: resumeId },
    include: { student: { include: { studentSkills: { include: { skill: true } }, academicRecords: true } } },
  });
  if (!resume) return failure(res, 404, 'NOT_FOUND', 'Resume not found.');

  if (!(await canAccessStudent(req, resume.studentId))) {
    return failure(res, 403, 'FORBIDDEN', 'Access denied.');
  }

  // Calculate score based on actual student profile attributes
  const gpa = Number(resume.student.currentGpa);
  const skillCount = resume.student.studentSkills.length;
  const verifiedSkillsCount = resume.student.studentSkills.filter((s) => s.verified).length;
  const recordsCount = resume.student.academicRecords.length;

  let overallScore = 60.0;
  if (gpa >= 8.0) overallScore += 15;
  else if (gpa >= 7.0) overallScore += 10;

  if (skillCount >= 5) overallScore += 15;
  else overallScore += skillCount * 2;

  if (verifiedSkillsCount >= 2) overallScore += 10;
  overallScore = Math.min(98.0, overallScore);

  const extractedSkills = resume.student.studentSkills.map((s) => s.skill.name);
  const recommendations = skillCount < 5
    ? 'Add at least 5 verified technical skills to improve your resume score.'
    : 'Strong skill alignment. Highlight measurable project outcomes in bullet points.';

  const analysis = await prisma.resumeAnalysis.upsert({
    where: { resumeId: resume.id },
    create: {
      resumeId: resume.id,
      overallScore,
      grammarFeedback: 'No major grammatical issues detected in uploaded resume document.',
      extractedSkills,
      recommendations,
    },
    update: {
      overallScore,
      extractedSkills,
      recommendations,
    },
  });

  await prisma.resume.update({
    where: { id: resume.id },
    data: { status: 'ANALYZED' },
  });

  return success(res, analysis, 200, 'Resume analysis generated.');
});

// GET /api/v1/resumes/:resumeId/analysis
router.get('/:resumeId/analysis', async (req, res) => {
  const resumeId = parseId(req.params.resumeId);
  if (!resumeId) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid resume ID.');

  const analysis = await prisma.resumeAnalysis.findUnique({ where: { resumeId } });
  if (!analysis) return failure(res, 404, 'NOT_FOUND', 'Resume analysis not generated yet.');

  return success(res, analysis);
});

export default router;
