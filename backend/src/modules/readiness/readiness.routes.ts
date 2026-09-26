import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../shared/database/prisma.js';
import { failure, success } from '../../shared/http.js';
import { requireAuthentication, requireRole } from '../auth/auth.middleware.js';
import { canAccessStudent, pageQuerySchema, parseId, studentForUser, paginationMeta } from '../../shared/utils.js';

const router = Router();
router.use(requireAuthentication);

// Deterministic calculation engine for placement readiness score
export async function calculateStudentPlacementReadiness(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      studentSkills: { include: { skill: true } },
      academicRecords: true,
      applications: true,
      resumes: { include: { analysis: true } },
      internships: true,
      certifications: true,
    },
  });

  if (!student) return null;

  // 1. Academic score (30% weight, based on CGPA out of 10)
  const gpa = Number(student.currentGpa || 0);
  const academicScore = Math.min(100, (gpa / 10) * 100);

  // 2. Skills score (25% weight, based on skill count & verification)
  const totalSkills = student.studentSkills.length;
  const verifiedSkills = student.studentSkills.filter((s) => s.verified).length;
  const skillsScore = Math.min(100, (totalSkills * 12) + (verifiedSkills * 10));

  // 3. Resume completeness (20% weight)
  const hasResume = student.resumes.length > 0;
  const latestAnalysisScore = student.resumes[0]?.analysis ? Number(student.resumes[0].analysis.overallScore) : 0;
  const resumeScore = hasResume ? Math.max(60, latestAnalysisScore) : 0;

  // 4. Practical experience & applications (25% weight)
  const internshipCount = student.internships.length;
  const certCount = student.certifications.length;
  const appCount = student.applications.length;
  const practicalScore = Math.min(100, (internshipCount * 30) + (certCount * 20) + (appCount * 10));

  // Overall Weighted Score calculation
  const weightedScore = Math.round(
    (academicScore * 0.30) +
    (skillsScore * 0.25) +
    (resumeScore * 0.20) +
    (practicalScore * 0.25)
  );

  const statusLabel = weightedScore >= 80 ? 'PLACEMENT_READY'
    : weightedScore >= 60 ? 'MODERATE_READINESS'
    : 'ACTION_NEEDED';

  const drivers = [];
  if (gpa >= 7.5) drivers.push('Strong academic CGPA');
  else drivers.push('Academic CGPA improvement recommended');

  if (verifiedSkills > 0) drivers.push(`${verifiedSkills} verified technical skill(s)`);
  else drivers.push('Skill verification needed');

  if (hasResume) drivers.push('Resume uploaded & analyzed');
  else drivers.push('Resume profile incomplete');

  const readiness = await prisma.placementReadiness.upsert({
    where: { studentId },
    create: {
      studentId,
      readinessScore: weightedScore,
      statusLabel,
      lastCalculated: new Date(),
    },
    update: {
      readinessScore: weightedScore,
      statusLabel,
      lastCalculated: new Date(),
    },
  });

  // Record historical prediction entry
  await prisma.prediction.create({
    data: {
      readinessId: readiness.id,
      score: weightedScore,
      calculatedAt: new Date(),
    },
  });

  return {
    ...readiness,
    breakdown: {
      academicScore: Math.round(academicScore),
      skillsScore: Math.round(skillsScore),
      resumeScore: Math.round(resumeScore),
      practicalScore: Math.round(practicalScore),
    },
    drivers,
  };
}

// GET /api/v1/students/me/placement-readiness
router.get('/students/me/placement-readiness', requireRole('STUDENT'), async (req, res) => {
  const student = await studentForUser(req.authUser!.id);
  if (!student) return failure(res, 404, 'NOT_FOUND', 'Student profile not found.');

  const result = await calculateStudentPlacementReadiness(student.id);
  return result ? success(res, result) : failure(res, 404, 'NOT_FOUND', 'Placement readiness not calculated.');
});

// GET /api/v1/students/:studentId/placement-readiness
router.get('/students/:studentId/placement-readiness', async (req, res) => {
  const id = parseId(req.params.studentId);
  if (!id || !(await canAccessStudent(req, id))) return failure(res, 404, 'NOT_FOUND', 'Student not found.');

  const result = await calculateStudentPlacementReadiness(id);
  return result ? success(res, result) : failure(res, 404, 'NOT_FOUND', 'Placement readiness not calculated.');
});

// POST /api/v1/placement-readiness/predict
router.post('/predict', async (req, res) => {
  const student = req.authUser!.roles.includes('STUDENT') ? await studentForUser(req.authUser!.id) : null;
  const studentId = student ? student.id : parseId(req.body.studentId);

  if (!studentId || !(await canAccessStudent(req, studentId))) {
    return failure(res, 404, 'NOT_FOUND', 'Student not found.');
  }

  const result = await calculateStudentPlacementReadiness(studentId);
  return success(res, result, 200, 'Placement readiness score calculated.');
});

// GET /api/v1/placement-readiness (TPO/Admin Directory)
router.get('/', requireRole('TPO', 'ADMIN'), async (req, res) => {
  const query = pageQuerySchema.extend({
    statusLabel: z.string().optional(),
    departmentId: z.string().uuid().optional(),
  }).safeParse(req.query);

  if (!query.success) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid query parameters.', query.error.issues);

  const { page, limit, statusLabel, departmentId, search, sort, order } = query.data;

  const where: any = {};
  if (statusLabel) where.statusLabel = statusLabel;
  if (departmentId) where.student = { departmentId };
  if (search) {
    where.student = {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { rollNumber: { contains: search, mode: 'insensitive' } },
      ],
    };
  }

  const total = await prisma.placementReadiness.count({ where });
  const records = await prisma.placementReadiness.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    include: { student: { include: { department: true } }, predictions: { orderBy: { calculatedAt: 'desc' }, take: 3 } },
    orderBy: sort ? { [sort]: order } : { readinessScore: 'desc' },
  });

  return success(res, records, 200, 'Readiness directory retrieved.', paginationMeta(total, page, limit));
});

export default router;
