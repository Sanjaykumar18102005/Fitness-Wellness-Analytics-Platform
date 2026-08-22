const healthService = require('../services/healthService');
const recommendationService = require('../services/recommendationService');

class HealthController {
  async submitAssessment(req, res) {
    try {
      const assessment = await healthService.submitAssessment(req.user.id, req.body);
      return res.status(201).json(assessment);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  }

  async logHealthMetrics(req, res) {
    try {
      const metric = await healthService.logHealthMetrics(req.user.id, req.body);
      return res.status(201).json(metric);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  }

  async getMyHealthLogs(req, res) {
    try {
      const logs = await healthService.getMemberHealthLogs(req.user.id);
      return res.status(200).json(logs);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  }

  async getRecommendations(req, res) {
    try {
      const plan = await recommendationService.getPersonalizedPlan(req.user.id);
      return res.status(200).json(plan);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  }

  async getRiskReviewQueue(req, res) {
    try {
      const queue = await healthService.getRiskReviewQueue();
      return res.status(200).json(queue);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  }

  async reviewRiskItem(req, res) {
    try {
      const reviewId = parseInt(req.params.id, 10);
      const result = await healthService.reviewRiskItem(req.user.id, reviewId, req.body);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  }
}

module.exports = new HealthController();
