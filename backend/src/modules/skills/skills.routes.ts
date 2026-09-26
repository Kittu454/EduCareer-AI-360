import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../shared/database/prisma.js';
import { failure, success } from '../../shared/http.js';
import { requireAuthentication, requireRole } from '../auth/auth.middleware.js';
import { canAccessStudent, pageQuerySchema, parseId, studentForUser, idSchema, paginationMeta } from '../../shared/utils.js';

const router = Router();
router.use(requireAuthentication);

// GET /api/v1/skills (browse taxonomy)
router.get('/', async (req, res) => {
  const query = pageQuerySchema.extend({
    category: z.string().optional(),
  }).safeParse(req.query);

  if (!query.success) {
    return failure(res, 422, 'VALIDATION_ERROR', 'Invalid pagination or search query.', query.error.issues);
  }

  const { page, limit, search, category, sort, order } = query.data;
  const where: any = {};

  if (category) where.category = { equals: category, mode: 'insensitive' };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
    ];
  }

  const total = await prisma.skill.count({ where });
  const skills = await prisma.skill.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: sort ? { [sort]: order } : { name: 'asc' },
  });

  return success(res, skills, 200, 'Skills retrieved successfully.', paginationMeta(total, page, limit));
});

// GET /api/v1/skills/:skillId
router.get('/:skillId', async (req, res) => {
  const skillId = parseId(req.params.skillId);
  if (!skillId) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid skill ID.');

  const skill = await prisma.skill.findUnique({ where: { id: skillId } });
  return skill ? success(res, skill) : failure(res, 404, 'NOT_FOUND', 'Skill not found.');
});

// POST /api/v1/skills (ADMIN taxonomy creation)
router.post('/', requireRole('ADMIN'), async (req, res) => {
  const input = z.object({
    name: z.string().trim().min(1).max(100),
    category: z.string().trim().min(1).max(100).default('TECHNICAL'),
  }).safeParse(req.body);

  if (!input.success) {
    return failure(res, 422, 'VALIDATION_ERROR', 'Invalid skill payload.', input.error.issues);
  }

  try {
    const skill = await prisma.skill.create({ data: input.data });
    return success(res, skill, 201, 'Skill created successfully.');
  } catch {
    return failure(res, 409, 'CONFLICT', 'Skill with this name already exists.');
  }
});

// GET /api/v1/students/me/skills
router.get('/students/me/skills', requireRole('STUDENT'), async (req, res) => {
  const student = await studentForUser(req.authUser!.id);
  if (!student) return failure(res, 404, 'NOT_FOUND', 'Student profile not found.');

  const skills = await prisma.studentSkill.findMany({
    where: { studentId: student.id },
    include: { skill: true, assessments: true },
    orderBy: { skill: { name: 'asc' } },
  });

  return success(res, skills);
});

// POST /api/v1/students/me/skills
router.post('/students/me/skills', requireRole('STUDENT'), async (req, res) => {
  const input = z.object({
    skillId: idSchema,
    proficiencyLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).default('BEGINNER'),
  }).safeParse(req.body);

  if (!input.success) {
    return failure(res, 422, 'VALIDATION_ERROR', 'Invalid skill payload.', input.error.issues);
  }

  const student = await studentForUser(req.authUser!.id);
  if (!student) return failure(res, 404, 'NOT_FOUND', 'Student profile not found.');

  try {
    const studentSkill = await prisma.studentSkill.create({
      data: {
        studentId: student.id,
        skillId: input.data.skillId,
        proficiencyLevel: input.data.proficiencyLevel,
      },
      include: { skill: true },
    });
    return success(res, studentSkill, 201, 'Skill added to profile.');
  } catch {
    return failure(res, 409, 'CONFLICT', 'Skill already added or invalid skill ID.');
  }
});

// PATCH /api/v1/students/me/skills/:studentSkillId
router.patch('/students/me/skills/:studentSkillId', requireRole('STUDENT'), async (req, res) => {
  const studentSkillId = parseId(req.params.studentSkillId);
  if (!studentSkillId) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid student skill ID.');

  const input = z.object({
    proficiencyLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']),
  }).safeParse(req.body);

  if (!input.success) {
    return failure(res, 422, 'VALIDATION_ERROR', 'Invalid proficiency level.', input.error.issues);
  }

  const student = await studentForUser(req.authUser!.id);
  if (!student) return failure(res, 404, 'NOT_FOUND', 'Student profile not found.');

  const existing = await prisma.studentSkill.findUnique({ where: { id: studentSkillId } });
  if (!existing || existing.studentId !== student.id) {
    return failure(res, 404, 'NOT_FOUND', 'Skill not found in your inventory.');
  }

  const updated = await prisma.studentSkill.update({
    where: { id: studentSkillId },
    data: { proficiencyLevel: input.data.proficiencyLevel },
    include: { skill: true },
  });

  return success(res, updated, 200, 'Skill proficiency updated.');
});

// DELETE /api/v1/students/me/skills/:studentSkillId
router.delete('/students/me/skills/:studentSkillId', requireRole('STUDENT'), async (req, res) => {
  const studentSkillId = parseId(req.params.studentSkillId);
  if (!studentSkillId) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid student skill ID.');

  const student = await studentForUser(req.authUser!.id);
  if (!student) return failure(res, 404, 'NOT_FOUND', 'Student profile not found.');

  const existing = await prisma.studentSkill.findUnique({ where: { id: studentSkillId } });
  if (!existing || existing.studentId !== student.id) {
    return failure(res, 404, 'NOT_FOUND', 'Skill not found in your inventory.');
  }

  await prisma.studentSkill.delete({ where: { id: studentSkillId } });
  return success(res, null, 200, 'Skill removed from profile.');
});

// GET /api/v1/students/:studentId/skills
router.get('/students/:studentId/skills', async (req, res) => {
  const studentId = parseId(req.params.studentId);
  if (!studentId || !(await canAccessStudent(req, studentId))) {
    return failure(res, 404, 'NOT_FOUND', 'Student not found.');
  }

  const skills = await prisma.studentSkill.findMany({
    where: { studentId },
    include: { skill: true, assessments: true },
  });
  return success(res, skills);
});

// POST /api/v1/faculty/students/:studentId/skill-assessments (FACULTY/ADMIN skill verification)
router.post('/faculty/students/:studentId/skill-assessments', requireRole('FACULTY', 'ADMIN'), async (req, res) => {
  const studentId = parseId(req.params.studentId);
  if (!studentId || !(await canAccessStudent(req, studentId))) {
    return failure(res, 404, 'NOT_FOUND', 'Student not found or access denied.');
  }

  const input = z.object({
    studentSkillId: idSchema,
    assessmentType: z.string().trim().min(1).default('FACULTY_VERIFICATION'),
    score: z.number().min(0).max(100).optional(),
    certificateUrl: z.string().url().optional(),
  }).safeParse(req.body);

  if (!input.success) {
    return failure(res, 422, 'VALIDATION_ERROR', 'Invalid assessment payload.', input.error.issues);
  }

  const faculty = await prisma.faculty.findUnique({ where: { userId: req.authUser!.id } });

  const assessment = await prisma.$transaction(async (tx) => {
    const created = await tx.skillAssessment.create({
      data: {
        studentSkillId: input.data.studentSkillId,
        assessmentType: input.data.assessmentType,
        score: input.data.score,
        certificateUrl: input.data.certificateUrl,
        verifiedBy: faculty?.id || null,
        verifiedAt: new Date(),
      },
    });

    // Mark StudentSkill as verified
    await tx.studentSkill.update({
      where: { id: input.data.studentSkillId },
      data: { verified: true },
    });

    return created;
  });

  return success(res, assessment, 201, 'Skill verified successfully.');
});

export default router;
