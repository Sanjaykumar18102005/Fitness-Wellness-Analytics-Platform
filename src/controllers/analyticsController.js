const analyticsService = require('../services/analyticsService');

class AnalyticsController {
  async getDashboard(req, res) {
    try {
      const data = await analyticsService.getDashboardAnalytics();
      return res.status(200).json(data);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  }
}

module.exports = new AnalyticsController();
