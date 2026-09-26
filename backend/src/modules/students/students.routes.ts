import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../shared/database/prisma.js';
import { failure, success } from '../../shared/http.js';
import { requireAuthentication, requireRole } from '../auth/auth.middleware.js';
import { canAccessStudent, pageQuerySchema, parseId, studentForUser, paginationMeta } from '../../shared/utils.js';

const router = Router();
router.use(requireAuthentication);

// GET /api/v1/students/me
router.get('/me', requireRole('STUDENT'), async (req, res) => {
  const student = await studentForUser(req.authUser!.id);
  return student ? success(res, student) : failure(res, 404, 'NOT_FOUND', 'Student profile not found.');
});

// PATCH /api/v1/students/me
router.patch('/me', requireRole('STUDENT'), async (req, res) => {
  const input = z.object({
    firstName: z.string().trim().min(1).max(100).optional(),
    lastName: z.string().trim().min(1).max(100).optional(),
    departmentId: z.string().uuid().optional(),
    graduationYear: z.number().int().min(2020).max(2035).optional(),
  }).safeParse(req.body);

  if (!input.success) {
    return failure(res, 422, 'VALIDATION_ERROR', 'Invalid profile update.', input.error.issues);
  }

  const student = await studentForUser(req.authUser!.id);
  if (!student) return failure(res, 404, 'NOT_FOUND', 'Student profile not found.');

  const updated = await prisma.student.update({
    where: { id: student.id },
    data: input.data,
    include: { department: true, institution: true },
  });

  return success(res, updated, 200, 'Profile updated successfully.');
});

// GET /api/v1/students (directory for staff)
router.get('/', requireRole('FACULTY', 'TPO', 'ADMIN'), async (req, res) => {
  const query = pageQuerySchema.extend({
    departmentId: z.string().uuid().optional(),
    admissionYear: z.coerce.number().int().optional(),
  }).safeParse(req.query);

  if (!query.success) {
    return failure(res, 422, 'VALIDATION_ERROR', 'Invalid query parameters.', query.error.issues);
  }

  const { page, limit, search, departmentId, admissionYear, sort, order } = query.data;

  const where: any = {};
  if (departmentId) where.departmentId = departmentId;
  if (admissionYear) where.admissionYear = admissionYear;
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { rollNumber: { contains: search, mode: 'insensitive' } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const total = await prisma.student.count({ where });
  const students = await prisma.student.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    include: { department: true, institution: true, user: { select: { email: true, status: true } } },
    orderBy: sort ? { [sort]: order } : { rollNumber: 'asc' },
  });

  return success(res, students, 200, 'Students retrieved successfully.', paginationMeta(total, page, limit));
});

// GET /api/v1/students/:studentId
router.get('/:studentId', async (req, res) => {
  const studentId = parseId(req.params.studentId);
  if (!studentId) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid student ID.');

  const student = await canAccessStudent(req, studentId);
  return student ? success(res, student) : failure(res, 404, 'NOT_FOUND', 'Student not found or access denied.');
});

export default router;
