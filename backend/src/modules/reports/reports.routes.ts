import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../shared/database/prisma.js';
import { failure, success } from '../../shared/http.js';
import { requireAuthentication, requireRole } from '../auth/auth.middleware.js';
import { pageQuerySchema, parseId, paginationMeta } from '../../shared/utils.js';

const router = Router();
router.use(requireAuthentication);

// POST /api/v1/reports (Trigger report generation)
router.post('/', requireRole('TPO', 'ADMIN', 'FACULTY'), async (req, res) => {
  const input = z.object({
    title: z.string().trim().min(1).max(150),
    reportType: z.enum(['PLACEMENT_SUMMARY', 'STUDENT_READINESS', 'APPLICATION_PIPELINE', 'SKILL_DEMAND']),
    format: z.enum(['CSV', 'JSON', 'PDF']).default('CSV'),
  }).safeParse(req.body);

  if (!input.success) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid report request.', input.error.issues);

  const report = await prisma.report.create({
    data: {
      generatedBy: req.authUser!.id,
      title: input.data.title,
      reportType: input.data.reportType,
      format: input.data.format,
      filePath: `reports/${Date.now()}_${input.data.reportType.toLowerCase()}.${input.data.format.toLowerCase()}`,
      status: 'COMPLETED',
    },
  });

  return success(res, report, 201, 'Report generated successfully.');
});

// GET /api/v1/reports
router.get('/', async (req, res) => {
  const query = pageQuerySchema.safeParse(req.query);
  if (!query.success) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid query.', query.error.issues);

  const { page, limit, sort, order } = query.data;
  const isAdmin = req.authUser!.roles.includes('ADMIN');
  const where = isAdmin ? {} : { generatedBy: req.authUser!.id };

  const total = await prisma.report.count({ where });
  const reports = await prisma.report.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: sort ? { [sort]: order } : { createdAt: 'desc' },
  });

  return success(res, reports, 200, 'Reports retrieved.', paginationMeta(total, page, limit));
});

// GET /api/v1/tpo/reports/placement (Structured data view for CSV/Table export)
router.get('/tpo/placement-data', requireRole('TPO', 'ADMIN'), async (req, res) => {
  const applications = await prisma.jobApplication.findMany({
    include: {
      student: { include: { department: true } },
      job: { include: { company: true } },
    },
    orderBy: { appliedAt: 'desc' },
  });

  const exportData = applications.map((a) => ({
    applicationId: a.id,
    rollNumber: a.student.rollNumber,
    studentName: `${a.student.firstName} ${a.student.lastName}`,
    department: a.student.department?.name || 'N/A',
    gpa: Number(a.student.currentGpa),
    company: a.job.company.name,
    jobTitle: a.job.title,
    status: a.status,
    appliedAt: a.appliedAt.toISOString(),
  }));

  return success(res, exportData, 200, 'Placement dataset generated.');
});

export default router;
