import os
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Header, status, Depends
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="EduCareer AI 360 - ML Service",
    description="Python FastAPI ML analytics engine serving predictive schemas",
    version="1.0.0"
)

ML_SERVICE_TOKEN = os.getenv("ML_SERVICE_TOKEN", "internal_shared_auth_token_for_fastapi_ml_calls")

def verify_token(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization Header"
        )
    # Support both "Bearer Token" and direct token validation
    token = authorization.split(" ")[-1] if " " in authorization else authorization
    if token != ML_SERVICE_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid service credentials"
        )

# --- REQUEST / RESPONSE SCHEMAS ---

class PerformancePredictRequest(BaseModel):
    historical_gpa: float = Field(..., ge=0.0, le=10.0)
    quiz_average: float = Field(..., ge=0.0, le=100.0)
    assignment_submission_rate: float = Field(..., ge=0.0, le=1.0)
    attendance_percentage: float = Field(..., ge=0.0, le=1.0)
    course_credits: int = Field(..., gt=0)

class PredictionInterval(BaseModel):
    lower: float
    upper: float

class PerformancePredictResponse(BaseModel):
    predicted_gpa: float
    risk_level: str
    prediction_interval: PredictionInterval

class CareerRecommendRequest(BaseModel):
    verified_skills: List[str]
    interests: List[str]
    academic_gpa: float = Field(..., ge=0.0, le=10.0)

class CareerRecommendationItem(BaseModel):
    career_title: str
    match_percentage: float
    rationale: str

class CareerRecommendResponse(BaseModel):
    recommendations: List[CareerRecommendationItem]

class SkillGapAnalyzeRequest(BaseModel):
    student_skills: List[str]
    target_career_id: str

class SkillGapItem(BaseModel):
    skill_name: str
    priority: str

class SkillGapAnalyzeResponse(BaseModel):
    gaps: List[SkillGapItem]

class ReadinessPredictRequest(BaseModel):
    gpa: float = Field(..., ge=0.0, le=10.0)
    verified_skills_count: int = Field(..., ge=0)
    mock_interview_score: float = Field(..., ge=0.0, le=100.0)
    resume_score: float = Field(..., ge=0.0, le=100.0)
    completed_internships: int = Field(..., ge=0)

class ReadinessPredictResponse(BaseModel):
    readiness_score: float
    status_label: str
    drivers: List[str]

class JobMatchItemRequest(BaseModel):
    job_id: str
    required_skills: List[str]
    min_gpa: float

class JobMatchRequest(BaseModel):
    student_skills: List[str]
    gpa: float
    jobs: List[JobMatchItemRequest]

class JobMatchResult(BaseModel):
    job_id: str
    match_score: float
    ineligible: bool

class JobMatchResponse(BaseModel):
    matches: List[JobMatchResult]

class CurrentProfile(BaseModel):
    gpa: float
    skills: List[str]

class SimulatorPredictRequest(BaseModel):
    current_profile: CurrentProfile
    simulated_skills: List[str]
    simulated_gpa: float
    target_career_id: str

class SimulatorPredictResponse(BaseModel):
    original_match_percentage: float
    simulated_match_percentage: float
    improved_score_difference: float

# --- ROUTE IMPLEMENTATIONS (FOUNDATIONS ONLY) ---

@app.get("/ml/v1/health")
def health_check():
    return {
        "status": "OK",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "ml-service"
    }

@app.post("/ml/v1/performance/predict", response_model=PerformancePredictResponse, dependencies=[Depends(verify_token)])
def predict_performance(data: PerformancePredictRequest):
    # Base foundation setup: returns schema-compliant default prediction
    return PerformancePredictResponse(
        predicted_gpa=data.historical_gpa,
        risk_level="LOW" if data.historical_gpa >= 7.0 else "HIGH",
        prediction_interval=PredictionInterval(
            lower=max(0.0, data.historical_gpa - 0.5),
            upper=min(10.0, data.historical_gpa + 0.5)
        )
    )

@app.post("/ml/v1/career/recommend", response_model=CareerRecommendResponse, dependencies=[Depends(verify_token)])
def recommend_career(data: CareerRecommendRequest):
    return CareerRecommendResponse(
        recommendations=[
            CareerRecommendationItem(
                career_title="Data Scientist" if "Python" in data.verified_skills else "Fullstack Engineer",
                match_percentage=85.0,
                rationale="Determined by input skill overlap and stated interests."
            )
        ]
    )

@app.post("/ml/v1/skill-gap/analyze", response_model=SkillGapAnalyzeResponse, dependencies=[Depends(verify_token)])
def analyze_skill_gap(data: SkillGapAnalyzeRequest):
    return SkillGapAnalyzeResponse(
        gaps=[
            SkillGapItem(skill_name="Docker", priority="HIGH"),
            SkillGapItem(skill_name="Kubernetes", priority="MEDIUM")
        ]
    )

@app.post("/ml/v1/readiness/predict", response_model=ReadinessPredictResponse, dependencies=[Depends(verify_token)])
def predict_readiness(data: ReadinessPredictRequest):
    score = (data.gpa * 10) + (data.mock_interview_score * 0.5)
    score = min(100.0, max(0.0, score))
    return ReadinessPredictResponse(
        readiness_score=score,
        status_label="HIGH" if score >= 80.0 else "MODERATE",
        drivers=["GPA profile", "Resume alignment"]
    )

@app.post("/ml/v1/jobs/match", response_model=JobMatchResponse, dependencies=[Depends(verify_token)])
def match_jobs(data: JobMatchRequest):
    results = []
    for job in data.jobs:
        ineligible = data.gpa < job.min_gpa
        results.append(
            JobMatchResult(
                job_id=job.job_id,
                match_score=75.0 if not ineligible else 0.0,
                ineligible=ineligible
            )
        )
    return JobMatchResponse(matches=results)

@app.post("/ml/v1/simulator/predict", response_model=SimulatorPredictResponse, dependencies=[Depends(verify_token)])
def predict_simulator(data: SimulatorPredictRequest):
    return SimulatorPredictResponse(
        original_match_percentage=60.0,
        simulated_match_percentage=85.0,
        improved_score_difference=25.0
    )

