const request = require('supertest');
const app = require('../../src/server');
const { setUseMemory, memoryDb } = require('../../src/config/db');

describe('Fitness Platform Integration Test Suite', () => {
  let member1Token, member2Token, trainerToken, consultantToken, adminToken;
  let slotId;

  beforeAll(async () => {
    setUseMemory(true);
    memoryDb.reset();
    await require('../../scripts/seed')();
  });

  describe('1. Membership & Authentication Module', () => {
    it('should register Admin, Consultant, Trainer, and Members', async () => {
      // Register Member 1
      const res1 = await request(app).post('/api/auth/register').send({
        email: 'member1@test.com',
        password: 'Password123!',
        name: 'Member One',
        role: 'member',
      });
      expect(res1.status).toBe(201);
      expect(res1.body).toHaveProperty('token');
      member1Token = res1.body.token;

      // Register Member 2
      const res2 = await request(app).post('/api/auth/register').send({
        email: 'member2@test.com',
        password: 'Password123!',
        name: 'Member Two',
        role: 'member',
      });
      expect(res2.status).toBe(201);
      member2Token = res2.body.token;

      // Register Trainer
      const resT = await request(app).post('/api/auth/register').send({
        email: 'trainer@test.com',
        password: 'Password123!',
        name: 'Trainer Bob',
        role: 'trainer',
      });
      expect(resT.status).toBe(201);
      trainerToken = resT.body.token;

      // Register Consultant
      const resC = await request(app).post('/api/auth/register').send({
        email: 'consultant@test.com',
        password: 'Password123!',
        name: 'Consultant Alice',
        role: 'consultant',
      });
      expect(resC.status).toBe(201);
      consultantToken = resC.body.token;

      // Register Admin
      const resA = await request(app).post('/api/auth/register').send({
        email: 'admin@test.com',
        password: 'Password123!',
        name: 'Admin Boss',
        role: 'admin',
      });
      expect(resA.status).toBe(201);
      adminToken = resA.body.token;
    });

    it('should list membership plans and allow plan enrollment', async () => {
      const plansRes = await request(app).get('/api/membership/plans');
      expect(plansRes.status).toBe(200);

      const enrollRes = await request(app)
        .post('/api/membership/enroll')
        .set('Authorization', `Bearer ${member1Token}`)
        .send({ planId: 1 });
      expect(enrollRes.status).toBe(200);
    });

    it('should execute 7-day renewal reminder job without duplicate sends', async () => {
      // Simulate member expiring in 3 days
      const { query } = require('../../src/config/db');
      await query(`UPDATE users SET membership_expiry = $1 WHERE email = $2`, [
        new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        'member1@test.com',
      ]);

      const run1 = await request(app)
        .post('/api/membership/reminders/run')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(run1.status).toBe(200);
      expect(run1.body.processedCount).toBe(1);

      // Run 2 immediately -> must prevent duplicate send
      const run2 = await request(app)
        .post('/api/membership/reminders/run')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(run2.status).toBe(200);
      expect(run2.body.processedCount).toBe(0);
    });
  });

  describe('2. Scheduling & Concurrent Booking Module', () => {
    it('should allow trainer to set availability slot', async () => {
      const res = await request(app)
        .post('/api/scheduling/availability')
        .set('Authorization', `Bearer ${trainerToken}`)
        .send({
          startTime: '2026-09-10T10:00:00Z',
          endTime: '2026-09-10T11:00:00Z',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      slotId = res.body.id;
    });

    it('should prevent concurrent double booking of the same slot', async () => {
      const [res1, res2] = await Promise.all([
        request(app)
          .post('/api/scheduling/book')
          .set('Authorization', `Bearer ${member1Token}`)
          .send({ availabilityId: slotId }),
        request(app)
          .post('/api/scheduling/book')
          .set('Authorization', `Bearer ${member2Token}`)
          .send({ availabilityId: slotId }),
      ]);

      const statuses = [res1.status, res2.status];
      expect(statuses).toContain(201);
      expect(statuses).toContain(409);
    });
  });

  describe('3. Health Onboarding, Biometrics, and Risk Threshold Queue', () => {
    it('should validate required fields on health assessment', async () => {
      const res = await request(app)
        .post('/api/health/assessment')
        .set('Authorization', `Bearer ${member1Token}`)
        .send({
          medical_history: '',
          fitness_goals: 'Build strength',
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('medical_history is required');
    });

    it('should submit valid health assessment and flag risk if BP > 140/90 on metrics', async () => {
      const resAssessment = await request(app)
        .post('/api/health/assessment')
        .set('Authorization', `Bearer ${member1Token}`)
        .send({
          medical_history: 'No major history',
          fitness_goals: 'Cardio endurance',
          emergency_contact: 'Jane 555-0100',
        });
      expect(resAssessment.status).toBe(201);

      // Log high BP metric (150/95)
      const resMetric = await request(app)
        .post('/api/health/metrics')
        .set('Authorization', `Bearer ${member1Token}`)
        .send({
          metric_type: 'biometrics',
          systolic_bp: 150,
          diastolic_bp: 95,
          heart_rate: 80,
          weight_kg: 72,
        });
      expect(resMetric.status).toBe(201);
      expect(resMetric.body.risk_flagged).toBe(true);

      // Verify consultant can view risk review queue
      const resQueue = await request(app)
        .get('/api/health/review-queue')
        .set('Authorization', `Bearer ${consultantToken}`);
      expect(resQueue.status).toBe(200);
      expect(resQueue.body.length).toBeGreaterThan(0);
    });

    it('should restrict risk review queue from regular members (RBAC check)', async () => {
      const res = await request(app)
        .get('/api/health/review-queue')
        .set('Authorization', `Bearer ${member1Token}`);
      expect(res.status).toBe(403);
    });
  });
});
