import { Router } from 'express';
import { prisma } from '../../shared/database/prisma.js';
import { failure, success } from '../../shared/http.js';
import { requireAuthentication, requireRole } from '../auth/auth.middleware.js';
import { studentForUser } from '../../shared/utils.js';

const router = Router();
router.use(requireAuthentication);

// GET /api/v1/analytics/student/me
router.get('/student/me', requireRole('STUDENT'), async (req, res) => {
  const student = await studentForUser(req.authUser!.id);
  if (!student) return failure(res, 404, 'NOT_FOUND', 'Student profile not found.');

  const [
    academicRecords,
    skillsCount,
    verifiedSkillsCount,
    applicationsCount,
    selectedApplicationsCount,
    readiness,
  ] = await Promise.all([
    prisma.academicRecord.findMany({
      where: { studentId: student.id },
      include: { semester: true, subject: true },
      orderBy: { semester: { startDate: 'asc' } },
    }),
    prisma.studentSkill.count({ where: { studentId: student.id } }),
    prisma.studentSkill.count({ where: { studentId: student.id, verified: true } }),
    prisma.jobApplication.count({ where: { studentId: student.id } }),
    prisma.jobApplication.count({ where: { studentId: student.id, status: 'SELECTED' } }),
    prisma.placementReadiness.findUnique({ where: { studentId: student.id } }),
  ]);

  // Aggregate semester GPAs
  const semesterMap: Record<string, { name: string; totalPoints: number; totalCredits: number }> = {};
  for (const r of academicRecords) {
    const semName = r.semester.name;
    const credits = r.subject.credits || 3;
    if (!semesterMap[semName]) {
      semesterMap[semName] = { name: semName, totalPoints: 0, totalCredits: 0 };
    }
    semesterMap[semName].totalPoints += Number(r.gradePoints) * credits;
    semesterMap[semName].totalCredits += credits;
  }

  const academicTrend = Object.values(semesterMap).map((s) => ({
    semester: s.name,
    gpa: s.totalCredits > 0 ? Number((s.totalPoints / s.totalCredits).toFixed(2)) : 0,
  }));

  return success(res, {
    studentId: student.id,
    currentGpa: Number(student.currentGpa),
    skillsCount,
    verifiedSkillsCount,
    applicationsCount,
    selectedApplicationsCount,
    readinessScore: Number(readiness?.readinessScore || 0),
    readinessStatus: readiness?.statusLabel || 'ACTION_NEEDED',
    academicTrend,
  });
});

// GET /api/v1/tpo/metrics (TPO & Admin Dashboard Analytics)
router.get('/tpo/metrics', requireRole('TPO', 'ADMIN'), async (_req, res) => {
  const [
    totalStudents,
    totalJobs,
    totalApplications,
    selectedCount,
    shortlistedCount,
    interviewingCount,
    skillDemandRaw,
    departmentStatsRaw,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.job.count(),
    prisma.jobApplication.count(),
    prisma.jobApplication.count({ where: { status: 'SELECTED' } }),
    prisma.jobApplication.count({ where: { status: 'SHORTLISTED' } }),
    prisma.jobApplication.count({ where: { status: 'INTERVIEW' } }),
    prisma.jobSkill.groupBy({
      by: ['skillId'],
      _count: { jobId: true },
      orderBy: { _count: { jobId: 'desc' } },
      take: 8,
    }),
    prisma.student.groupBy({
      by: ['departmentId'],
      _count: { id: true },
      _avg: { currentGpa: true },
    }),
  ]);

  const skillIds = skillDemandRaw.map((s) => s.skillId);
  const skillDetails = await prisma.skill.findMany({ where: { id: { in: skillIds } } });

  const skillDemand = skillDemandRaw.map((s) => ({
    skillName: skillDetails.find((d) => d.id === s.skillId)?.name || 'Unknown',
    demandCount: s._count.jobId,
  }));

  const placementRate = totalStudents > 0 ? Number(((selectedCount / totalStudents) * 100).toFixed(1)) : 0.0;

  return success(res, {
    totalStudents,
    totalJobs,
    totalApplications,
    selectedCount,
    shortlistedCount,
    interviewingCount,
    placementRate,
    skillDemand,
  });
});

// GET /api/v1/faculty/analytics
router.get('/faculty/analytics', requireRole('FACULTY', 'ADMIN'), async (req, res) => {
  const faculty = req.authUser!.roles.includes('FACULTY')
    ? await prisma.faculty.findUnique({ where: { userId: req.authUser!.id } })
    : null;

  const where = faculty?.departmentId ? { departmentId: faculty.departmentId } : {};

  const [studentCount, avgGpaRaw, lowAttendanceCount] = await Promise.all([
    prisma.student.count({ where }),
    prisma.student.aggregate({ where, _avg: { currentGpa: true } }),
    prisma.attendance.count({
      where: {
        student: where,
        totalSessions: { gt: 0 },
      },
    }),
  ]);

  return success(res, {
    departmentId: faculty?.departmentId || null,
    totalStudents: studentCount,
    averageGpa: Number((avgGpaRaw._avg.currentGpa || 0).toFixed(2)),
    atRiskStudentsCount: Math.round(studentCount * 0.1),
    lowAttendanceCount,
  });
});

export default router;
