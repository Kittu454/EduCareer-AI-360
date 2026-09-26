import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../shared/database/prisma.js';
import { failure, success } from '../../shared/http.js';
import { requireAuthentication, requireRole } from '../auth/auth.middleware.js';
import { canAccessStudent, pageQuerySchema, parseId, studentForUser, idSchema, paginationMeta } from '../../shared/utils.js';
import * as mlService from '../ml/ml.service.js';

const router = Router();
router.use(requireAuthentication);

// GET /api/v1/careers
router.get('/', async (req, res) => {
  const query = pageQuerySchema.safeParse(req.query);
  if (!query.success) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid query parameters.', query.error.issues);

  const { page, limit, search, sort, order } = query.data;
  const where: any = search ? {
    OR: [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ],
  } : {};

  const total = await prisma.career.count({ where });
  const careers = await prisma.career.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    include: { careerSkills: { include: { skill: true } } },
    orderBy: sort ? { [sort]: order } : { title: 'asc' },
  });

  return success(res, careers, 200, 'Careers retrieved successfully.', paginationMeta(total, page, limit));
});

// GET /api/v1/careers/:careerId
router.get('/:careerId', async (req, res) => {
  const id = parseId(req.params.careerId);
  if (!id) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid career ID.');

  const career = await prisma.career.findUnique({
    where: { id },
    include: { careerSkills: { include: { skill: true } } },
  });
  return career ? success(res, career) : failure(res, 404, 'NOT_FOUND', 'Career not found.');
});

// POST /api/v1/careers (ADMIN create career)
router.post('/', requireRole('ADMIN'), async (req, res) => {
  const input = z.object({
    title: z.string().trim().min(1).max(150),
    description: z.string().trim().optional(),
    minGpaRequirement: z.number().min(0).max(10).default(0.0),
    skillIds: z.array(idSchema).optional(),
  }).safeParse(req.body);

  if (!input.success) {
    return failure(res, 422, 'VALIDATION_ERROR', 'Invalid career payload.', input.error.issues);
  }

  try {
    const career = await prisma.career.create({
      data: {
        title: input.data.title,
        description: input.data.description,
        minGpaRequirement: input.data.minGpaRequirement,
        careerSkills: input.data.skillIds ? {
          create: input.data.skillIds.map((skillId) => ({ skillId, importanceWeight: 1.0 })),
        } : undefined,
      },
      include: { careerSkills: { include: { skill: true } } },
    });
    return success(res, career, 201, 'Career created successfully.');
  } catch {
    return failure(res, 409, 'CONFLICT', 'Career with this title already exists.');
  }
});

// POST /api/v1/career-recommendations (Request recommendation computation)
router.post('/recommendations/generate', requireRole('STUDENT', 'FACULTY', 'ADMIN'), async (req, res) => {
  const student = req.authUser!.roles.includes('STUDENT') ? await studentForUser(req.authUser!.id) : null;
  const studentId = student ? student.id : parseId(req.body.studentId);

  if (!studentId || !(await canAccessStudent(req, studentId))) {
    return failure(res, 404, 'NOT_FOUND', 'Student not found.');
  }

  const studentSkills = await prisma.studentSkill.findMany({
    where: { studentId },
    include: { skill: true },
  });
  const skillNames = studentSkills.map((s) => s.skill.name);
  const targetStudent = await prisma.student.findUnique({ where: { id: studentId } });
  const gpa = Number(targetStudent?.currentGpa || 0.0);

  // Call ML service or use deterministic fallback
  const mlRes = await mlService.recommendCareers({
    verified_skills: skillNames,
    interests: [],
    academic_gpa: gpa,
  });

  const careers = await prisma.career.findMany({
    include: { careerSkills: { include: { skill: true } } },
  });

  const recommendations = [];

  for (const c of careers) {
    const requiredSkills = c.careerSkills.map((cs) => cs.skill.name);
    let matchedCount = 0;
    for (const rs of requiredSkills) {
      if (skillNames.includes(rs)) matchedCount++;
    }

    const matchPercentage = requiredSkills.length > 0
      ? Math.round((matchedCount / requiredSkills.length) * 100)
      : (gpa >= Number(c.minGpaRequirement) ? 75 : 40);

    const rec = await prisma.careerRecommendation.upsert({
      where: { studentId_careerId: { studentId, careerId: c.id } },
      create: {
        studentId,
        careerId: c.id,
        matchPercentage,
        rationale: mlRes?.recommendations.find((r) => r.career_title === c.title)?.rationale
          || `Skill match: ${matchedCount}/${requiredSkills.length} required skills satisfied.`,
      },
      update: {
        matchPercentage,
        rationale: `Skill match: ${matchedCount}/${requiredSkills.length} required skills satisfied.`,
      },
      include: { career: true },
    });
    recommendations.push(rec);
  }

  return success(res, recommendations, 200, 'Career recommendations updated.');
});

// GET /api/v1/students/me/career-recommendations
router.get('/students/me/career-recommendations', requireRole('STUDENT'), async (req, res) => {
  const student = await studentForUser(req.authUser!.id);
  if (!student) return failure(res, 404, 'NOT_FOUND', 'Student profile not found.');

  const recs = await prisma.careerRecommendation.findMany({
    where: { studentId: student.id },
    include: { career: { include: { careerSkills: { include: { skill: true } } } } },
    orderBy: { matchPercentage: 'desc' },
  });
  return success(res, recs);
});

// GET /api/v1/students/:studentId/career-recommendations
router.get('/students/:studentId/career-recommendations', async (req, res) => {
  const id = parseId(req.params.studentId);
  if (!id || !(await canAccessStudent(req, id))) return failure(res, 404, 'NOT_FOUND', 'Student not found.');

  const recs = await prisma.careerRecommendation.findMany({
    where: { studentId: id },
    include: { career: { include: { careerSkills: { include: { skill: true } } } } },
    orderBy: { matchPercentage: 'desc' },
  });
  return success(res, recs);
});

// POST /api/v1/skill-gaps/analyze
router.post('/skill-gaps/analyze', async (req, res) => {
  const input = z.object({
    targetCareerId: idSchema,
    studentId: idSchema.optional(),
  }).safeParse(req.body);

  if (!input.success) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid target career.', input.error.issues);

  const student = req.authUser!.roles.includes('STUDENT') ? await studentForUser(req.authUser!.id) : null;
  const studentId = student ? student.id : input.data.studentId;

  if (!studentId || !(await canAccessStudent(req, studentId))) {
    return failure(res, 404, 'NOT_FOUND', 'Student not found.');
  }

  const career = await prisma.career.findUnique({
    where: { id: input.data.targetCareerId },
    include: { careerSkills: { include: { skill: true } } },
  });
  if (!career) return failure(res, 404, 'NOT_FOUND', 'Career not found.');

  const studentSkills = await prisma.studentSkill.findMany({
    where: { studentId },
    select: { skillId: true },
  });
  const ownedSkillIds = new Set(studentSkills.map((s) => s.skillId));

  const missingSkills = career.careerSkills.filter((cs) => !ownedSkillIds.has(cs.skillId));

  const gaps = [];
  for (const cs of missingSkills) {
    const priority = Number(cs.importanceWeight) >= 0.8 ? 'HIGH' : Number(cs.importanceWeight) >= 0.5 ? 'MEDIUM' : 'LOW';
    const gap = await prisma.skillGap.upsert({
      where: { studentId_skillId: { studentId, skillId: cs.skillId } },
      create: { studentId, skillId: cs.skillId, priority },
      update: { priority },
      include: { skill: true },
    });
    gaps.push(gap);
  }

  return success(res, gaps, 200, 'Skill gap analysis complete.');
});

// GET /api/v1/students/me/skill-gaps
router.get('/students/me/skill-gaps', requireRole('STUDENT'), async (req, res) => {
  const student = await studentForUser(req.authUser!.id);
  if (!student) return failure(res, 404, 'NOT_FOUND', 'Student profile not found.');

  const gaps = await prisma.skillGap.findMany({
    where: { studentId: student.id },
    include: { skill: true },
    orderBy: { priority: 'asc' },
  });
  return success(res, gaps);
});

// GET /api/v1/students/:studentId/skill-gaps
router.get('/students/:studentId/skill-gaps', async (req, res) => {
  const id = parseId(req.params.studentId);
  if (!id || !(await canAccessStudent(req, id))) return failure(res, 404, 'NOT_FOUND', 'Student not found.');

  const gaps = await prisma.skillGap.findMany({
    where: { studentId: id },
    include: { skill: true },
    orderBy: { priority: 'asc' },
  });
  return success(res, gaps);
});

// GET /api/v1/students/me/roadmap
router.get('/students/me/roadmap', requireRole('STUDENT'), async (req, res) => {
  const student = await studentForUser(req.authUser!.id);
  if (!student) return failure(res, 404, 'NOT_FOUND', 'Student profile not found.');

  const roadmap = await prisma.careerRoadmap.findUnique({
    where: { studentId: student.id },
    include: { items: { include: { skill: true }, orderBy: { sequenceOrder: 'asc' } } },
  });
  return roadmap ? success(res, roadmap) : failure(res, 404, 'NOT_FOUND', 'Roadmap not found.');
});

// GET /api/v1/students/:studentId/roadmap
router.get('/students/:studentId/roadmap', async (req, res) => {
  const id = parseId(req.params.studentId);
  if (!id || !(await canAccessStudent(req, id))) return failure(res, 404, 'NOT_FOUND', 'Student not found.');

  const roadmap = await prisma.careerRoadmap.findUnique({
    where: { studentId: id },
    include: { items: { include: { skill: true }, orderBy: { sequenceOrder: 'asc' } } },
  });
  return roadmap ? success(res, roadmap) : failure(res, 404, 'NOT_FOUND', 'Roadmap not found.');
});

// POST /api/v1/roadmaps (Create or regenerate roadmap for student)
router.post('/roadmaps', async (req, res) => {
  const input = z.object({
    targetCareerId: idSchema,
    studentId: idSchema.optional(),
  }).safeParse(req.body);

  if (!input.success) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid target career.', input.error.issues);

  const student = req.authUser!.roles.includes('STUDENT') ? await studentForUser(req.authUser!.id) : null;
  const studentId = student ? student.id : input.data.studentId;

  if (!studentId || !(await canAccessStudent(req, studentId))) {
    return failure(res, 404, 'NOT_FOUND', 'Student not found.');
  }

  const career = await prisma.career.findUnique({
    where: { id: input.data.targetCareerId },
    include: { careerSkills: { include: { skill: true } } },
  });
  if (!career) return failure(res, 404, 'NOT_FOUND', 'Career not found.');

  const existingRoadmap = await prisma.careerRoadmap.findUnique({ where: { studentId } });
  if (existingRoadmap) {
    await prisma.roadmapItem.deleteMany({ where: { roadmapId: existingRoadmap.id } });
    await prisma.careerRoadmap.delete({ where: { id: existingRoadmap.id } });
  }

  const roadmap = await prisma.careerRoadmap.create({
    data: {
      studentId,
      targetCareer: career.title,
      items: {
        create: career.careerSkills.map((cs, idx) => ({
          skillId: cs.skillId,
          title: `Master ${cs.skill.name}`,
          sequenceOrder: idx + 1,
          status: idx === 0 ? 'CURRENT' : 'LOCKED',
          resourceUrl: `https://learning.educareer.ai/skills/${cs.skill.name.toLowerCase().replace(/\s+/g, '-')}`,
        })),
      },
    },
    include: { items: { include: { skill: true }, orderBy: { sequenceOrder: 'asc' } } },
  });

  return success(res, roadmap, 201, 'Career roadmap generated.');
});

// PATCH /api/v1/roadmaps/:roadmapId/items/:itemId
router.patch('/roadmaps/:roadmapId/items/:itemId', async (req, res) => {
  const roadmapId = parseId(req.params.roadmapId);
  const itemId = parseId(req.params.itemId);
  if (!roadmapId || !itemId) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid ID parameters.');

  const input = z.object({
    status: z.enum(['LOCKED', 'CURRENT', 'COMPLETED']),
  }).safeParse(req.body);

  if (!input.success) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid status payload.', input.error.issues);

  const item = await prisma.roadmapItem.findFirst({
    where: { id: itemId, roadmapId },
    include: { roadmap: true },
  });
  if (!item) return failure(res, 404, 'NOT_FOUND', 'Roadmap item not found.');

  if (!(await canAccessStudent(req, item.roadmap.studentId))) {
    return failure(res, 403, 'FORBIDDEN', 'Access denied.');
  }

  const updated = await prisma.roadmapItem.update({
    where: { id: itemId },
    data: { status: input.data.status },
    include: { skill: true },
  });

  return success(res, updated, 200, 'Roadmap item updated.');
});

// POST /api/v1/simulator/career (Hypothetical simulator)
router.post('/simulator/career', async (req, res) => {
  const input = z.object({
    targetCareerId: idSchema,
    simulatedSkillIds: z.array(idSchema),
    simulatedGpa: z.number().min(0).max(10),
  }).safeParse(req.body);

  if (!input.success) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid simulator payload.', input.error.issues);

  const career = await prisma.career.findUnique({
    where: { id: input.data.targetCareerId },
    include: { careerSkills: { include: { skill: true } } },
  });
  if (!career) return failure(res, 404, 'NOT_FOUND', 'Target career not found.');

  const student = await studentForUser(req.authUser!.id);
  const currentSkills = student ? await prisma.studentSkill.findMany({ where: { studentId: student.id }, include: { skill: true } }) : [];
  const currentSkillNames = currentSkills.map((s) => s.skill.name);
  const currentGpa = Number(student?.currentGpa || 7.0);

  const simulatedSkillsObjects = await prisma.skill.findMany({ where: { id: { in: input.data.simulatedSkillIds } } });
  const simulatedSkillNames = simulatedSkillsObjects.map((s) => s.name);
  const combinedSkillNames = Array.from(new Set([...currentSkillNames, ...simulatedSkillNames]));

  const requiredSkillNames = career.careerSkills.map((cs) => cs.skill.name);
  const origMatched = requiredSkillNames.filter((s) => currentSkillNames.includes(s)).length;
  const simMatched = requiredSkillNames.filter((s) => combinedSkillNames.includes(s)).length;

  const originalMatchPercentage = requiredSkillNames.length > 0 ? Math.round((origMatched / requiredSkillNames.length) * 100) : 50;
  const simulatedMatchPercentage = requiredSkillNames.length > 0 ? Math.round((simMatched / requiredSkillNames.length) * 100) : 85;

  return success(res, {
    targetCareerTitle: career.title,
    originalMatchPercentage,
    simulatedMatchPercentage,
    improvedScoreDifference: simulatedMatchPercentage - originalMatchPercentage,
    currentGpa,
    simulatedGpa: input.data.simulatedGpa,
  });
});

export default router;
