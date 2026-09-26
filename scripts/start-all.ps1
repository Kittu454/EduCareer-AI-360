# Powershell script to spin up the EduCareer AI 360 development services in parallel.

Write-Host "Starting EduCareer AI 360 Local Development Services..." -ForegroundColor Green

# Start ML Service
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ml-service; venv/Scripts/activate; python -m uvicorn main:app --port 8001 --reload" -WindowStyle Normal

# Start Express Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev" -WindowStyle Normal

# Start Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -WindowStyle Normal

Write-Host "All services triggered in background windows." -ForegroundColor Cyan
