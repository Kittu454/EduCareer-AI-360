import type { Response } from 'express';

export function success(res: Response, data: unknown, status = 200, message = 'Request successful.', meta?: Record<string, unknown>) {
  return res.status(status).json({
    success: true,
    data,
    message,
    meta: {
      timestamp: new Date().toISOString(),
      ...(meta || {}),
    },
  });
}

export function failure(res: Response, status: number, code: string, message: string, details?: unknown) {
  return res.status(status).json({ success: false, error: { code, message, ...(details === undefined ? {} : { details }) } });
}

export function pagination(req: { query: Record<string, unknown> }) {
  const page = Math.max(1, Number(req.query.page ?? 1) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20) || 20));
  return { page, limit, skip: (page - 1) * limit };
}
