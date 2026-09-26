/**
 * EduCareer-AI-360 — DEVELOPMENT SEED DATA
 * -------------------------------------------------------------------------
 * This creates a coherent, SYNTHETIC demo dataset for local development so
 * dashboards, jobs, academics, skills, careers, applications, readiness,
 * notifications and AI context can be demonstrated.
 *
 * IMPORTANT (per project requirements):
 *  - Seed data is a SEPARATE path from real user signup. Real signup still
 *    creates genuine Users through the backend -> PostgreSQL flow. This file
 *    only provisions DEMO data and DEMO accounts.
 *  - All accounts use SYNTHETIC names and a shared, clearly-documented
 *    development password. This is for local development only and must NOT be
 *    used in production.
 *  - The seed is IDEMPOTENT: it uses upserts keyed on unique business fields
 *    and resets only its own join-table rows, so running it repeatedly does
 *    not create duplicate data.
 *
 * Run with:  npx prisma db seed   (from the backend/ directory)
 */
/// <reference types="node" />
import { randomBytes, scrypt as nodeScrypt } from 'node:crypto';
import { promisify } from 'node:util';
import { PrismaClient } from '@prisma/client';

const scrypt = promisify(nodeScrypt);
const prisma = new PrismaClient();

// Single shared development password (>= 12 chars to satisfy registration rules).
const DEMO_PASSWORD = 'DemoPassw0rd!2024';

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${derived.toString('hex')}`;
}

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

async function main() {
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  // In development we mark demo accounts email-verified so login works directly.
  const verifiedAt = new Date();

  // Reset notification rows for the demo namespace so repeated runs do not
  // accumulate duplicate notifications (they have no natural unique key).
  await prisma.notification.deleteMany({
    where: { user: { email: { endsWith: '@demo.educareer.local' } } },
  });

  console.log('▶ Seeding roles...');
  const roleNames = ['STUDENT', 'FACULTY', 'TPO', 'ADMIN'] as const;
  const roles: Record<string, { id: string }> = {};
  for (const name of roleNames) {
    roles[name] = await prisma.role.upsert({ where: { name }, update: {}, create: { name } });
  }

  console.log('▶ Seeding institution & departments...');
  const institution = await prisma.institution.upsert({
    where: { name: 'EduCareer Demo University' },
    update: {},
    create: { name: 'EduCareer Demo University', code: 'ECDU' },
  });

  const departmentDefs = [
    { name: 'Computer Science', code: 'CSE' },
    { name: 'Information Technology', code: 'IT' },
    { name: 'Electronics', code: 'ECE' },
    { name: 'Mechanical', code: 'MECH' },
    { name: 'Business / Management', code: 'MBA' },
  ];
  const departments: Record<string, { id: string }> = {};
  for (const d of departmentDefs) {
    departments[d.code] = await prisma.department.upsert({
      where: { code: d.code },
      update: { name: d.name },
      create: d,
    });
  }

  console.log('▶ Seeding skills...');
  const skillDefs: Array<{ name: string; category: string }> = [
    { name: 'Python', category: 'Programming' },
    { name: 'SQL', category: 'Data' },
    { name: 'Pandas', category: 'Data' },
    { name: 'Statistics', category: 'Data' },
    { name: 'Data Visualization', category: 'Data' },
    { name: 'Machine Learning', category: 'AI/ML' },
    { name: 'TensorFlow', category: 'AI/ML' },
    { name: 'PyTorch', category: 'AI/ML' },
    { name: 'Java', category: 'Backend' },
    { name: 'Spring Boot', category: 'Backend' },
    { name: 'REST APIs', category: 'Backend' },
    { name: 'Django', category: 'Backend' },
    { name: 'C/C++', category: 'Embedded' },
    { name: 'Embedded Systems', category: 'Embedded' },
    { name: 'IoT', category: 'Embedded' },
    { name: 'Excel', category: 'Business' },
    { name: 'Business Analysis', category: 'Business' },
    { name: 'Communication', category: 'Soft Skills' },
    { name: 'Git', category: 'Tools' },
    { name: 'Docker', category: 'Tools' },
    { name: 'DBMS', category: 'Core' },
    { name: 'Operating Systems', category: 'Core' },
  ];
  const skills: Record<string, { id: string }> = {};
  for (const s of skillDefs) {
    skills[s.name] = await prisma.skill.upsert({
      where: { name: s.name },
      update: { category: s.category },
      create: s,
    });
  }

  console.log('▶ Seeding careers & career skills...');
  const careerDefs: Array<{ title: string; minGpa: number; description: string; skills: string[] }> = [
    { title: 'Data Analyst', minGpa: 7.0, description: 'Analyze data to drive business decisions.', skills: ['Python', 'SQL', 'Pandas', 'Statistics', 'Data Visualization'] },
    { title: 'Backend Developer', minGpa: 7.0, description: 'Build and maintain server-side services and APIs.', skills: ['Java', 'Spring Boot', 'SQL', 'REST APIs', 'Git', 'Docker'] },
    { title: 'ML Engineer', minGpa: 8.0, description: 'Design, train and deploy machine learning models.', skills: ['Python', 'Machine Learning', 'TensorFlow', 'PyTorch', 'Statistics'] },
    { title: 'IoT Engineer', minGpa: 7.0, description: 'Develop connected embedded devices and systems.', skills: ['C/C++', 'Embedded Systems', 'IoT', 'Python'] },
    { title: 'Business Analyst', minGpa: 7.0, description: 'Bridge business needs and data-driven solutions.', skills: ['Excel', 'Business Analysis', 'Communication', 'SQL'] },
  ];
  const careers: Record<string, { id: string }> = {};
  for (const c of careerDefs) {
    const career = await prisma.career.upsert({
      where: { title: c.title },
      update: { minGpaRequirement: c.minGpa, description: c.description },
      create: { title: c.title, minGpaRequirement: c.minGpa, description: c.description },
    });
    careers[c.title] = career;
    // Reset this career's skill links so re-running stays idempotent.
    await prisma.careerSkill.deleteMany({ where: { careerId: career.id } });
    for (const skillName of c.skills) {
      await prisma.careerSkill.create({
        data: { careerId: career.id, skillId: skills[skillName].id, importanceWeight: 0.8 },
      });
    }
  }

  console.log('▶ Seeding semester & subjects...');
  const semester = await prisma.semester.upsert({
    where: { code: '2024-ODD-S1' },
    update: {},
    create: { code: '2024-ODD-S1', name: 'Semester 1 (Odd 2024)', startDate: daysFromNow(-180), endDate: daysFromNow(-90) },
  });

  const subjectDefs: Array<{ code: string; name: string; credits: number; dept: string }> = [
    { code: 'CS101', name: 'Programming Fundamentals', credits: 4, dept: 'CSE' },
    { code: 'CS102', name: 'Data Structures', credits: 4, dept: 'CSE' },
    { code: 'MA101', name: 'Discrete Mathematics', credits: 3, dept: 'CSE' },
    { code: 'IT101', name: 'Web Technologies', credits: 3, dept: 'IT' },
    { code: 'EC101', name: 'Digital Electronics', credits: 4, dept: 'ECE' },
    { code: 'MB101', name: 'Principles of Management', credits: 3, dept: 'MBA' },
  ];
  const subjects: Record<string, { id: string }> = {};
  for (const s of subjectDefs) {
    subjects[s.code] = await prisma.subject.upsert({
      where: { code: s.code },
      update: { name: s.name, credits: s.credits },
      create: { code: s.code, name: s.name, credits: s.credits, departmentId: departments[s.dept].id },
    });
  }

  console.log('▶ Seeding admin, TPO & faculty accounts...');
  async function ensureUser(email: string, role: keyof typeof roles) {
    const user = await prisma.user.upsert({
      where: { email },
      update: { passwordHash, emailVerifiedAt: verifiedAt, status: 'ACTIVE' },
      create: { email, passwordHash, emailVerifiedAt: verifiedAt, status: 'ACTIVE' },
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: roles[role].id } },
      update: {},
      create: { userId: user.id, roleId: roles[role].id },
    });
    return user;
  }

  const adminUser = await ensureUser('admin@demo.educareer.local', 'ADMIN');

  const tpoUser = await ensureUser('tpo@demo.educareer.local', 'TPO');
  await prisma.tpoOfficer.upsert({
    where: { userId: tpoUser.id },
    update: { firstName: 'Placement', lastName: 'Office', institutionId: institution.id },
    create: { userId: tpoUser.id, firstName: 'Placement', lastName: 'Office', officePhone: '+91-000-000-0000', institutionId: institution.id },
  });

  const facultyUser = await ensureUser('faculty@demo.educareer.local', 'FACULTY');
  await prisma.faculty.upsert({
    where: { userId: facultyUser.id },
    update: { firstName: 'Dr. Meera', lastName: 'Rao', departmentId: departments.CSE.id, institutionId: institution.id },
    create: { userId: facultyUser.id, firstName: 'Dr. Meera', lastName: 'Rao', employeeId: 'FAC-CSE-001', departmentId: departments.CSE.id, institutionId: institution.id },
  });

  console.log('▶ Seeding demo students & their records...');
  const studentDefs: Array<{
    email: string; first: string; last: string; roll: string; dept: string;
    cgpa: number; targetCareer: string; skills: string[]; gaps: string[]; readiness: number;
    subjects: string[];
  }> = [
    { email: 'student1@demo.educareer.local', first: 'Aarav', last: 'Sharma', roll: '2024CSE001', dept: 'CSE', cgpa: 8.6, targetCareer: 'Data Analyst', skills: ['Python', 'SQL', 'Pandas', 'Statistics'], gaps: ['Data Visualization', 'Machine Learning'], readiness: 78, subjects: ['CS101', 'CS102', 'MA101'] },
    { email: 'student2@demo.educareer.local', first: 'Priya', last: 'Nair', roll: '2024IT001', dept: 'IT', cgpa: 7.8, targetCareer: 'Backend Developer', skills: ['Java', 'Spring Boot', 'SQL', 'REST APIs'], gaps: ['Docker', 'Django'], readiness: 70, subjects: ['IT101', 'CS102'] },
    { email: 'student3@demo.educareer.local', first: 'Rohan', last: 'Verma', roll: '2024CSE002', dept: 'CSE', cgpa: 9.0, targetCareer: 'ML Engineer', skills: ['Python', 'Machine Learning', 'TensorFlow', 'PyTorch'], gaps: ['Docker'], readiness: 88, subjects: ['CS101', 'MA101'] },
    { email: 'student4@demo.educareer.local', first: 'Sneha', last: 'Iyer', roll: '2024ECE001', dept: 'ECE', cgpa: 8.1, targetCareer: 'IoT Engineer', skills: ['C/C++', 'Embedded Systems', 'IoT'], gaps: ['Python'], readiness: 74, subjects: ['EC101', 'CS101'] },
    { email: 'student5@demo.educareer.local', first: 'Arjun', last: 'Patel', roll: '2024MBA001', dept: 'MBA', cgpa: 8.0, targetCareer: 'Business Analyst', skills: ['Excel', 'Business Analysis', 'Communication'], gaps: ['SQL'], readiness: 69, subjects: ['MB101'] },
  ];

  const studentByRoll: Record<string, { id: string; userId: string }> = {};

  for (const s of studentDefs) {
    const user = await ensureUser(s.email, 'STUDENT');
    const student = await prisma.student.upsert({
      where: { userId: user.id },
      update: {
        firstName: s.first, lastName: s.last, rollNumber: s.roll,
        departmentId: departments[s.dept].id, institutionId: institution.id,
        admissionYear: 2024, graduationYear: 2028, currentGpa: s.cgpa,
      },
      create: {
        userId: user.id, firstName: s.first, lastName: s.last, rollNumber: s.roll,
        departmentId: departments[s.dept].id, institutionId: institution.id,
        admissionYear: 2024, graduationYear: 2028, currentGpa: s.cgpa,
      },
    });
    studentByRoll[s.roll] = { id: student.id, userId: user.id };

    // Skills
    await prisma.studentSkill.deleteMany({ where: { studentId: student.id } });
    for (const skillName of s.skills) {
      await prisma.studentSkill.create({
        data: { studentId: student.id, skillId: skills[skillName].id, proficiencyLevel: 'INTERMEDIATE', verified: true },
      });
    }
    // Skill gaps
    await prisma.skillGap.deleteMany({ where: { studentId: student.id } });
    for (const gapName of s.gaps) {
      await prisma.skillGap.create({ data: { studentId: student.id, skillId: skills[gapName].id, priority: 'HIGH' } });
    }

    // Career roadmap
    await prisma.careerRoadmap.upsert({
      where: { studentId: student.id },
      update: { targetCareer: s.targetCareer },
      create: { studentId: student.id, targetCareer: s.targetCareer },
    });
    const roadmap = await prisma.careerRoadmap.findUnique({ where: { studentId: student.id } });
    if (roadmap) {
      await prisma.roadmapItem.deleteMany({ where: { roadmapId: roadmap.id } });
      const careerSkills = careerDefs.find((c) => c.title === s.targetCareer)!.skills;
      for (let i = 0; i < careerSkills.length; i++) {
        await prisma.roadmapItem.create({
          data: {
            roadmapId: roadmap.id, skillId: skills[careerSkills[i]].id,
            title: `Master ${careerSkills[i]}`, sequenceOrder: i + 1,
            status: i < s.skills.length ? 'COMPLETED' : 'IN_PROGRESS',
          },
        });
      }
    }

    // Career recommendation
    await prisma.careerRecommendation.upsert({
      where: { studentId_careerId: { studentId: student.id, careerId: careers[s.targetCareer].id } },
      update: { matchPercentage: Math.min(95, s.readiness + 5) },
      create: { studentId: student.id, careerId: careers[s.targetCareer].id, matchPercentage: Math.min(95, s.readiness + 5), rationale: `Based on CGPA ${s.cgpa} and skill profile.` },
    });

    // Academic records + attendance
    for (const code of s.subjects) {
      const subject = subjects[code];
      await prisma.academicRecord.upsert({
        where: { studentId_subjectId_semesterId: { studentId: student.id, subjectId: subject.id, semesterId: semester.id } },
        update: { gradePoints: s.cgpa, letterGrade: s.cgpa >= 8.5 ? 'O' : s.cgpa >= 7.5 ? 'A+' : 'A' },
        create: { studentId: student.id, subjectId: subject.id, semesterId: semester.id, gradePoints: s.cgpa, letterGrade: s.cgpa >= 8.5 ? 'O' : s.cgpa >= 7.5 ? 'A+' : 'A' },
      });
      await prisma.attendance.upsert({
        where: { studentId_subjectId_semesterId: { studentId: student.id, subjectId: subject.id, semesterId: semester.id } },
        update: { totalSessions: 40, attendedSessions: Math.round(40 * (0.75 + (s.cgpa - 7) / 20)) },
        create: { studentId: student.id, subjectId: subject.id, semesterId: semester.id, totalSessions: 40, attendedSessions: Math.round(40 * (0.75 + (s.cgpa - 7) / 20)) },
      });
    }

    // Placement readiness
    await prisma.placementReadiness.upsert({
      where: { studentId: student.id },
      update: { readinessScore: s.readiness, statusLabel: s.readiness >= 75 ? 'ON_TRACK' : 'ACTION_NEEDED', lastCalculated: new Date() },
      create: { studentId: student.id, readinessScore: s.readiness, statusLabel: s.readiness >= 75 ? 'ON_TRACK' : 'ACTION_NEEDED' },
    });

    // Notification
    await prisma.notification.create({
      data: {
        userId: user.id, title: 'Welcome to EduCareer AI 360',
        content: `Hi ${s.first}, your demo profile is ready. Explore jobs, readiness and the AI Career Coach.`,
        notificationType: 'GENERAL', priority: 'NORMAL',
      },
    });
  }

  // Certifications & internships for a couple of students
  await prisma.certification.deleteMany({ where: { studentId: studentByRoll['2024CSE001'].id } });
  await prisma.certification.create({
    data: { studentId: studentByRoll['2024CSE001'].id, name: 'Google Data Analytics', issuer: 'Coursera', issuedAt: daysFromNow(-120), verified: true },
  });
  await prisma.internship.deleteMany({ where: { studentId: studentByRoll['2024CSE002'].id } });
  await prisma.internship.create({
    data: { studentId: studentByRoll['2024CSE002'].id, companyName: 'DataWorks', role: 'ML Intern', startDate: daysFromNow(-200), endDate: daysFromNow(-100), verified: true },
  });

  console.log('▶ Seeding companies, jobs & applications...');
  const companyDefs: Array<{ name: string; industry: string; jobs: Array<{ title: string; minGpa: number; desc: string; skills: string[] }> }> = [
    { name: 'TechCorp Solutions', industry: 'IT Services', jobs: [{ title: 'Backend Engineer', minGpa: 7.0, desc: 'Design scalable services.', skills: ['Java', 'Spring Boot', 'SQL', 'REST APIs'] }] },
    { name: 'DataWorks Analytics', industry: 'Data', jobs: [{ title: 'Data Analyst', minGpa: 7.5, desc: 'Turn data into insight.', skills: ['Python', 'SQL', 'Pandas', 'Data Visualization'] }] },
    { name: 'Neural Labs', industry: 'AI', jobs: [{ title: 'ML Engineer Intern', minGpa: 8.0, desc: 'Build ML pipelines.', skills: ['Python', 'Machine Learning', 'PyTorch'] }] },
    { name: 'EmbeddedSys Ltd', industry: 'Electronics', jobs: [{ title: 'IoT Developer', minGpa: 7.0, desc: 'Firmware and cloud integration.', skills: ['C/C++', 'Embedded Systems', 'IoT'] }] },
    { name: 'FinEdge Consulting', industry: 'Finance', jobs: [{ title: 'Business Analyst', minGpa: 7.0, desc: 'Requirements and analysis.', skills: ['Excel', 'Business Analysis', 'Communication'] }] },
  ];

  const jobByTitle: Record<string, { id: string; minGpa: number; skills: string[] }> = {};
  for (const c of companyDefs) {
    const company = await prisma.company.upsert({
      where: { name: c.name },
      update: { industry: c.industry },
      create: { name: c.name, industry: c.industry, website: `https://example.com`, institutionId: institution.id },
    });
    for (const j of c.jobs) {
      const job = await prisma.job.create({
        data: { companyId: company.id, title: j.title, description: j.desc, minGpa: j.minGpa, applicationDeadline: daysFromNow(30) },
      });
      jobByTitle[j.title] = { id: job.id, minGpa: j.minGpa, skills: j.skills };
      await prisma.jobSkill.deleteMany({ where: { jobId: job.id } });
      for (const skillName of j.skills) {
        await prisma.jobSkill.create({ data: { jobId: job.id, skillId: skills[skillName].id } });
      }
    }
  }

  // Job matches & applications: eligible students apply to their target-role job.
  const matchPlan: Array<{ roll: string; jobTitle: string; apply: boolean }> = [
    { roll: '2024CSE001', jobTitle: 'Data Analyst', apply: true },
    { roll: '2024IT001', jobTitle: 'Backend Engineer', apply: true },
    { roll: '2024CSE002', jobTitle: 'ML Engineer Intern', apply: true },
    { roll: '2024ECE001', jobTitle: 'IoT Developer', apply: true },
    { roll: '2024MBA001', jobTitle: 'Business Analyst', apply: true },
  ];
  for (const plan of matchPlan) {
    const student = studentByRoll[plan.roll];
    const job = jobByTitle[plan.jobTitle];
    if (!student || !job) continue;
    const studentRec = studentDefs.find((s) => s.roll === plan.roll)!;
    const eligible = studentRec.cgpa >= job.minGpa;
    await prisma.jobMatch.upsert({
      where: { studentId_jobId: { studentId: student.id, jobId: job.id } },
      update: { matchScore: studentRec.readiness, ineligible: !eligible },
      create: { studentId: student.id, jobId: job.id, matchScore: studentRec.readiness, ineligible: !eligible },
    });
    if (plan.apply && eligible) {
      await prisma.jobApplication.upsert({
        where: { studentId_jobId: { studentId: student.id, jobId: job.id } },
        update: { status: 'SUBMITTED' },
        create: { studentId: student.id, jobId: job.id, status: 'SUBMITTED' },
      });
      await prisma.notification.create({
        data: { userId: student.userId, title: 'Application submitted', content: `Your application for ${plan.jobTitle} was submitted.`, notificationType: 'APPLICATION', priority: 'NORMAL' },
      });
    }
  }

  console.log('▶ Seeding resumes & TPO/admin notifications...');
  // Resume has no unique business key, so reset the demo student's resumes first.
  const resumeOwner = studentByRoll['2024CSE001'].id;
  await prisma.resume.deleteMany({ where: { studentId: resumeOwner } });
  await prisma.resume.create({
    data: {
      studentId: resumeOwner,
      fileName: 'aarav-sharma-resume.pdf',
      storagePath: '/uploads/demos/aarav-sharma-resume.pdf',
      mimeType: 'application/pdf',
      fileSize: 245760,
      status: 'UPLOADED',
    },
  });

  await prisma.notification.create({
    data: { userId: tpoUser.id, title: 'New applications received', content: '5 students applied to posted jobs.', notificationType: 'APPLICATION', priority: 'HIGH' },
  });
  await prisma.notification.create({
    data: { userId: adminUser.id, title: 'Demo data loaded', content: 'Development seed data has been provisioned.', notificationType: 'SYSTEM', priority: 'NORMAL' },
  });

  console.log('\n✅ Seed complete.');
  console.log('---------------------------------------------------------------');
  console.log('Development demo accounts (password: %s)', DEMO_PASSWORD);
  console.log('  ADMIN   : admin@demo.educareer.local');
  console.log('  TPO     : tpo@demo.educareer.local');
  console.log('  FACULTY : faculty@demo.educareer.local');
  console.log('  STUDENT : student1..student5@demo.educareer.local');
  console.log('---------------------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
