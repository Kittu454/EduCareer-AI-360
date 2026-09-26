import request from 'supertest';
import app from './app.js';

describe('System Health Endpoint Check', () => {
  it('should return 200 OK and health status', async () => {
    const response = await request(app).get('/api/v1/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('status', 'OK');
  });
});

describe('Authentication Foundation & RBAC Scoping', () => {
  it('rejects invalid registration input before database access', async () => {
    const response = await request(app).post('/api/v1/auth/register').send({ email: 'invalid' });
    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('requires authentication for current user endpoint', async () => {
    const response = await request(app).get('/api/v1/auth/me');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('requires authentication for student resources', async () => {
    const response = await request(app).get('/api/v1/students/me');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('requires authentication for job listings', async () => {
    const response = await request(app).get('/api/v1/jobs');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('requires authentication for skills taxonomy', async () => {
    const response = await request(app).get('/api/v1/skills');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('requires authentication for career recommendations', async () => {
    const response = await request(app).get('/api/v1/careers/students/me/career-recommendations');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('requires authentication for applications listing', async () => {
    const response = await request(app).get('/api/v1/applications');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('requires authentication for resume management', async () => {
    const response = await request(app).get('/api/v1/resumes');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('requires authentication for placement readiness', async () => {
    const response = await request(app).get('/api/v1/placement-readiness/students/me/placement-readiness');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('requires authentication for AI coach endpoints', async () => {
    const response = await request(app).get('/api/v1/ai-coach/conversations');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('requires authentication for admin system health', async () => {
    const response = await request(app).get('/api/v1/admin/system/health');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });
});

describe('Registration DTO contract (validated before database access)', () => {
  it('rejects a password shorter than the required minimum', async () => {
    const response = await request(app).post('/api/v1/auth/register').send({
      email: 'short.pass@example.com',
      password: 'too-short',
      firstName: 'Alex',
      lastName: 'Morgan',
      rollNumber: 'R1',
      admissionYear: 2024,
    });
    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects a missing roll number', async () => {
    const response = await request(app).post('/api/v1/auth/register').send({
      email: 'no.roll@example.com',
      password: 'a-very-long-password-123',
      firstName: 'Alex',
      lastName: 'Morgan',
      admissionYear: 2024,
    });
    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('AI Career Coach authorization', () => {
  it('requires authentication to send a coach message', async () => {
    const response = await request(app).post('/api/v1/ai-coach/messages').send({ messageText: 'hello' });
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('requires authentication to read coach status', async () => {
    const response = await request(app).get('/api/v1/ai-coach/status');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });
});

