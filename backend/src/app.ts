import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './modules/auth/auth.routes.js';
import studentsRoutes from './modules/students/students.routes.js';
import academicsRoutes from './modules/academics/academics.routes.js';
import skillsRoutes from './modules/skills/skills.routes.js';
import careersRoutes from './modules/careers/careers.routes.js';
import jobsRoutes from './modules/jobs/jobs.routes.js';
import applicationsRoutes from './modules/applications/applications.routes.js';
import resumesRoutes from './modules/resumes/resumes.routes.js';
import readinessRoutes from './modules/readiness/readiness.routes.js';
import analyticsRoutes from './modules/analytics/analytics.routes.js';
import reportsRoutes from './modules/reports/reports.routes.js';
import notificationsRoutes from './modules/notifications/notifications.routes.js';
import aiRoutes from './modules/ai/ai.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import businessRoutes from './modules/business/business.routes.js';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Public health check
app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'OK',
      timestamp: new Date().toISOString()
    }
  });
});

// Mounted modules
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/students', studentsRoutes);
app.use('/api/v1/academics', academicsRoutes);
app.use('/api/v1/skills', skillsRoutes);
app.use('/api/v1/careers', careersRoutes);
app.use('/api/v1/jobs', jobsRoutes);
app.use('/api/v1/applications', applicationsRoutes);
app.use('/api/v1/resumes', resumesRoutes);
app.use('/api/v1/placement-readiness', readinessRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/ai-coach', aiRoutes);
app.use('/api/v1/admin', adminRoutes);

// General fallback for legacy business routes
app.use('/api/v1', businessRoutes);

export default app;
