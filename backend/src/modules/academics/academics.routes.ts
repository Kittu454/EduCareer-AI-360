import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../shared/database/prisma.js';
import { failure, success } from '../../shared/http.js';
import { requireAuthentication, requireRole } from '../auth/auth.middleware.js';
import { canAccessStudent, pageQuerySchema, parseId, studentForUser, idSchema, paginationMeta } from '../../shared/utils.js';

const router = Router();
router.use(requireAuthentication);

// GET /api/v1/semesters
router.get('/semesters', async (_req, res) => {
  const semesters = await prisma.semester.findMany({ orderBy: { startDate: 'desc' } });
  return success(res, semesters);
});

// GET /api/v1/subjects
router.get('/subjects', async (req, res) => {
  const departmentId = typeof req.query.departmentId === 'string' ? parseId(req.query.departmentId) : null;
  const where = departmentId ? { departmentId } : {};
  const subjects = await prisma.subject.findMany({ where, include: { department: true }, orderBy: { code: 'asc' } });
  return success(res, subjects);
});

// GET /api/v1/students/me/academic-records
router.get('/students/me/academic-records', requireRole('STUDENT'), async (req, res) => {
  const student = await studentForUser(req.authUser!.id);
  if (!student) return failure(res, 404, 'NOT_FOUND', 'Student profile not found.');

  const records = await prisma.academicRecord.findMany({
    where: { studentId: student.id },
    include: { subject: true, semester: true },
    orderBy: { semester: { startDate: 'desc' } },
  });
  return success(res, records);
});

// GET /api/v1/students/me/attendance
router.get('/students/me/attendance', requireRole('STUDENT'), async (req, res) => {
  const student = await studentForUser(req.authUser!.id);
  if (!student) return failure(res, 404, 'NOT_FOUND', 'Student profile not found.');

  const attendance = await prisma.attendance.findMany({
    where: { studentId: student.id },
    include: { subject: true, semester: true },
  });
  return success(res, attendance);
});

// GET /api/v1/students/:studentId/academic-records
router.get('/students/:studentId/academic-records', async (req, res) => {
  const studentId = parseId(req.params.studentId);
  if (!studentId || !(await canAccessStudent(req, studentId))) {
    return failure(res, 404, 'NOT_FOUND', 'Student not found.');
  }

  const query = pageQuerySchema.safeParse(req.query);
  if (!query.success) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid pagination.', query.error.issues);
  const { page, limit } = query.data;

  const total = await prisma.academicRecord.count({ where: { studentId } });
  const data = await prisma.academicRecord.findMany({
    where: { studentId },
    include: { subject: true, semester: true },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { semester: { startDate: 'desc' } },
  });
  return success(res, data, 200, 'Academic records retrieved.', paginationMeta(total, page, limit));
});

// GET /api/v1/students/:studentId/attendance
router.get('/students/:studentId/attendance', async (req, res) => {
  const studentId = parseId(req.params.studentId);
  if (!studentId || !(await canAccessStudent(req, studentId))) {
    return failure(res, 404, 'NOT_FOUND', 'Student not found.');
  }

  const data = await prisma.attendance.findMany({
    where: { studentId },
    include: { subject: true, semester: true },
  });
  return success(res, data);
});

// GET /api/v1/students/:studentId/assessments
router.get('/students/:studentId/assessments', async (req, res) => {
  const studentId = parseId(req.params.studentId);
  if (!studentId || !(await canAccessStudent(req, studentId))) {
    return failure(res, 404, 'NOT_FOUND', 'Student not found.');
  }

  const data = await prisma.assessmentResult.findMany({
    where: { studentId },
    include: { assessment: { include: { subject: true, semester: true } } },
  });
  return success(res, data);
});

// POST /api/v1/academic-records (FACULTY/ADMIN create grade)
router.post('/academic-records', requireRole('FACULTY', 'ADMIN'), async (req, res) => {
  const input = z.object({
    studentId: idSchema,
    subjectId: idSchema,
    semesterId: idSchema,
    gradePoints: z.number().min(0).max(10),
    letterGrade: z.string().trim().min(1).max(3),
  }).safeParse(req.body);

  if (!input.success) {
    return failure(res, 422, 'VALIDATION_ERROR', 'Invalid academic record.', input.error.issues);
  }

  if (!(await canAccessStudent(req, input.data.studentId))) {
    return failure(res, 403, 'FORBIDDEN', 'Student is outside your academic scope.');
  }

  try {
    const record = await prisma.academicRecord.create({
      data: input.data,
      include: { subject: true, semester: true, student: true },
    });

    // Automatically recalculate student's overall GPA
    await recalculateStudentGpa(input.data.studentId);

    return success(res, record, 201, 'Academic record created.');
  } catch {
    return failure(res, 409, 'CONFLICT', 'Academic record already exists or references invalid data.');
  }
});

// PATCH /api/v1/academic-records/:recordId (FACULTY/ADMIN edit grade)
router.patch('/academic-records/:recordId', requireRole('FACULTY', 'ADMIN'), async (req, res) => {
  const recordId = parseId(req.params.recordId);
  if (!recordId) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid record ID.');

  const input = z.object({
    gradePoints: z.number().min(0).max(10).optional(),
    letterGrade: z.string().trim().min(1).max(3).optional(),
  }).safeParse(req.body);

  if (!input.success) {
    return failure(res, 422, 'VALIDATION_ERROR', 'Invalid grade update payload.', input.error.issues);
  }

  const existing = await prisma.academicRecord.findUnique({ where: { id: recordId } });
  if (!existing) return failure(res, 404, 'NOT_FOUND', 'Academic record not found.');

  if (!(await canAccessStudent(req, existing.studentId))) {
    return failure(res, 403, 'FORBIDDEN', 'Student is outside your academic scope.');
  }

  const updated = await prisma.academicRecord.update({
    where: { id: recordId },
    data: input.data,
    include: { subject: true, semester: true },
  });

  await recalculateStudentGpa(existing.studentId);

  return success(res, updated, 200, 'Academic record updated.');
});

// Helper function: Recalculate CGPA for student based on academic records
async function recalculateStudentGpa(studentId: string) {
  const records = await prisma.academicRecord.findMany({
    where: { studentId },
    include: { subject: true },
  });

  if (records.length === 0) return;

  let totalPoints = 0;
  let totalCredits = 0;

  for (const r of records) {
    const credits = r.subject?.credits || 3;
    totalPoints += Number(r.gradePoints) * credits;
    totalCredits += credits;
  }

  const gpa = totalCredits > 0 ? (totalPoints / totalCredits) : 0;
  await prisma.student.update({
    where: { id: studentId },
    data: { currentGpa: Number(gpa.toFixed(2)) },
  });
}

export default router;
