import { Request } from 'express';
import { z } from 'zod';
import { prisma } from './database/prisma.js';

export const idSchema = z.string().uuid();

export const pageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('asc'),
});

export function parseId(value: string | undefined): string | null {
  return value && idSchema.safeParse(value).success ? value : null;
}

export function paginationMeta(total: number, page: number, limit: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
    timestamp: new Date().toISOString(),
  };
}

export async function studentForUser(userId: string) {
  return prisma.student.findUnique({
    where: { userId },
    include: {
      department: true,
      institution: true,
      user: { select: { email: true, status: true, createdAt: true } },
    },
  });
}

export async function canAccessStudent(req: Request, studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { department: true, institution: true, user: { select: { email: true, status: true } } },
  });
  if (!student || !req.authUser) return null;

  if (req.authUser.roles.includes('ADMIN')) return student;

  if (req.authUser.roles.includes('TPO')) {
    const tpo = await prisma.tpoOfficer.findUnique({ where: { userId: req.authUser.id } });
    if (!tpo?.institutionId || tpo.institutionId === student.institutionId) {
      return student;
    }
  }

  if (req.authUser.roles.includes('STUDENT')) {
    return student.userId === req.authUser.id ? student : null;
  }

  if (req.authUser.roles.includes('FACULTY')) {
    const faculty = await prisma.faculty.findUnique({ where: { userId: req.authUser.id } });
    if (!faculty?.departmentId || faculty.departmentId === student.departmentId) {
      return student;
    }
  }

  return null;
}
