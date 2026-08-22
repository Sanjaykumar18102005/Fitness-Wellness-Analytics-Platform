const recommendationService = require('../../src/services/recommendationService');
const facilityService = require('../../src/services/facilityService');
const analyticsService = require('../../src/services/analyticsService');
const { setUseMemory, memoryDb } = require('../../src/config/db');

describe('Recommendations, Facility Equipment & Analytics Services', () => {
  beforeEach(() => {
    setUseMemory(true);
    memoryDb.reset();
  });

  describe('Recommendation Service', () => {
    it('should generate personalized nutrition and workout plan', async () => {
      const plan = await recommendationService.getPersonalizedPlan(1);
      expect(plan).toHaveProperty('nutrition');
      expect(plan).toHaveProperty('workoutPlan');
      expect(plan.nutrition.dailyCalories).toBeGreaterThan(1000);
      expect(plan.nutrition.macros.protein.grams).toBeGreaterThan(50);
      expect(Array.isArray(plan.workoutPlan.schedule)).toBe(true);
    });
  });

  describe('Facility Service', () => {
    it('should retrieve equipment inventory and support status updates', async () => {
      const equipment = await facilityService.getAllEquipment();
      expect(Array.isArray(equipment)).toBe(true);
      expect(equipment.length).toBeGreaterThan(0);

      const updated = await facilityService.updateEquipmentStatus(1, {
        in_use_units: 10,
        status: 'High Demand'
      });
      expect(updated.in_use_units).toBe(10);
      expect(updated.status).toBe('High Demand');
    });
  });

  describe('Analytics Service', () => {
    it('should return executive analytics summary and multi-branch metrics', async () => {
      const analytics = await analyticsService.getDashboardAnalytics();
      expect(analytics).toHaveProperty('summary');
      expect(analytics).toHaveProperty('branchBreakdown');
      expect(analytics.summary.totalBranchesCount).toBe(4);
      expect(analytics.branchBreakdown.length).toBe(4);
      expect(analytics.summary.retentionRatePct).toBeGreaterThan(90);
    });
  });
});
