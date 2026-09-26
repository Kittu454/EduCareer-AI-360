# EduCareer-AI-360

**AI-enabled university Career & Placement ecosystem** — a multi-role SaaS platform that connects
**Students**, **Faculty**, **Training & Placement Officers (TPO)** and **Administrators** around a
single source of truth for academics, skills, career readiness and recruitment.

It combines deterministic placement-readiness scoring, interactive skill-gap analysis, a job/application
pipeline, institutional analytics, and a **context-aware AI Career Coach** powered by an
OpenAI-compatible LLM.

---

## Table of Contents

- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Quick Start (Local Development)](#quick-start-local-development)
- [Environment Variables](#environment-variables)
- [Database, Migrations & Seeding](#database-migrations--seeding)
- [Demo Accounts](#demo-accounts-development-only)
- [AI Career Coach Configuration](#ai-career-coach-configuration)
- [Running with Docker](#running-with-docker)
- [Testing](#testing)
- [API Overview](#api-overview)
- [Security Model](#security-model)
- [Troubleshooting](#troubleshooting)
- [Documentation](#documentation)

---

## Key Features

### Student
- Profile, academics, attendance and assessment results
- Skills inventory with faculty-verified skills and automatic skill-gap analysis
- Career exploration, recommendations and a step-by-step career roadmap
- Job & placement drives with **server-side eligibility** checks
- Application tracking, resume upload/ATS analysis, and a placement-readiness score
- Conversational **AI Career Coach** grounded in the student's own stored data
- Notifications

### Faculty
- Department roster of assigned students
- Academic grade entry/editing with automatic CGPA recalculation
- Attendance insights and skill-verification workflow
- Permitted academic reports

### Training & Placement Officer (TPO)
- Create/publish/manage job drives and companies
- Applicant pipeline and application status management
- Placement analytics and exportable reports

### Administrator
- System overview & health
- User directory and role management
- Departments / institution configuration
- Audit trail and platform reports

### Platform-wide
- Role-based access control (RBAC) enforced on the **backend**
- Deterministic analytics (eligibility, readiness, skill gaps) — clearly separated from the LLM
- Email verification, password reset, refresh-token sessions

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router) + React 19 + TypeScript, Tailwind CSS 4, lucide-react |
| Backend | Node.js + Express + TypeScript (ESM), Zod validation, JWT (`jose`), Winston logging |
| Database | PostgreSQL 16 + Prisma ORM |
| Cache (optional) | Redis 7 |
| ML Service | Python + FastAPI (`pandas`, `numpy`, `scikit-learn`, `xgboost`) |
| AI Coach | Any OpenAI-compatible chat-completions provider (OpenAI, Google Gemini, Ollama, …) |
| Containerization | Docker + Docker Compose |

---

## Architecture

```
                  ┌─────────────────────┐
   Browser  ────▶ │  Frontend (Next.js)  │        http://localhost:3000
                  └──────────┬──────────┘
                             │  REST (JSON)  /api/v1
                             ▼
                  ┌─────────────────────┐
                  │  Backend (Express)   │        http://localhost:8000
                  │  Auth · RBAC · API   │
                  └───┬───────────┬───────┘
             Prisma   │           │  HTTP + token
                      ▼           ▼
            ┌──────────────┐   ┌────────────────┐        ┌──────────────────────┐
            │  PostgreSQL  │   │  ML Service     │  ────▶ │  LLM provider         │
            │  (+ Redis)   │   │  (FastAPI)      │        │  (OpenAI-compatible)  │
            └──────────────┘   └────────────────┘        └──────────────────────┘
```

**Rules**
- The frontend talks **only** to the Node backend.
- The backend owns authentication, authorization, database access, ML orchestration and AI calls.
- The browser **never** accesses PostgreSQL, Redis, the ML service, or the LLM directly, and never sees API keys.
- Prisma schema (`database/prisma/schema.prisma`) is authoritative for the data model.

---

## Project Structure

```
.
├── backend/            # Express API (ESM TypeScript)
│   ├── src/
│   │   ├── modules/    # Feature modules (auth, ai, academics, jobs, applications, ...)
│   │   └── shared/     # Prisma client, http helpers, utils
│   └── prisma/         # Seed script + README (dev data)
├── database/
│   └── prisma/         # schema.prisma + migrations (shared by backend)
├── frontend/           # Next.js app (src/app route segments per role)
├── ml-service/         # FastAPI ML microservice
├── docker/             # docker-compose.yml orchestrates all services
├── docs/               # PRD, ARCHITECTURE, API, DATABASE, DESIGN, ML, SECURITY docs
└── scripts/            # start-all.ps1 and dev helpers
```

---

## Prerequisites

- **Node.js 18+** and npm
- **PostgreSQL 14+** (or Docker)
- **Python 3.10+** (only if running the ML service locally)
- An **OpenAI-compatible LLM provider + API key** (only for the AI Career Coach; the rest of the platform works without it)

---

## Quick Start (Local Development)

> One-liner (PowerShell): `./scripts/start-all.ps1` starts backend, frontend and ML service together.
> Otherwise follow the manual steps below.

### 1. Database

Ensure PostgreSQL is running and the connection string in `backend/.env` is valid
(`DATABASE_URL`). Then, from `backend/`:

```bash
# generate the Prisma client
npx prisma generate --schema="../database/prisma/schema.prisma"

# create/apply migrations (creates the database if it does not exist)
npx prisma migrate dev --schema="../database/prisma/schema.prisma"
```

### 2. Seed demo data (development)

```bash
# from backend/
npx prisma db seed
```

See [Demo Accounts](#demo-accounts-development-only) and [`backend/prisma/README.md`](backend/prisma/README.md).

### 3. Backend

```bash
cd backend
cp .env.example .env        # then edit DATABASE_URL / JWT_SECRET (and optionally OPENAI_*)
npm install
npm run dev                 # http://localhost:8000  (ESM + tsx watch)
# health check:
# curl http://localhost:8000/api/v1/health
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev                 # http://localhost:3000
```

The frontend calls the backend via a single source of truth in `src/lib/api.ts`, defaulting to
`http://localhost:8000/api/v1` (override with `NEXT_PUBLIC_API_URL`).

### 5. ML Service (optional)

```bash
cd ml-service
python -m venv .venv && . .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001           # backend expects ML at http://localhost:8001
```

> Without the ML service the platform still works; admin/system health will report ML as unavailable.

---

## Environment Variables

### `backend/.env`

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Backend listen port | `8000` |
| `NODE_ENV` | `development` auto-verifies new accounts (no email delivery locally); `production` enforces email verification | `development` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://USER:PASS@localhost:5432/educareer_ai_360?schema=public` |
| `JWT_SECRET` | Access-token signing secret (≥ 32 chars) | *(change in production)* |
| `ML_SERVICE_URL` | FastAPI ML service base URL | `http://localhost:8001` |
| `ML_SERVICE_TOKEN` | Shared token for backend→ML calls | *(internal)* |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:3000` |
| `REDIS_URL` | Optional cache | `redis://localhost:6379` |
| `AUTH_EXPOSE_DEV_TOKENS` | Return dev verification/reset tokens in responses | `false` |
| `OPENAI_API_KEY` | LLM provider key — **empty ⇒ coach reports "AI unavailable"** | *(secret)* |
| `OPENAI_BASE_URL` | OpenAI-compatible base URL (see AI config) | `https://api.openai.com/v1` |
| `OPENAI_MODEL` | Model id | `gpt-4o-mini` |

### `frontend` 

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:8000/api/v1` |

> Never commit real secrets. `**/.env` is gitignored; only `.env.example` is checked in.

---

## Database, Migrations & Seeding

- **Schema:** `database/prisma/schema.prisma` (shared by the backend).
- **Migrations:** `database/prisma/migrations/…`.
- **Seed:** `backend/prisma/seed.ts` — a coherent, **synthetic** development dataset
  (institution, departments, skills, careers, jobs, applications, readiness, notifications and demo users).
  It is **idempotent** (safe to run repeatedly).

```bash
cd backend
npx prisma migrate status --schema="../database/prisma/schema.prisma"
npx prisma db seed
# reset everything (DANGER: wipes data) then reseed:
npx prisma migrate reset --schema="../database/prisma/schema.prisma"
npx prisma db seed
```

Real user signup and the seed are **two separate paths** — seeding never replaces genuine registration.

---

## Demo Accounts (Development Only)

Created by the seed. All are email-verified so you can log in immediately.

| Role | Email | Password |
|------|-------|----------|
| Student | `student1@demo.educareer.local` (…`student5`) | `DemoPassw0rd!2024` |
| Faculty | `faculty@demo.educareer.local` | `DemoPassw0rd!2024` |
| TPO | `tpo@demo.educareer.local` | `DemoPassw0rd!2024` |
| Admin | `admin@demo.educareer.local` | `DemoPassw0rd!2024` |

> **Development only.** Do not expose these in production. Only **Students** can self-register;
> Faculty / TPO / Admin accounts are provisioned by an administrator.

---

## AI Career Coach Configuration

The coach (`backend/src/modules/ai`) is provider-agnostic and uses an **OpenAI-compatible** chat-completions
interface configured entirely by environment variables:

```
OPENAI_API_KEY=...
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
```

Examples of compatible providers (set `OPENAI_BASE_URL` accordingly):

| Provider | `OPENAI_BASE_URL` | Notes |
|----------|-------------------|-------|
| OpenAI | `https://api.openai.com/v1` | Use a funded key |
| Google Gemini | `https://generativelanguage.googleapis.com/v1beta/openai/` | Use a currently-available model id (e.g. `gemini-flash-lite-latest`) |
| Local Ollama | `http://localhost:11434/v1` | Free & offline; pull a model first |

Behavior:
- The frontend **never** calls the LLM directly and **never** receives the key.
- The backend loads **only the authenticated student's own** stored data into the model context and never invents missing fields.
- If the key is missing/invalid/unfunded, the coach returns a structured `AI_UNAVAILABLE` error — it **never fakes** a reply, and the rest of the platform stays usable.

---

## Running with Docker

From the repository root:

```bash
docker compose up --build
```

This starts PostgreSQL, Redis, backend, ML service and frontend.

> Note: the compose stack runs the backend on port **4000** (`NEXT_PUBLIC_API_URL` for the frontend
> defaults to `http://localhost:4000/api/v1`), whereas local `npm run dev` uses port **8000**.
> Set `POSTGRES_PASSWORD`, `JWT_SECRET`, etc. via a root `.env` for compose.

---

## Testing

**Backend**
```bash
cd backend
npm run build         # tsc
npm test              # Jest
npm run lint          # ESLint
npx prisma validate --schema="../database/prisma/schema.prisma"
```

**Frontend**
```bash
cd frontend
npm run lint
npm run build
```

**ML service**
```bash
cd ml-service
pytest
```

---

## API Overview

Base URL: `/api/v1`. All non-auth endpoints require a JWT bearer access token; refresh uses an
HTTP-only cookie.

| Group | Prefix |
|-------|--------|
| Auth | `/auth` (register, login, refresh, logout, me, verify, forgot/reset) |
| Students | `/students` |
| Academics | `/academics` (semesters, subjects, records, attendance, assessments) |
| Skills | `/skills` |
| Careers | `/careers` (recommendations, skill gaps, roadmap) |
| Jobs | `/jobs` (companies, eligibility, matches) |
| Applications | `/applications` |
| Resumes | `/resumes` |
| Readiness | `/placement-readiness` |
| Analytics / Reports | `/analytics`, `/reports` |
| Notifications | `/notifications` |
| AI Coach | `/ai-coach` (status, conversations, messages) |
| Admin | `/admin` |
| Health | `GET /api/v1/health` |

Full endpoint contracts live in [`docs/API.md`](docs/API.md).

---

## Security Model

- Passwords hashed with **scrypt**; refresh tokens stored **hashed**; refresh token delivered via **HTTP-only, SameSite** cookie.
- Short-lived JWT access tokens; role resolution is **server-side** (the frontend can't grant itself a role).
- **RBAC + ownership checks** on protected routes (e.g. Student A cannot read Student B's data; a student token gets `403` on admin routes).
- Helmet, strict CORS to the configured origin, backend-only DB/AI access.
- Secrets only via environment variables; `.env` is gitignored.

See [`docs/SECURITY.md`](docs/SECURITY.md).

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `"Failed to fetch"` on signup | Backend down / wrong `NEXT_PUBLIC_API_URL` / CORS | Start backend on :8000; confirm `CORS_ORIGIN` matches the frontend origin |
| Registration fails with DB error | `DATABASE_URL` invalid or database missing | Verify credentials; `npx prisma migrate dev` to create/apply |
| `P1000` / `P1003` | Bad DB password / database doesn't exist | Fix `DATABASE_URL`; create DB via migrate |
| Dashboard crashes after refresh with `user.roles` undefined | Stale client bundle | Ensure current frontend build (`AuthContext` reads `data.user` from `/auth/me`) |
| AI Coach "unavailable" / `429 insufficient_quota` | Key has no credits, is empty, or model retired | Add a funded key; for Gemini pick a current model id; restart backend (env is read at startup) |
| Admin shows "ML SERVICE UNAVAILABLE" | FastAPI ML service not running | Start ML service on :8001 or run via Docker |

---

## Documentation

| Document | Purpose |
|----------|---------|
| [`docs/PRD.md`](docs/PRD.md) | Product requirements |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System architecture |
| [`docs/DESIGN.md`](docs/DESIGN.md) | UI/UX design |
| [`docs/DATABASE.md`](docs/DATABASE.md) | Data model |
| [`docs/API.md`](docs/API.md) | API reference |
| [`docs/ML_ARCHITECTURE.md`](docs/ML_ARCHITECTURE.md) | ML / deterministic engines |
| [`docs/SECURITY.md`](docs/SECURITY.md) | Security model |
| [`backend/prisma/README.md`](backend/prisma/README.md) | Seeding & demo accounts |

---

## License

Proprietary — all rights reserved. Provided as-is for demonstration and evaluation.
