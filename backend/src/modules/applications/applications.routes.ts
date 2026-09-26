import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../shared/database/prisma.js';
import { failure, success } from '../../shared/http.js';
import { requireAuthentication, requireRole } from '../auth/auth.middleware.js';
import { canAccessStudent, pageQuerySchema, parseId, studentForUser, idSchema, paginationMeta } from '../../shared/utils.js';
import { checkStudentJobEligibility } from '../jobs/jobs.routes.js';

const router = Router();
router.use(requireAuthentication);

const ALLOWED_STATUSES = ['SUBMITTED', 'SHORTLISTED', 'ASSESSMENT', 'INTERVIEW', 'SELECTED', 'REJECTED', 'WITHDRAWN'] as const;

// POST /api/v1/jobs/:jobId/apply
router.post('/jobs/:jobId/apply', requireRole('STUDENT'), async (req, res) => {
  const jobId = parseId(req.params.jobId);
  if (!jobId) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid job ID.');

  const student = await studentForUser(req.authUser!.id);
  if (!student) return failure(res, 404, 'NOT_FOUND', 'Student profile not found.');

  // Check eligibility
  const eligibility = await checkStudentJobEligibility(student.id, jobId);
  if (!eligibility.eligible) {
    return failure(res, 409, 'CONFLICT', 'You do not satisfy the eligibility requirements for this job.', eligibility.checks);
  }

  try {
    const application = await prisma.jobApplication.create({
      data: {
        jobId,
        studentId: student.id,
        status: 'SUBMITTED',
      },
      include: {
        job: { include: { company: true } },
        student: { select: { firstName: true, lastName: true, rollNumber: true } },
      },
    });

    // Create system notification for student
    await prisma.notification.create({
      data: {
        userId: student.userId,
        title: 'Application Submitted',
        content: `Your application for ${eligibility.jobTitle} at ${eligibility.companyName} has been submitted successfully.`,
        notificationType: 'JOB_APPLICATION',
      },
    });

    return success(res, application, 201, 'Application submitted successfully.');
  } catch {
    return failure(res, 409, 'CONFLICT', 'You have already applied for this job.');
  }
});

// GET /api/v1/applications
router.get('/', async (req, res) => {
  const query = pageQuerySchema.extend({
    status: z.enum(ALLOWED_STATUSES).optional(),
    jobId: z.string().uuid().optional(),
    studentId: z.string().uuid().optional(),
  }).safeParse(req.query);

  if (!query.success) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid query parameters.', query.error.issues);

  const { page, limit, status, jobId, studentId, search, sort, order } = query.data;

  const isStudent = req.authUser!.roles.includes('STUDENT');
  const student = isStudent ? await studentForUser(req.authUser!.id) : null;

  if (isStudent && !student) return failure(res, 404, 'NOT_FOUND', 'Student profile not found.');
  if (!isStudent && !req.authUser!.roles.some((r) => ['TPO', 'ADMIN', 'FACULTY'].includes(r))) {
    return failure(res, 403, 'FORBIDDEN', 'Insufficient permissions.');
  }

  const where: any = {};
  if (isStudent) {
    where.studentId = student!.id;
  } else if (studentId) {
    where.studentId = studentId;
  }

  if (jobId) where.jobId = jobId;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { job: { title: { contains: search, mode: 'insensitive' } } },
      { job: { company: { name: { contains: search, mode: 'insensitive' } } } },
      { student: { firstName: { contains: search, mode: 'insensitive' } } },
      { student: { lastName: { contains: search, mode: 'insensitive' } } },
      { student: { rollNumber: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const total = await prisma.jobApplication.count({ where });
  const applications = await prisma.jobApplication.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    include: {
      job: { include: { company: true, jobSkills: { include: { skill: true } } } },
      student: { include: { department: true, user: { select: { email: true } } } },
    },
    orderBy: sort ? { [sort]: order } : { appliedAt: 'desc' },
  });

  return success(res, applications, 200, 'Applications retrieved successfully.', paginationMeta(total, page, limit));
});

// GET /api/v1/applications/:applicationId
router.get('/:applicationId', async (req, res) => {
  const applicationId = parseId(req.params.applicationId);
  if (!applicationId) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid application ID.');

  const application = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: {
      job: { include: { company: true, jobSkills: { include: { skill: true } } } },
      student: { include: { department: true, user: { select: { email: true } } } },
    },
  });

  if (!application) return failure(res, 404, 'NOT_FOUND', 'Application not found.');

  if (!(await canAccessStudent(req, application.studentId))) {
    return failure(res, 403, 'FORBIDDEN', 'Access denied.');
  }

  return success(res, application);
});

// PATCH /api/v1/applications/:applicationId/status (TPO/ADMIN status update)
router.patch('/:applicationId/status', requireRole('TPO', 'ADMIN'), async (req, res) => {
  const applicationId = parseId(req.params.applicationId);
  if (!applicationId) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid application ID.');

  const input = z.object({
    status: z.enum(ALLOWED_STATUSES),
    notes: z.string().trim().optional(),
  }).safeParse(req.body);

  if (!input.success) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid application status.', input.error.issues);

  const existing = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: { job: { include: { company: true } }, student: true },
  });
  if (!existing) return failure(res, 404, 'NOT_FOUND', 'Application not found.');

  const updated = await prisma.jobApplication.update({
    where: { id: applicationId },
    data: { status: input.data.status },
    include: { job: { include: { company: true } }, student: true },
  });

  // Create notification for candidate
  await prisma.notification.create({
    data: {
      userId: existing.student.userId,
      title: 'Application Status Updated',
      content: `Your application status for ${existing.job.title} at ${existing.job.company.name} is now: ${input.data.status}.`,
      notificationType: 'JOB_APPLICATION',
      metadata: { applicationId, newStatus: input.data.status },
    },
  });

  return success(res, updated, 200, `Application status updated to ${input.data.status}.`);
});

// POST /api/v1/applications/:applicationId/withdraw (Student withdraw)
router.post('/:applicationId/withdraw', requireRole('STUDENT'), async (req, res) => {
  const applicationId = parseId(req.params.applicationId);
  if (!applicationId) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid application ID.');

  const student = await studentForUser(req.authUser!.id);
  if (!student) return failure(res, 404, 'NOT_FOUND', 'Student profile not found.');

  const existing = await prisma.jobApplication.findUnique({ where: { id: applicationId } });
  if (!existing || existing.studentId !== student.id) {
    return failure(res, 404, 'NOT_FOUND', 'Application not found.');
  }

  if (['SELECTED', 'REJECTED'].includes(existing.status)) {
    return failure(res, 409, 'CONFLICT', 'Cannot withdraw finalized application.');
  }

  const updated = await prisma.jobApplication.update({
    where: { id: applicationId },
    data: { status: 'WITHDRAWN' },
    include: { job: { include: { company: true } } },
  });

  return success(res, updated, 200, 'Application withdrawn successfully.');
});

export default router;
