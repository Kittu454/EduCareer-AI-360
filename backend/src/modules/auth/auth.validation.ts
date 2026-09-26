import { z } from 'zod';

const password = z.string().min(12).max(128);
const email = z.string().trim().toLowerCase().email().max(255);

export const registerSchema = z.object({
  email,
  password,
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  rollNumber: z.string().trim().min(1).max(50),
  admissionYear: z.number().int().min(1900).max(new Date().getFullYear() + 1),
});

export const loginSchema = z.object({ email, password: z.string().min(1).max(128) });
export const tokenSchema = z.object({ token: z.string().min(32).max(512) });
export const resetPasswordSchema = z.object({ token: z.string().min(32).max(512), password });
