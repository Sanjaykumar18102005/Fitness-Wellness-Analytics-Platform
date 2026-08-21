const { query } = require('../config/db');
const eventEmitter = require('./eventEmitter');

class MembershipService {
  async getPlans() {
    const res = await query('SELECT * FROM membership_plans ORDER BY price ASC');
    return res.rows || [];
  }

  async enrollPlan(userId, planId) {
    const planRes = await query('SELECT * FROM membership_plans WHERE id = $1', [planId]);
    if (!planRes.rows || planRes.rows.length === 0) {
      const err = new Error('Membership plan not found');
      err.status = 404;
      throw err;
    }

    const plan = planRes.rows[0];
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + (plan.duration_days || 30));

    await query(
      `UPDATE users SET membership_plan_id = $1, membership_expiry = $2 WHERE id = $3`,
      [planId, expiry, userId]
    );

    return {
      message: `Enrolled in ${plan.name} successfully`,
      plan,
      membership_expiry: expiry,
    };
  }

  async processRenewalReminders() {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch members whose expiry is within 7 days and haven't had a reminder sent in the last 7 days
    const res = await query(
      `SELECT id, email, name, membership_expiry, last_renewal_reminder_sent_at
       FROM users
       WHERE membership_expiry IS NOT NULL
         AND membership_expiry <= $1
         AND (last_renewal_reminder_sent_at IS NULL OR last_renewal_reminder_sent_at <= $2)`,
      [sevenDaysFromNow, sevenDaysAgo]
    );

    const membersToRemind = res.rows || [];
    const notified = [];

    for (const member of membersToRemind) {
      // Mark reminder sent timestamp immediately to prevent duplicate sends
      await query(
        `UPDATE users SET last_renewal_reminder_sent_at = $1 WHERE id = $2`,
        [now, member.id]
      );

      // Trigger async event notification path (does not block)
      setImmediate(() => {
        eventEmitter.emit('membership.renewal_due', {
          userId: member.id,
          email: member.email,
          name: member.name,
          expiry: member.membership_expiry,
        });
      });

      notified.push({ id: member.id, email: member.email, expiry: member.membership_expiry });
    }

    return {
      processedCount: notified.length,
      notifiedMembers: notified,
    };
  }
}

module.exports = new MembershipService();
