const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const ML_SERVICE_TOKEN = process.env.ML_SERVICE_TOKEN || 'internal_shared_auth_token_for_fastapi_ml_calls';

interface RequestOptions {
  timeoutMs?: number;
}

async function callMlApi<T>(endpoint: string, method: string = 'POST', body?: any, options: RequestOptions = {}): Promise<T | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs || 5000);

  try {
    const res = await fetch(`${ML_SERVICE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ML_SERVICE_TOKEN}`
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`ML service error at ${endpoint}: HTTP ${res.status}`);
      return null;
    }

    return (await res.json()) as T;
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn(`ML service connection error at ${endpoint}:`, err instanceof Error ? err.message : String(err));
    return null;
  }
}

export interface MlPerformanceRequest {
  historical_gpa: number;
  quiz_average: number;
  assignment_submission_rate: number;
  attendance_percentage: number;
  course_credits: number;
}

export interface MlPerformanceResponse {
  predicted_gpa: number;
  risk_level: string;
  prediction_interval: { lower: number; upper: number };
}

export interface MlCareerRecommendRequest {
  verified_skills: string[];
  interests: string[];
  academic_gpa: number;
}

export interface MlCareerRecommendResponse {
  recommendations: Array<{
    career_title: string;
    match_percentage: number;
    rationale: string;
  }>;
}

export interface MlSkillGapRequest {
  student_skills: string[];
  target_career_id: string;
}

export interface MlSkillGapResponse {
  gaps: Array<{
    skill_name: string;
    priority: string;
  }>;
}

export interface MlReadinessRequest {
  gpa: number;
  verified_skills_count: number;
  mock_interview_score: number;
  resume_score: number;
  completed_internships: number;
}

export interface MlReadinessResponse {
  readiness_score: number;
  status_label: string;
  drivers: string[];
}

export interface MlJobMatchRequest {
  student_skills: string[];
  gpa: number;
  jobs: Array<{
    job_id: string;
    required_skills: string[];
    min_gpa: number;
  }>;
}

export interface MlJobMatchResponse {
  matches: Array<{
    job_id: string;
    match_score: number;
    ineligible: boolean;
  }>;
}

export interface MlSimulatorRequest {
  current_profile: {
    gpa: number;
    skills: string[];
  };
  simulated_skills: string[];
  simulated_gpa: number;
  target_career_id: string;
}

export interface MlSimulatorResponse {
  original_match_percentage: number;
  simulated_match_percentage: number;
  improved_score_difference: number;
}

export async function mlHealthCheck(): Promise<boolean> {
  const result = await callMlApi<{ status: string }>('/ml/v1/health', 'GET');
  return result?.status === 'OK';
}

export async function predictPerformance(req: MlPerformanceRequest): Promise<MlPerformanceResponse | null> {
  return callMlApi<MlPerformanceResponse>('/ml/v1/performance/predict', 'POST', req);
}

export async function recommendCareers(req: MlCareerRecommendRequest): Promise<MlCareerRecommendResponse | null> {
  return callMlApi<MlCareerRecommendResponse>('/ml/v1/career/recommend', 'POST', req);
}

export async function analyzeSkillGaps(req: MlSkillGapRequest): Promise<MlSkillGapResponse | null> {
  return callMlApi<MlSkillGapResponse>('/ml/v1/skill-gap/analyze', 'POST', req);
}

export async function predictReadiness(req: MlReadinessRequest): Promise<MlReadinessResponse | null> {
  return callMlApi<MlReadinessResponse>('/ml/v1/readiness/predict', 'POST', req);
}

export async function matchJobs(req: MlJobMatchRequest): Promise<MlJobMatchResponse | null> {
  return callMlApi<MlJobMatchResponse>('/ml/v1/jobs/match', 'POST', req);
}

export async function predictSimulator(req: MlSimulatorRequest): Promise<MlSimulatorResponse | null> {
  return callMlApi<MlSimulatorResponse>('/ml/v1/simulator/predict', 'POST', req);
}
