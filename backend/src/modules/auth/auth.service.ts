import { createHash, randomBytes, scrypt as nodeScrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { prisma } from '../../shared/database/prisma.js';
import { SignJWT, jwtVerify } from 'jose';
import type { AuthenticatedUser, AuthRole } from './auth.types.js';

const scrypt = promisify(nodeScrypt);
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

function jwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters');
  }
  return new TextEncoder().encode(secret);
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${derived.toString('hex')}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, salt, key] = stored.split('$');
  if (algorithm !== 'scrypt' || !salt || !key) return false;
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(key, 'hex');
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

function tokenForUser(user: AuthenticatedUser): Promise<string> {
  return new SignJWT({ email: user.email, roles: user.roles })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(user.id)
    .setIssuedAt()
    .setIssuer('educareer-ai-360-backend')
    .setAudience('educareer-ai-360-frontend')
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(jwtSecret());
}

async function userWithRoles(userId: string): Promise<AuthenticatedUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { userRoles: { include: { role: true } } },
  });
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    roles: user.userRoles.map(({ role }) => role.name as AuthRole),
  };
}

export function exposeDevelopmentToken(token: string): string | undefined {
  return process.env.AUTH_EXPOSE_DEV_TOKENS === 'true' ? token : undefined;
}

export async function register(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
  admissionYear: number;
}) {
  const passwordHash = await hashPassword(input.password);
  const rawVerificationToken = randomBytes(32).toString('base64url');
  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({ where: { email: input.email } });
    if (existing) throw new Error('EMAIL_EXISTS');
    const role = await tx.role.upsert({
      where: { name: 'STUDENT' },
      update: {},
      create: { name: 'STUDENT', description: 'Student user' },
    });
    const user = await tx.user.create({
      data: {
        email: input.email,
        passwordHash,
        // In non-production there is no real email delivery, so accounts are
        // auto-verified to keep the signup -> authenticated flow usable locally.
        // Production keeps email verification mandatory.
        emailVerifiedAt: process.env.NODE_ENV === 'production' ? null : new Date(),
        student: {
          create: {
            firstName: input.firstName,
            lastName: input.lastName,
            rollNumber: input.rollNumber,
            admissionYear: input.admissionYear,
          },
        },
      },
    });
    await tx.userRole.create({ data: { userId: user.id, roleId: role.id } });
    await tx.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(rawVerificationToken),
        expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
      },
    });
    return user;
  });
  return { userId: result.id, verificationToken: exposeDevelopmentToken(rawVerificationToken) };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { userRoles: { include: { role: true } } },
  });
  if (!user || !(await verifyPassword(password, user.passwordHash))) throw new Error('INVALID_CREDENTIALS');
  if (user.status !== 'ACTIVE') throw new Error('ACCOUNT_UNAVAILABLE');
  if (!user.emailVerifiedAt) throw new Error('EMAIL_NOT_VERIFIED');
  const authUser: AuthenticatedUser = {
    id: user.id,
    email: user.email,
    roles: user.userRoles.map(({ role }) => role.name as AuthRole),
  };
  const accessToken = await tokenForUser(authUser);
  const refreshToken = randomBytes(48).toString('base64url');
  await prisma.refreshSession.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });
  return { user: authUser, accessToken, refreshToken, expiresIn: ACCESS_TOKEN_TTL_SECONDS };
}

export async function refresh(rawToken: string) {
  const session = await prisma.refreshSession.findUnique({ where: { tokenHash: hashToken(rawToken) } });
  if (!session || session.revokedAt || session.expiresAt <= new Date()) throw new Error('INVALID_REFRESH_TOKEN');
  const user = await userWithRoles(session.userId);
  if (!user) throw new Error('INVALID_REFRESH_TOKEN');
  return { user, accessToken: await tokenForUser(user), expiresIn: ACCESS_TOKEN_TTL_SECONDS };
}

export async function revokeRefreshToken(rawToken: string): Promise<void> {
  await prisma.refreshSession.updateMany({
    where: { tokenHash: hashToken(rawToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function verifyEmail(rawToken: string) {
  const token = await prisma.emailVerificationToken.findUnique({ where: { tokenHash: hashToken(rawToken) } });
  if (!token || token.usedAt || token.expiresAt <= new Date()) throw new Error('INVALID_VERIFICATION_TOKEN');
  await prisma.$transaction([
    prisma.user.update({ where: { id: token.userId }, data: { emailVerifiedAt: new Date() } }),
    prisma.emailVerificationToken.update({ where: { id: token.id }, data: { usedAt: new Date() } }),
  ]);
}

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return undefined;
  const rawToken = randomBytes(32).toString('base64url');
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash: hashToken(rawToken), expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS) },
  });
  return exposeDevelopmentToken(rawToken);
}

export async function resetPassword(rawToken: string, password: string) {
  const token = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(rawToken) } });
  if (!token || token.usedAt || token.expiresAt <= new Date()) throw new Error('INVALID_RESET_TOKEN');
  const passwordHash = await hashPassword(password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: token.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: token.id }, data: { usedAt: new Date() } }),
    prisma.refreshSession.updateMany({ where: { userId: token.userId, revokedAt: null }, data: { revokedAt: new Date() } }),
  ]);
}

export async function authenticateAccessToken(token: string): Promise<AuthenticatedUser> {
  const { payload } = await jwtVerify(token, jwtSecret(), {
    issuer: 'educareer-ai-360-backend',
    audience: 'educareer-ai-360-frontend',
  });
  if (!payload.sub || !Array.isArray(payload.roles)) throw new Error('INVALID_ACCESS_TOKEN');
  const user = await userWithRoles(payload.sub);
  if (!user) throw new Error('INVALID_ACCESS_TOKEN');
  return user;
}
