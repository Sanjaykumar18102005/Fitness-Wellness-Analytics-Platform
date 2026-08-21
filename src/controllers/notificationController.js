const notificationService = require('../services/notificationService');

class NotificationController {
  async getMyNotifications(req, res) {
    try {
      const logs = await notificationService.getUserNotifications(req.user.id);
      return res.status(200).json(logs);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  }
}

module.exports = new NotificationController();
