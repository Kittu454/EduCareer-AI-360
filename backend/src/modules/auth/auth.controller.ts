import type { Request, Response } from 'express';
import * as authService from './auth.service.js';
import { loginSchema, registerSchema, resetPasswordSchema, tokenSchema } from './auth.validation.js';

const REFRESH_COOKIE = 'educareer_refresh_token';
const cookieOptions = `Path=/api/v1/auth; HttpOnly; SameSite=Strict${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;

function setRefreshCookie(res: Response, token: string) {
  res.setHeader('Set-Cookie', `${REFRESH_COOKIE}=${encodeURIComponent(token)}; Max-Age=604800; ${cookieOptions}`);
}

function clearRefreshCookie(res: Response) {
  res.setHeader('Set-Cookie', `${REFRESH_COOKIE}=; Max-Age=0; ${cookieOptions}`);
}

function refreshCookie(req: Request): string | undefined {
  const value = req.header('cookie')?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${REFRESH_COOKIE}=`));
  return value ? decodeURIComponent(value.slice(REFRESH_COOKIE.length + 1)) : undefined;
}

function validationError(res: Response, error: unknown) {
  if (error && typeof error === 'object' && 'issues' in error) {
    return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'The request is invalid.', details: (error as { issues: unknown }).issues } });
  }
  return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'The request is invalid.' } });
}

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);
  try {
    const result = await authService.register(parsed.data);
    const data: Record<string, unknown> = { userId: result.userId, emailVerificationRequired: true };
    if (result.verificationToken) data.developmentVerificationToken = result.verificationToken;
    return res.status(201).json({ success: true, data, message: 'Registration successful. Verify your email before signing in.' });
  } catch (error) {
    if (error instanceof Error && error.message === 'EMAIL_EXISTS') {
      return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'Unable to register with these details.' } });
    }
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to complete registration.' } });
  }
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);
  try {
    const result = await authService.login(parsed.data.email, parsed.data.password);
    setRefreshCookie(res, result.refreshToken);
    return res.status(200).json({ success: true, data: { accessToken: result.accessToken, expiresIn: result.expiresIn, user: result.user }, message: 'Login successful.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'EMAIL_NOT_VERIFIED') return res.status(403).json({ success: false, error: { code: 'EMAIL_NOT_VERIFIED', message: 'Email verification is required.' } });
    if (message === 'ACCOUNT_UNAVAILABLE') return res.status(403).json({ success: false, error: { code: 'ACCOUNT_UNAVAILABLE', message: 'Account is unavailable.' } });
    return res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Invalid credentials.' } });
  }
}

export async function refresh(req: Request, res: Response) {
  const token = refreshCookie(req);
  if (!token) return res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } });
  try {
    const result = await authService.refresh(token);
    return res.status(200).json({ success: true, data: result, message: 'Token refreshed.' });
  } catch {
    clearRefreshCookie(res);
    return res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } });
  }
}

export async function logout(req: Request, res: Response) {
  const token = refreshCookie(req);
  if (token) await authService.revokeRefreshToken(token);
  clearRefreshCookie(res);
  return res.status(204).send();
}

export async function verifyEmail(req: Request, res: Response) {
  const parsed = tokenSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);
  try {
    await authService.verifyEmail(parsed.data.token);
    return res.status(200).json({ success: true, data: {}, message: 'Email verified successfully.' });
  } catch {
    return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Verification token is invalid or expired.' } });
  }
}

export async function forgotPassword(req: Request, res: Response) {
  const parsed = loginSchema.shape.email.safeParse(req.body?.email);
  if (!parsed.success) return validationError(res, parsed.error);
  const token = await authService.requestPasswordReset(parsed.data);
  const data: Record<string, unknown> = {};
  if (token) data.developmentResetToken = token;
  return res.status(202).json({ success: true, data, message: 'If the account exists, reset instructions will be sent.' });
}

export async function resetPassword(req: Request, res: Response) {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);
  try {
    await authService.resetPassword(parsed.data.token, parsed.data.password);
    return res.status(200).json({ success: true, data: {}, message: 'Password reset successful.' });
  } catch {
    return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Reset token is invalid or expired.' } });
  }
}

export async function me(req: Request, res: Response) {
  return res.status(200).json({ success: true, data: { user: req.authUser }, message: 'Request successful.' });
}
