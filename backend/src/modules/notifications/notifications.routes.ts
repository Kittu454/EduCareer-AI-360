import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../shared/database/prisma.js';
import { failure, success } from '../../shared/http.js';
import { requireAuthentication } from '../auth/auth.middleware.js';
import { pageQuerySchema, parseId, paginationMeta } from '../../shared/utils.js';

const router = Router();
router.use(requireAuthentication);

// GET /api/v1/notifications
router.get('/', async (req, res) => {
  const query = pageQuerySchema.extend({
    isRead: z.coerce.boolean().optional(),
  }).safeParse(req.query);

  if (!query.success) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid query.', query.error.issues);

  const { page, limit, isRead, sort, order } = query.data;
  const userId = req.authUser!.id;

  const where: any = { userId };
  if (isRead !== undefined) where.isRead = isRead;

  const total = await prisma.notification.count({ where });
  const notifications = await prisma.notification.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: sort ? { [sort]: order } : { createdAt: 'desc' },
  });

  return success(res, notifications, 200, 'Notifications retrieved.', paginationMeta(total, page, limit));
});

// GET /api/v1/notifications/unread-count
router.get('/unread-count', async (req, res) => {
  const count = await prisma.notification.count({
    where: { userId: req.authUser!.id, isRead: false },
  });
  return success(res, { unreadCount: count });
});

// PATCH /api/v1/notifications/:notificationId
router.patch('/:notificationId', async (req, res) => {
  const notificationId = parseId(req.params.notificationId);
  if (!notificationId) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid notification ID.');

  const input = z.object({ isRead: z.boolean() }).safeParse(req.body);
  if (!input.success) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid payload.', input.error.issues);

  const existing = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!existing || existing.userId !== req.authUser!.id) {
    return failure(res, 404, 'NOT_FOUND', 'Notification not found.');
  }

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: input.data.isRead },
  });

  return success(res, updated);
});

// POST /api/v1/notifications/read-all
router.post('/read-all', async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.authUser!.id, isRead: false },
    data: { isRead: true },
  });
  return success(res, null, 200, 'All notifications marked as read.');
});

export default router;
