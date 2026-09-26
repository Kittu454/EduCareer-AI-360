import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../shared/database/prisma.js';
import { failure, success } from '../../shared/http.js';
import { requireAuthentication, requireRole } from '../auth/auth.middleware.js';
import { pageQuerySchema, parseId, paginationMeta } from '../../shared/utils.js';
import { mlHealthCheck } from '../ml/ml.service.js';

const router = Router();
router.use(requireAuthentication);
router.use(requireRole('ADMIN'));

// GET /api/v1/admin/users
router.get('/users', async (req, res) => {
  const query = pageQuerySchema.extend({
    role: z.string().optional(),
    status: z.string().optional(),
  }).safeParse(req.query);

  if (!query.success) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid query.', query.error.issues);

  const { page, limit, role, status, search, sort, order } = query.data;

  const where: any = {};
  if (status) where.status = status;
  if (role) where.userRoles = { some: { role: { name: role } } };
  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { student: { firstName: { contains: search, mode: 'insensitive' } } },
      { student: { lastName: { contains: search, mode: 'insensitive' } } },
      { faculty: { firstName: { contains: search, mode: 'insensitive' } } },
      { tpoOfficer: { firstName: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const total = await prisma.user.count({ where });
  const users = await prisma.user.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    select: {
      id: true,
      email: true,
      status: true,
      emailVerifiedAt: true,
      createdAt: true,
      userRoles: { select: { role: { select: { name: true } } } },
      student: { select: { firstName: true, lastName: true, rollNumber: true } },
      faculty: { select: { firstName: true, lastName: true, employeeId: true } },
      tpoOfficer: { select: { firstName: true, lastName: true } },
    },
    orderBy: sort ? { [sort]: order } : { createdAt: 'desc' },
  });

  const formattedUsers = users.map((u) => ({
    id: u.id,
    email: u.email,
    status: u.status,
    emailVerifiedAt: u.emailVerifiedAt,
    createdAt: u.createdAt,
    roles: u.userRoles.map((r) => r.role.name),
    profile: u.student || u.faculty || u.tpoOfficer || null,
  }));

  return success(res, formattedUsers, 200, 'Users retrieved.', paginationMeta(total, page, limit));
});

// PATCH /api/v1/admin/users/:userId/roles
router.patch('/users/:userId/roles', async (req, res) => {
  const userId = parseId(req.params.userId);
  if (!userId) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid user ID.');

  const input = z.object({
    roles: z.array(z.enum(['STUDENT', 'FACULTY', 'TPO', 'ADMIN'])).min(1),
  }).safeParse(req.body);

  if (!input.success) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid roles payload.', input.error.issues);

  const existingUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!existingUser) return failure(res, 404, 'NOT_FOUND', 'User not found.');

  await prisma.$transaction(async (tx) => {
    // Delete current roles
    await tx.userRole.deleteMany({ where: { userId } });

    // Assign new roles
    for (const roleName of input.data.roles) {
      const role = await tx.role.upsert({
        where: { name: roleName },
        create: { name: roleName, description: `${roleName} role` },
        update: {},
      });
      await tx.userRole.create({ data: { userId, roleId: role.id } });
    }

    // Log action to Audit Trail
    await tx.auditLog.create({
      data: {
        actorId: req.authUser!.id,
        actionType: 'ROLE_UPDATE',
        tableName: 'user_roles',
        recordId: userId,
        newValues: { roles: input.data.roles },
      },
    });
  });

  return success(res, { userId, roles: input.data.roles }, 200, 'User roles updated successfully.');
});

// PATCH /api/v1/admin/users/:userId/status
router.patch('/users/:userId/status', async (req, res) => {
  const userId = parseId(req.params.userId);
  if (!userId) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid user ID.');

  const input = z.object({
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
  }).safeParse(req.body);

  if (!input.success) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid status payload.', input.error.issues);

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { status: input.data.status },
    select: { id: true, email: true, status: true },
  });

  return success(res, updated, 200, 'User status updated.');
});

// GET /api/v1/admin/system/health
router.get('/system/health', async (_req, res) => {
  let dbStatus = 'UNKNOWN';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'HEALTHY';
  } catch {
    dbStatus = 'UNHEALTHY';
  }

  const mlHealthy = await mlHealthCheck();

  return success(res, {
    status: dbStatus === 'HEALTHY' && mlHealthy ? 'HEALTHY' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    services: {
      backend: 'HEALTHY',
      database: dbStatus,
      mlService: mlHealthy ? 'HEALTHY' : 'UNAVAILABLE',
    },
  });
});

// GET /api/v1/admin/audit-logs
router.get('/audit-logs', async (req, res) => {
  const query = pageQuerySchema.extend({
    actionType: z.string().optional(),
    tableName: z.string().optional(),
  }).safeParse(req.query);

  if (!query.success) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid query.', query.error.issues);

  const { page, limit, actionType, tableName, search, sort, order } = query.data;

  const where: any = {};
  if (actionType) where.actionType = actionType;
  if (tableName) where.tableName = tableName;
  if (search) {
    where.OR = [
      { actionType: { contains: search, mode: 'insensitive' } },
      { tableName: { contains: search, mode: 'insensitive' } },
    ];
  }

  const total = await prisma.auditLog.count({ where });
  const logs = await prisma.auditLog.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    include: { actor: { select: { email: true } } },
    orderBy: sort ? { [sort]: order } : { createdAt: 'desc' },
  });

  return success(res, logs, 200, 'Audit logs retrieved.', paginationMeta(total, page, limit));
});

export default router;
