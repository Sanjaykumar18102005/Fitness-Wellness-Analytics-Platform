const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { JWT_SECRET } = require('../middleware/authMiddleware');

class AuthService {
  async register({ email, password, name, role = 'member', membership_plan_id = null }) {
    if (!email || !password || !name) {
      const err = new Error('Email, password, and name are required');
      err.status = 400;
      throw err;
    }

    const validRoles = ['member', 'trainer', 'consultant', 'admin'];
    if (role && !validRoles.includes(role)) {
      const err = new Error(`Invalid role. Allowed roles: ${validRoles.join(', ')}`);
      err.status = 400;
      throw err;
    }

    // Check existing user
    const existing = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows && existing.rows.length > 0) {
      const err = new Error('User with this email already exists');
      err.status = 409;
      throw err;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    let expiry = null;

    // Set 30 days expiry if plan provided
    if (membership_plan_id) {
      const planRes = await query('SELECT * FROM membership_plans WHERE id = $1', [membership_plan_id]);
      if (planRes.rows && planRes.rows.length > 0) {
        const plan = planRes.rows[0];
        const d = new Date();
        d.setDate(d.getDate() + (plan.duration_days || 30));
        expiry = d;
      }
    }

    const insertRes = await query(
      `INSERT INTO users (email, password_hash, name, role, membership_plan_id, membership_expiry)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, name, role, membership_plan_id, membership_expiry, created_at`,
      [email, passwordHash, name, role, membership_plan_id, expiry]
    );

    const user = insertRes.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, {
      expiresIn: '24h',
    });

    return { user, token };
  }

  async login({ email, password }) {
    if (!email || !password) {
      const err = new Error('Email and password are required');
      err.status = 400;
      throw err;
    }

    const res = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (!res.rows || res.rows.length === 0) {
      const err = new Error('Invalid email or password');
      err.status = 401;
      throw err;
    }

    const user = res.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      const err = new Error('Invalid email or password');
      err.status = 401;
      throw err;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const userSafe = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      membership_plan_id: user.membership_plan_id,
      membership_expiry: user.membership_expiry,
      health_flagged: user.health_flagged,
    };

    return { user: userSafe, token };
  }

  async getProfile(userId) {
    const res = await query(
      `SELECT id, email, name, role, membership_plan_id, membership_expiry, health_flagged, created_at FROM users WHERE id = $1`,
      [userId]
    );
    if (!res.rows || res.rows.length === 0) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }
    return res.rows[0];
  }

  async getAllMembers() {
    const res = await query(
      `SELECT id, email, name, role, membership_plan_id, membership_expiry, health_flagged, created_at FROM users ORDER BY id ASC`
    );
    return res.rows || [];
  }
}

module.exports = new AuthService();
