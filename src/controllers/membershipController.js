const membershipService = require('../services/membershipService');

class MembershipController {
  async getPlans(req, res) {
    try {
      const plans = await membershipService.getPlans();
      return res.status(200).json(plans);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  }

  async enrollPlan(req, res) {
    try {
      const { planId } = req.body;
      if (!planId) {
        return res.status(400).json({ error: 'planId is required' });
      }
      const result = await membershipService.enrollPlan(req.user.id, planId);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  }

  async triggerRenewalReminders(req, res) {
    try {
      const result = await membershipService.processRenewalReminders();
      return res.status(200).json(result);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  }
}

module.exports = new MembershipController();
