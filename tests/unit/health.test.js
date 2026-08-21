const healthService = require('../../src/services/healthService');
const { setUseMemory, memoryDb } = require('../../src/config/db');

describe('Health & Progress Module', () => {
  beforeEach(() => {
    setUseMemory(true);
    memoryDb.reset();
    memoryDb.tables.users.push({
      id: 1,
      email: 'member@example.com',
      name: 'Test Member',
      role: 'member',
      health_flagged: false,
    });
  });

  describe('Health Assessment Validation', () => {
    it('should reject health assessment missing required fields', async () => {
      await expect(
        healthService.submitAssessment(1, {
          medical_history: '',
          fitness_goals: 'Build muscle',
          emergency_contact: '555-0199',
        })
      ).rejects.toThrow('medical_history is required');

      await expect(
        healthService.submitAssessment(1, {
          medical_history: 'None',
          fitness_goals: '',
          emergency_contact: '555-0199',
        })
      ).rejects.toThrow('fitness_goals is required');
    });

    it('should accept valid health assessment and encrypt medical history', async () => {
      const result = await healthService.submitAssessment(1, {
        medical_history: 'No past injuries or cardiac issues',
        fitness_goals: 'Increase endurance',
        emergency_contact: 'Jane Doe 555-0199',
      });

      expect(result).toHaveProperty('id');
      expect(result.medical_history).toBe('[ENCRYPTED_AT_REST]');
    });
  });

  describe('Biometric Logging & Risk Threshold Triggering', () => {
    it('should reject invalid or negative biometric values', async () => {
      await expect(
        healthService.logHealthMetrics(1, {
          weight_kg: -75,
        })
      ).rejects.toThrow('weight_kg must be a positive number');

      await expect(
        healthService.logHealthMetrics(1, {
          duration_minutes: 0,
        })
      ).rejects.toThrow('duration_minutes must be greater than zero');
    });

    it('should trigger risk-flag review queue entry when BP exceeds 140/90 threshold', async () => {
      const metric = await healthService.logHealthMetrics(1, {
        metric_type: 'biometrics',
        systolic_bp: 155, // > 140 -> triggers high BP risk flag
        diastolic_bp: 95,  // > 90 -> triggers high BP risk flag
        heart_rate: 78,
      });

      expect(metric.risk_flagged).toBe(true);
      expect(metric.risk_reasons).toContain('High Systolic BP');

      // Verify entry added to risk_review_queue in memory
      const queueItems = await healthService.getRiskReviewQueue();
      expect(queueItems.length).toBeGreaterThan(0);
      expect(queueItems[0].risk_reason).toContain('High Systolic BP');
    });
  });
});
