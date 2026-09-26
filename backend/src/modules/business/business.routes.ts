import { Router, type Request } from 'express';
import { z } from 'zod';
import { prisma } from '../../shared/database/prisma.js';
import { failure, success } from '../../shared/http.js';
import { requireAuthentication, requireRole } from '../auth/auth.middleware.js';

const router = Router();
router.use(requireAuthentication);
const idSchema = z.string().uuid();
const pageQuery = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20) });

async function studentForUser(userId: string) {
  return prisma.student.findUnique({ where: { userId }, include: { department: true, institution: true, user: { select: { email: true, status: true } } } });
}

async function canAccessStudent(req: Request, studentId: string) {
  const student = await prisma.student.findUnique({ where: { id: studentId }, include: { user: true } });
  if (!student || !req.authUser) return null;
  if (req.authUser.roles.includes('ADMIN')) return student;
  if (req.authUser.roles.includes('TPO')) {
    const tpo = await prisma.tpoOfficer.findUnique({ where: { userId: req.authUser.id } });
    return tpo?.institutionId && tpo.institutionId === student.institutionId ? student : null;
  }
  if (req.authUser.roles.includes('STUDENT')) return student.userId === req.authUser.id ? student : null;
  if (req.authUser.roles.includes('FACULTY')) {
    const faculty = await prisma.faculty.findUnique({ where: { userId: req.authUser.id } });
    return faculty?.departmentId && faculty.departmentId === student.departmentId ? student : null;
  }
  return null;
}

function parseId(value: string | undefined) {
  return value && idSchema.safeParse(value).success ? value : null;
}

router.get('/students/me', requireRole('STUDENT'), async (req, res) => {
  const student = await studentForUser(req.authUser!.id);
  return student ? success(res, student) : failure(res, 404, 'NOT_FOUND', 'Student profile not found.');
});

router.get('/students/:studentId', async (req, res) => {
  const studentId = parseId(req.params.studentId);
  if (!studentId) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid student ID.');
  const student = await canAccessStudent(req, studentId);
  return student ? success(res, student) : failure(res, 404, 'NOT_FOUND', 'Student not found.');
});

router.patch('/students/me', requireRole('STUDENT'), async (req, res) => {
  const input = z.object({ firstName: z.string().trim().min(1).max(100).optional(), lastName: z.string().trim().min(1).max(100).optional() }).safeParse(req.body);
  if (!input.success) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid profile update.', input.error.issues);
  const student = await studentForUser(req.authUser!.id);
  if (!student) return failure(res, 404, 'NOT_FOUND', 'Student profile not found.');
  const updated = await prisma.student.update({ where: { id: student.id }, data: input.data });
  return success(res, updated);
});

router.get('/students/me/academic-records', requireRole('STUDENT'), async (req, res) => {
  const student = await studentForUser(req.authUser!.id);
  if (!student) return failure(res, 404, 'NOT_FOUND', 'Student profile not found.');
  return success(res, await prisma.academicRecord.findMany({ where: { studentId: student.id }, include: { subject: true, semester: true }, orderBy: { semester: { startDate: 'desc' } } }));
});

router.get('/students/me/attendance', requireRole('STUDENT'), async (req, res) => {
  const student = await studentForUser(req.authUser!.id);
  if (!student) return failure(res, 404, 'NOT_FOUND', 'Student profile not found.');
  return success(res, await prisma.attendance.findMany({ where: { studentId: student.id }, include: { subject: true, semester: true } }));
});

router.get('/students/:studentId/academic-records', async (req, res) => {
  const studentId = parseId(req.params.studentId);
  if (!studentId || !(await canAccessStudent(req, studentId))) return failure(res, 404, 'NOT_FOUND', 'Student not found.');
  const query = pageQuery.safeParse(req.query);
  if (!query.success) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid pagination.', query.error.issues);
  const { page, limit } = query.data;
  const data = await prisma.academicRecord.findMany({ where: { studentId }, include: { subject: true, semester: true }, skip: (page - 1) * limit, take: limit, orderBy: { semester: { startDate: 'desc' } } });
  return success(res, data, 200, 'Academic records retrieved.');
});

router.get('/students/:studentId/attendance', async (req, res) => {
  const studentId = parseId(req.params.studentId);
  if (!studentId || !(await canAccessStudent(req, studentId))) return failure(res, 404, 'NOT_FOUND', 'Student not found.');
  const data = await prisma.attendance.findMany({ where: { studentId }, include: { subject: true, semester: true } });
  return success(res, data);
});

router.get('/students/:studentId/assessments', async (req, res) => {
  const studentId = parseId(req.params.studentId);
  if (!studentId || !(await canAccessStudent(req, studentId))) return failure(res, 404, 'NOT_FOUND', 'Student not found.');
  return success(res, await prisma.assessmentResult.findMany({ where: { studentId }, include: { assessment: { include: { subject: true, semester: true } } } }));
});

router.post('/academic-records', requireRole('FACULTY', 'ADMIN'), async (req, res) => {
  const input = z.object({ studentId: idSchema, subjectId: idSchema, semesterId: idSchema, gradePoints: z.number().min(0).max(10), letterGrade: z.string().trim().min(1).max(3) }).safeParse(req.body);
  if (!input.success) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid academic record.', input.error.issues);
  if (!(await canAccessStudent(req, input.data.studentId))) return failure(res, 403, 'FORBIDDEN', 'Student is outside your academic scope.');
  try { return success(res, await prisma.academicRecord.create({ data: input.data }), 201, 'Academic record created.'); } catch { return failure(res, 409, 'CONFLICT', 'Academic record already exists or references invalid data.'); }
});

router.get('/skills', async (req, res) => {
  const query = pageQuery.safeParse(req.query);
  if (!query.success) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid pagination.', query.error.issues);
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;
  const where = search ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { category: { contains: search, mode: 'insensitive' as const } }] } : undefined;
  const data = await prisma.skill.findMany({ where, skip: (query.data.page - 1) * query.data.limit, take: query.data.limit, orderBy: { name: 'asc' } });
  return success(res, data);
});

router.get('/students/me/skills', requireRole('STUDENT'), async (req, res) => {
  const student = await studentForUser(req.authUser!.id);
  if (!student) return failure(res, 404, 'NOT_FOUND', 'Student profile not found.');
  return success(res, await prisma.studentSkill.findMany({ where: { studentId: student.id }, include: { skill: true, assessments: true } }));
});

router.get('/students/:studentId/skills', async (req, res) => {
  const studentId = parseId(req.params.studentId);
  if (!studentId || !(await canAccessStudent(req, studentId))) return failure(res, 404, 'NOT_FOUND', 'Student not found.');
  return success(res, await prisma.studentSkill.findMany({ where: { studentId }, include: { skill: true, assessments: true } }));
});

router.get('/students/me/skills', requireRole('STUDENT'), async (req, res) => {
  const student = await studentForUser(req.authUser!.id);
  if (!student) return failure(res, 404, 'NOT_FOUND', 'Student profile not found.');
  return success(res, await prisma.studentSkill.findMany({ where: { studentId: student.id }, include: { skill: true, assessments: true } }));
});

router.post('/students/me/skills', requireRole('STUDENT'), async (req, res) => {
  const input = z.object({ skillId: idSchema, proficiencyLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).default('BEGINNER') }).safeParse(req.body);
  if (!input.success) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid skill payload.', input.error.issues);
  const student = await studentForUser(req.authUser!.id);
  if (!student) return failure(res, 404, 'NOT_FOUND', 'Student profile not found.');
  try {
    const result = await prisma.studentSkill.create({ data: { studentId: student.id, ...input.data } });
    return success(res, result, 201, 'Skill added.');
  } catch { return failure(res, 409, 'CONFLICT', 'Skill already exists or is invalid.'); }
});

router.get('/careers', async (_req, res) => success(res, await prisma.career.findMany({ include: { careerSkills: { include: { skill: true } } }, orderBy: { title: 'asc' } })));
router.get('/careers/:careerId', async (req, res) => {
  const id = parseId(req.params.careerId);
  if (!id) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid career ID.');
  const career = await prisma.career.findUnique({ where: { id }, include: { careerSkills: { include: { skill: true } } } });
  return career ? success(res, career) : failure(res, 404, 'NOT_FOUND', 'Career not found.');
});

router.get('/students/me/career-recommendations', requireRole('STUDENT'), async (req, res) => {
  const student = await studentForUser(req.authUser!.id);
  if (!student) return failure(res, 404, 'NOT_FOUND', 'Student profile not found.');
  return success(res, await prisma.careerRecommendation.findMany({ where: { studentId: student.id }, include: { career: true }, orderBy: { matchPercentage: 'desc' } }));
});
router.get('/students/:studentId/career-recommendations', async (req, res) => {
  const id = parseId(req.params.studentId);
  if (!id || !(await canAccessStudent(req, id))) return failure(res, 404, 'NOT_FOUND', 'Student not found.');
  return success(res, await prisma.careerRecommendation.findMany({ where: { studentId: id }, include: { career: true }, orderBy: { matchPercentage: 'desc' } }));
});
router.get('/students/me/career-recommendations', requireRole('STUDENT'), async (req, res) => {
  const student = await studentForUser(req.authUser!.id);
  if (!student) return failure(res, 404, 'NOT_FOUND', 'Student profile not found.');
  return success(res, await prisma.careerRecommendation.findMany({ where: { studentId: student.id }, include: { career: true }, orderBy: { matchPercentage: 'desc' } }));
});
router.get('/students/me/skill-gaps', requireRole('STUDENT'), async (req, res) => {
  const student = await studentForUser(req.authUser!.id);
  if (!student) return failure(res, 404, 'NOT_FOUND', 'Student profile not found.');
  return success(res, await prisma.skillGap.findMany({ where: { studentId: student.id }, include: { skill: true }, orderBy: { priority: 'asc' } }));
});
router.get('/students/:studentId/skill-gaps', async (req, res) => {
  const id = parseId(req.params.studentId);
  if (!id || !(await canAccessStudent(req, id))) return failure(res, 404, 'NOT_FOUND', 'Student not found.');
  return success(res, await prisma.skillGap.findMany({ where: { studentId: id }, include: { skill: true }, orderBy: { priority: 'asc' } }));
});
router.get('/students/me/skill-gaps', requireRole('STUDENT'), async (req, res) => {
  const student = await studentForUser(req.authUser!.id);
  if (!student) return failure(res, 404, 'NOT_FOUND', 'Student profile not found.');
  return success(res, await prisma.skillGap.findMany({ where: { studentId: student.id }, include: { skill: true }, orderBy: { priority: 'asc' } }));
});
router.get('/students/me/roadmap', requireRole('STUDENT'), async (req, res) => {
  const student = await studentForUser(req.authUser!.id);
  if (!student) return failure(res, 404, 'NOT_FOUND', 'Student profile not found.');
  const roadmap = await prisma.careerRoadmap.findUnique({ where: { studentId: student.id }, include: { items: { include: { skill: true }, orderBy: { sequenceOrder: 'asc' } } } });
  return roadmap ? success(res, roadmap) : failure(res, 404, 'NOT_FOUND', 'Roadmap not found.');
});
router.get('/students/:studentId/roadmap', async (req, res) => {
  const id = parseId(req.params.studentId);
  if (!id || !(await canAccessStudent(req, id))) return failure(res, 404, 'NOT_FOUND', 'Student not found.');
  const roadmap = await prisma.careerRoadmap.findUnique({ where: { studentId: id }, include: { items: { include: { skill: true }, orderBy: { sequenceOrder: 'asc' } } } });
  return roadmap ? success(res, roadmap) : failure(res, 404, 'NOT_FOUND', 'Roadmap not found.');
});
router.get('/students/me/roadmap', requireRole('STUDENT'), async (req, res) => {
  const student = await studentForUser(req.authUser!.id);
  if (!student) return failure(res, 404, 'NOT_FOUND', 'Student profile not found.');
  const roadmap = await prisma.careerRoadmap.findUnique({ where: { studentId: student.id }, include: { items: { include: { skill: true }, orderBy: { sequenceOrder: 'asc' } } } });
  return roadmap ? success(res, roadmap) : failure(res, 404, 'NOT_FOUND', 'Roadmap not found.');
});
router.get('/students/me/placement-readiness', requireRole('STUDENT'), async (req, res) => {
  const student = await studentForUser(req.authUser!.id);
  if (!student) return failure(res, 404, 'NOT_FOUND', 'Student profile not found.');
  const readiness = await prisma.placementReadiness.findUnique({ where: { studentId: student.id }, include: { predictions: true } });
  return readiness ? success(res, readiness) : failure(res, 404, 'NOT_FOUND', 'Placement readiness not found.');
});
router.get('/students/:studentId/placement-readiness', async (req, res) => {
  const id = parseId(req.params.studentId);
  if (!id || !(await canAccessStudent(req, id))) return failure(res, 404, 'NOT_FOUND', 'Student not found.');
  const readiness = await prisma.placementReadiness.findUnique({ where: { studentId: id }, include: { predictions: true } });
  return readiness ? success(res, readiness) : failure(res, 404, 'NOT_FOUND', 'Placement readiness not found.');
});
router.get('/students/me/placement-readiness', requireRole('STUDENT'), async (req, res) => {
  const student = await studentForUser(req.authUser!.id);
  if (!student) return failure(res, 404, 'NOT_FOUND', 'Student profile not found.');
  const readiness = await prisma.placementReadiness.findUnique({ where: { studentId: student.id }, include: { predictions: true } });
  return readiness ? success(res, readiness) : failure(res, 404, 'NOT_FOUND', 'Placement readiness not found.');
});

router.get('/companies', requireRole('TPO', 'ADMIN'), async (_req, res) => success(res, await prisma.company.findMany({ include: { jobs: true }, orderBy: { name: 'asc' } })));
router.post('/companies', requireRole('TPO', 'ADMIN'), async (req, res) => {
  const input = z.object({ name: z.string().trim().min(1).max(150), website: z.string().url().optional(), industry: z.string().trim().max(100).optional() }).safeParse(req.body);
  if (!input.success) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid company payload.', input.error.issues);
  try { return success(res, await prisma.company.create({ data: input.data }), 201, 'Company created.'); } catch { return failure(res, 409, 'CONFLICT', 'Company already exists.'); }
});
router.get('/jobs', async (_req, res) => success(res, await prisma.job.findMany({ include: { company: true, jobSkills: { include: { skill: true } } }, orderBy: { applicationDeadline: 'asc' } })));
router.get('/jobs/:jobId', async (req, res) => {
  const id = parseId(req.params.jobId); if (!id) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid job ID.');
  const job = await prisma.job.findUnique({ where: { id }, include: { company: true, jobSkills: { include: { skill: true } } } });
  return job ? success(res, job) : failure(res, 404, 'NOT_FOUND', 'Job not found.');
});
router.post('/jobs', requireRole('TPO', 'ADMIN'), async (req, res) => {
  const input = z.object({ companyId: idSchema, title: z.string().trim().min(1).max(150), description: z.string().trim().min(1), minGpa: z.number().min(0).max(10).default(0), applicationDeadline: z.coerce.date(), skillIds: z.array(idSchema).default([]) }).safeParse(req.body);
  if (!input.success) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid job payload.', input.error.issues);
  if (input.data.applicationDeadline <= new Date()) return failure(res, 422, 'VALIDATION_ERROR', 'Application deadline must be in the future.');
  try {
    const job = await prisma.job.create({ data: { companyId: input.data.companyId, title: input.data.title, description: input.data.description, minGpa: input.data.minGpa, applicationDeadline: input.data.applicationDeadline, jobSkills: { create: input.data.skillIds.map((skillId) => ({ skillId })) } }, include: { company: true, jobSkills: true } });
    return success(res, job, 201, 'Job created.');
  } catch { return failure(res, 409, 'CONFLICT', 'Job references invalid data or conflicts with existing data.'); }
});
router.get('/applications', async (req, res) => {
  const student = req.authUser!.roles.includes('STUDENT') ? await studentForUser(req.authUser!.id) : null;
  const where = student ? { studentId: student.id } : {};
  if (!student && !req.authUser!.roles.some((r) => ['TPO', 'ADMIN'].includes(r))) return failure(res, 403, 'FORBIDDEN', 'Insufficient permissions.');
  return success(res, await prisma.jobApplication.findMany({ where, include: { job: { include: { company: true } }, student: true }, orderBy: { appliedAt: 'desc' } }));
});
router.post('/jobs/:jobId/apply', requireRole('STUDENT'), async (req, res) => {
  const jobId = parseId(req.params.jobId); const student = await studentForUser(req.authUser!.id);
  if (!jobId || !student) return failure(res, 404, 'NOT_FOUND', 'Job or student not found.');
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job || job.applicationDeadline < new Date() || student.currentGpa.lt(job.minGpa)) return failure(res, 409, 'CONFLICT', 'Application is not eligible.');
  try { return success(res, await prisma.jobApplication.create({ data: { jobId, studentId: student.id }, include: { job: true } }), 201, 'Application submitted.'); } catch { return failure(res, 409, 'CONFLICT', 'Application already exists.'); }
});

router.get('/resumes', async (req, res) => {
  const student = req.authUser!.roles.includes('STUDENT') ? await studentForUser(req.authUser!.id) : null;
  if (req.authUser!.roles.includes('STUDENT') && !student) return failure(res, 404, 'NOT_FOUND', 'Student profile not found.');
  if (!student && !req.authUser!.roles.some((r) => ['TPO', 'ADMIN'].includes(r))) return failure(res, 403, 'FORBIDDEN', 'Insufficient permissions.');
  return success(res, await prisma.resume.findMany({ where: student ? { studentId: student.id } : {}, select: { id: true, studentId: true, fileName: true, mimeType: true, fileSize: true, status: true, uploadedAt: true }, orderBy: { uploadedAt: 'desc' } }));
});
router.get('/notifications', async (req, res) => success(res, await prisma.notification.findMany({ where: { userId: req.authUser!.id }, orderBy: { createdAt: 'desc' } })));
router.get('/reports', async (req, res) => success(res, await prisma.report.findMany({ where: req.authUser!.roles.includes('ADMIN') ? {} : { generatedBy: req.authUser!.id }, select: { id: true, generatedBy: true, title: true, reportType: true, format: true, status: true, createdAt: true }, orderBy: { createdAt: 'desc' } })));

export default router;
