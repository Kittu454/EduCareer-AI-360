export type AuthRole = 'STUDENT' | 'FACULTY' | 'TPO' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  status: string;
  roles: AuthRole[];
  emailVerifiedAt?: string | null;
  createdAt?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
}

export interface Institution {
  id: string;
  name: string;
  code: string;
}

export interface Student {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
  admissionYear: number;
  graduationYear?: number | null;
  currentGpa: number;
  departmentId?: string | null;
  institutionId?: string | null;
  department?: Department | null;
  institution?: Institution | null;
  user?: { email: string; status: string };
}

export interface Faculty {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  departmentId?: string | null;
  department?: Department | null;
}

export interface TpoOfficer {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  officePhone?: string | null;
}

export interface Semester {
  id: string;
  code: string;
  name: string;
  startDate: string;
  endDate: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  credits: number;
  departmentId: string;
  department?: Department;
}

export interface AcademicRecord {
  id: string;
  studentId: string;
  subjectId: string;
  semesterId: string;
  gradePoints: number;
  letterGrade: string;
  subject: Subject;
  semester: Semester;
}

export interface Attendance {
  id: string;
  studentId: string;
  subjectId: string;
  semesterId: string;
  totalSessions: number;
  attendedSessions: number;
  subject: Subject;
  semester: Semester;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
}

export interface StudentSkill {
  id: string;
  studentId: string;
  skillId: string;
  proficiencyLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  verified: boolean;
  skill: Skill;
  assessments?: any[];
}

export interface Career {
  id: string;
  title: string;
  description?: string | null;
  minGpaRequirement: number;
  careerSkills?: Array<{
    skillId: string;
    importanceWeight: number;
    skill: Skill;
  }>;
}

export interface CareerRecommendation {
  id: string;
  studentId: string;
  careerId: string;
  matchPercentage: number;
  rationale?: string | null;
  createdAt: string;
  career: Career;
}

export interface SkillGap {
  id: string;
  studentId: string;
  skillId: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  skill: Skill;
}

export interface RoadmapItem {
  id: string;
  roadmapId: string;
  skillId: string;
  title: string;
  sequenceOrder: number;
  status: 'LOCKED' | 'CURRENT' | 'COMPLETED';
  resourceUrl?: string | null;
  skill: Skill;
}

export interface CareerRoadmap {
  id: string;
  studentId: string;
  targetCareer: string;
  items: RoadmapItem[];
}

export interface Company {
  id: string;
  name: string;
  website?: string | null;
  industry?: string | null;
}

export interface Job {
  id: string;
  companyId: string;
  title: string;
  description: string;
  minGpa: number;
  applicationDeadline: string;
  company: Company;
  jobSkills: Array<{
    skillId: string;
    skill: Skill;
  }>;
  eligibility?: {
    eligible: boolean;
    checks: Array<{
      criterion: string;
      required: any;
      actual: any;
      passed: boolean;
      message: string;
    }>;
  };
}

export interface JobApplication {
  id: string;
  studentId: string;
  jobId: string;
  status: 'SUBMITTED' | 'SHORTLISTED' | 'ASSESSMENT' | 'INTERVIEW' | 'SELECTED' | 'REJECTED' | 'WITHDRAWN';
  appliedAt: string;
  job: Job;
  student?: Student;
}

export interface Resume {
  id: string;
  studentId: string;
  fileName: string;
  mimeType?: string | null;
  fileSize?: number | null;
  status: string;
  uploadedAt: string;
  analysis?: {
    overallScore: number;
    grammarFeedback?: string;
    extractedSkills: string[];
    recommendations?: string;
  };
}

export interface PlacementReadiness {
  id: string;
  studentId: string;
  readinessScore: number;
  statusLabel: string;
  lastCalculated: string;
  breakdown?: {
    academicScore: number;
    skillsScore: number;
    resumeScore: number;
    practicalScore: number;
  };
  drivers?: string[];
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  content: string;
  notificationType: string;
  priority: string;
  isRead: boolean;
  createdAt: string;
}

export interface AiMessage {
  id: string;
  conversationId: string;
  sender: 'USER' | 'AI_COACH';
  messageText: string;
  sentAt: string;
}

export interface AiConversation {
  id: string;
  studentId: string;
  title: string;
  createdAt: string;
  messages: AiMessage[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    timestamp: string;
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
