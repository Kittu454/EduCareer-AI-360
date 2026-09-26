# Database Seeding (Development Only)

This directory contains the **development seed** for EduCareer-AI-360.
The seed script lives at [`seed.ts`](./seed.ts) and provisions a coherent,
**synthetic** demo dataset so dashboards, jobs, academics, skills, careers,
applications, readiness, notifications and the AI Career Coach context can be
demonstrated locally.

> Seeding is a **separate data path** from real user signup. Real signup still
> creates genuine `User` + `Student` records through the backend → PostgreSQL
> flow. The seed only adds demo data and demo accounts. **Never use it in
> production.**

## Prerequisites

1. **PostgreSQL must be running** and reachable via `DATABASE_URL` in
   [`backend/.env`](../.env) (default:
   `postgresql://postgres:postgres@localhost:5432/educareer_ai_360`).
   Make sure the credentials are valid for your local server — a wrong
   password produces `Prisma error P1000: Authentication failed`.
2. Apply migrations so the schema exists:
   ```powershell
   cd backend
   npx prisma migrate deploy --schema="../database/prisma/schema.prisma"
   ```

## Run the seed

From the `backend/` directory:

```powershell
npx prisma db seed
```

The command is registered in `backend/package.json` (`prisma.seed`) and runs
`tsx prisma/seed.ts`.

The seed is **idempotent** — it upserts on unique business keys and resets only
its own join/notification rows, so re-running it will not create uncontrolled
duplicates.

## What gets created

- **Institution**: EduCareer Demo University (`ECDU`)
- **Departments**: Computer Science (CSE), Information Technology (IT),
  Electronics (ECE), Mechanical (MECH), Business / Management (MBA)
- **Roles**: STUDENT, FACULTY, TPO, ADMIN
- **Skills**: 22 technical/soft skills, and 5 **careers** with required skills
- **Semester, subjects, academic records & attendance** for each demo student
- **Demo students** (5) with skills, skill gaps, career roadmaps, recommendations
  and placement readiness, e.g.:
  | Roll | Name | Dept | CGPA | Target career |
  |------|------|------|------|---------------|
  | 2024CSE001 | Aarav Sharma | CSE | 8.6 | Data Analyst |
  | 2024IT001 | Priya Nair | IT | 7.8 | Backend Developer |
  | 2024CSE002 | Rohan Verma | CSE | 9.0 | ML Engineer |
  | 2024ECE001 | Sneha Iyer | ECE | 8.1 | IoT Engineer |
  | 2024MBA001 | Arjun Patel | MBA | 8.0 | Business Analyst |
- **Companies & jobs** (one per target role) with job skills, job matches and
  submitted **applications** for eligible students
- **Resumes, internships, certifications** and role-appropriate **notifications**

## Development demo accounts

All demo accounts are **email-verified** and share a single development
password. These are local-only and must never be exposed in production.

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@demo.educareer.local` | `DemoPassw0rd!2024` |
| TPO | `tpo@demo.educareer.local` | `DemoPassw0rd!2024` |
| Faculty | `faculty@demo.educareer.local` | `DemoPassw0rd!2024` |
| Student | `student1@demo.educareer.local` … `student5@demo.educareer.local` | `DemoPassw0rd!2024` |

Sign in at the frontend (`/login`) with any of these to explore the role-specific
dashboards.

## AI Career Coach configuration

The coach uses a real OpenAI-compatible LLM configured via `backend/.env`:

```
OPENAI_API_KEY=        # leave empty -> coach reports "AI unavailable" (never fakes an answer)
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
```

No API key is committed. Add your own locally to enable live responses.

## Resetting development data

To start clean, drop and re-apply migrations, then re-seed:

```powershell
cd backend
npx prisma migrate reset --schema="../database/prisma/schema.prisma"
npx prisma db seed
```
