from fastapi.testclient import TestClient
from main import app, ML_SERVICE_TOKEN

client = TestClient(app)

def test_health_check():
    response = client.get("/ml/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "OK"

def test_performance_predict_unauthorized():
    payload = {
        "historical_gpa": 8.0,
        "quiz_average": 75.0,
        "assignment_submission_rate": 0.9,
        "attendance_percentage": 0.95,
        "course_credits": 15
    }
    response = client.post("/ml/v1/performance/predict", json=payload)
    assert response.status_code == 401

def test_performance_predict_authorized():
    payload = {
        "historical_gpa": 8.0,
        "quiz_average": 75.0,
        "assignment_submission_rate": 0.9,
        "attendance_percentage": 0.95,
        "course_credits": 15
    }
    headers = {"Authorization": f"Bearer {ML_SERVICE_TOKEN}"}
    response = client.post("/ml/v1/performance/predict", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "predicted_gpa" in data
    assert data["risk_level"] == "LOW"

