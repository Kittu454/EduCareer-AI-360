import type { NextFunction, Request, Response } from 'express';
import { authenticateAccessToken } from './auth.service.js';
import type { AuthenticatedUser, AuthRole } from './auth.types.js';

declare module 'express-serve-static-core' {
  interface Request {
    authUser?: AuthenticatedUser;
  }
}

export async function requireAuthentication(req: Request, res: Response, next: NextFunction) {
  const header = req.header('authorization');
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } });
  }
  try {
    req.authUser = await authenticateAccessToken(header.slice('Bearer '.length));
    return next();
  } catch {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } });
  }
}

export function requireRole(...roles: AuthRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.authUser || !roles.some((role) => req.authUser?.roles.includes(role))) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions.' } });
    }
    return next();
  };
}
