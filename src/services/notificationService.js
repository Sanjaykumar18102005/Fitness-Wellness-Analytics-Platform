const eventEmitter = require('./eventEmitter');
const { query } = require('../config/db');
const { getRedisClient } = require('../config/redis');

class NotificationService {
  constructor() {
    this.initListeners();
  }

  initListeners() {
    eventEmitter.on('booking.created', (payload) => {
      this.handleAsyncNotification('session_reminder', payload.memberId || payload.userId, payload);
    });

    eventEmitter.on('booking.cancelled', (payload) => {
      this.handleAsyncNotification('booking_cancellation', payload.memberId || payload.userId, payload);
    });

    eventEmitter.on('membership.renewal_due', (payload) => {
      this.handleAsyncNotification('renewal_reminder', payload.userId || payload.id, payload);
    });

    eventEmitter.on('health.risk_flagged', (payload) => {
      this.handleAsyncNotification('risk_alert', payload.memberId, payload);
    });
  }

  async handleAsyncNotification(type, userId, payload) {
    // Wrapped in try/catch to guarantee notification failures NEVER disrupt main HTTP workflows
    try {
      console.log(`[ASYNC NOTIFICATION STUB] Type: ${type} | User: ${userId} | Payload:`, JSON.stringify(payload));

      // Publish to Redis channel if Redis is active
      const redis = getRedisClient();
      await redis.publish('notifications', JSON.stringify({ type, userId, payload }));

      // Persist in notification log table
      if (userId) {
        await query(
          `INSERT INTO notifications_log (user_id, type, payload, status) VALUES ($1, $2, $3, 'sent')`,
          [userId, type, JSON.stringify(payload)]
        );
      }
    } catch (err) {
      console.warn(`[NOTIFICATION WARN] Failed to log notification (non-blocking): ${err.message}`);
    }
  }

  async getUserNotifications(userId) {
    const res = await query(
      `SELECT * FROM notifications_log WHERE user_id = $1 ORDER BY sent_at DESC LIMIT 50`,
      [userId]
    );
    return res.rows || [];
  }
}

const notificationService = new NotificationService();
module.exports = notificationService;
