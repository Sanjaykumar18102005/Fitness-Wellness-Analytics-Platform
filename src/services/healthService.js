const crypto = require('crypto');
const { query, withTransaction, memoryDb } = require('../config/db');
const riskThresholds = require('../config/riskThresholds');
const eventEmitter = require('./eventEmitter');

// AES-256-CBC Encryption helper for health data at rest
function encryptText(text) {
  if (!text) return text;
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(riskThresholds.ENCRYPTION_SECRET, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decryptText(encryptedText) {
  if (!encryptedText || !encryptedText.includes(':')) return encryptedText;
  try {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(riskThresholds.ENCRYPTION_SECRET, 'salt', 32);
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (e) {
    return encryptedText; // Fallback if not encrypted
  }
}

class HealthService {
  async submitAssessment(memberId, { medical_history, fitness_goals, emergency_contact }) {
    // Required fields validation
    if (!medical_history || !medical_history.trim()) {
      const err = new Error('Validation failed: medical_history is required');
      err.status = 400;
      throw err;
    }
    if (!fitness_goals || !fitness_goals.trim()) {
      const err = new Error('Validation failed: fitness_goals is required');
      err.status = 400;
      throw err;
    }
    if (!emergency_contact || !emergency_contact.trim()) {
      const err = new Error('Validation failed: emergency_contact is required');
      err.status = 400;
      throw err;
    }

    // Encrypt sensitive medical history
    const encryptedHistory = encryptText(medical_history);

    // Evaluate risk keywords in medical history
    const historyLower = medical_history.toLowerCase();
    const detectedKeywords = riskThresholds.RISK_KEYWORDS.filter((kw) => historyLower.includes(kw));
    const isRiskFlagged = detectedKeywords.length > 0;

    const insertRes = await query(
      `INSERT INTO health_assessments (member_id, medical_history, fitness_goals, emergency_contact, risk_flagged)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, member_id, fitness_goals, emergency_contact, risk_flagged, created_at`,
      [memberId, encryptedHistory, fitness_goals, emergency_contact, isRiskFlagged]
    );

    const assessment = insertRes.rows[0];

    if (isRiskFlagged) {
      const riskReason = `Health Assessment risk keywords detected: ${detectedKeywords.join(', ')}`;

      // Update user flag
      await query(`UPDATE users SET health_flagged = true WHERE id = $1`, [memberId]);

      // Add to consultant review queue
      await query(
        `INSERT INTO risk_review_queue (member_id, source, source_id, risk_reason, status)
         VALUES ($1, $2, $3, $4, $5)`,
        [memberId, 'assessment', assessment.id, riskReason, 'pending']
      );

      setImmediate(() => {
        eventEmitter.emit('health.risk_flagged', {
          memberId,
          source: 'assessment',
          riskReason,
        });
      });
    }

    return {
      ...assessment,
      medical_history: '[ENCRYPTED_AT_REST]',
    };
  }

  async logHealthMetrics(memberId, data) {
    const {
      metric_type = 'biometrics',
      weight_kg,
      systolic_bp,
      diastolic_bp,
      heart_rate,
      workout_type,
      duration_minutes,
      calories_burned,
      notes,
    } = data;

    // Validate plausible numbers
    if (weight_kg !== undefined && (typeof weight_kg !== 'number' || weight_kg <= 0 || weight_kg > riskThresholds.WEIGHT.MAX_KG)) {
      const err = new Error(`Validation failed: weight_kg must be a positive number up to ${riskThresholds.WEIGHT.MAX_KG}`);
      err.status = 400;
      throw err;
    }

    if (systolic_bp !== undefined && (typeof systolic_bp !== 'number' || systolic_bp <= 0 || systolic_bp > 300)) {
      const err = new Error('Validation failed: systolic_bp must be a positive realistic value');
      err.status = 400;
      throw err;
    }

    if (diastolic_bp !== undefined && (typeof diastolic_bp !== 'number' || diastolic_bp <= 0 || diastolic_bp > 200)) {
      const err = new Error('Validation failed: diastolic_bp must be a positive realistic value');
      err.status = 400;
      throw err;
    }

    if (heart_rate !== undefined && (typeof heart_rate !== 'number' || heart_rate <= 0 || heart_rate > 250)) {
      const err = new Error('Validation failed: heart_rate must be a positive realistic value');
      err.status = 400;
      throw err;
    }

    if (duration_minutes !== undefined && (typeof duration_minutes !== 'number' || duration_minutes <= 0)) {
      const err = new Error('Validation failed: duration_minutes must be greater than zero');
      err.status = 400;
      throw err;
    }

    if (calories_burned !== undefined && (typeof calories_burned !== 'number' || calories_burned < 0)) {
      const err = new Error('Validation failed: calories_burned cannot be negative');
      err.status = 400;
      throw err;
    }

    // Evaluate Risk Thresholds
    const riskReasons = [];
    if (systolic_bp > riskThresholds.BLOOD_PRESSURE.SYSTOLIC_MAX) {
      riskReasons.push(`High Systolic BP: ${systolic_bp} mmHg (Threshold: >${riskThresholds.BLOOD_PRESSURE.SYSTOLIC_MAX})`);
    }
    if (diastolic_bp > riskThresholds.BLOOD_PRESSURE.DIASTOLIC_MAX) {
      riskReasons.push(`High Diastolic BP: ${diastolic_bp} mmHg (Threshold: >${riskThresholds.BLOOD_PRESSURE.DIASTOLIC_MAX})`);
    }
    if (heart_rate > riskThresholds.HEART_RATE.MAX) {
      riskReasons.push(`High Heart Rate: ${heart_rate} bpm (Threshold: >${riskThresholds.HEART_RATE.MAX})`);
    } else if (heart_rate < riskThresholds.HEART_RATE.MIN) {
      riskReasons.push(`Low Heart Rate: ${heart_rate} bpm (Threshold: <${riskThresholds.HEART_RATE.MIN})`);
    }

    const isRiskFlagged = riskReasons.length > 0;
    const riskReasonsStr = isRiskFlagged ? riskReasons.join('; ') : null;

    const insertRes = await query(
      `INSERT INTO health_metrics (member_id, metric_type, weight_kg, systolic_bp, diastolic_bp, heart_rate, workout_type, duration_minutes, calories_burned, notes, risk_flagged, risk_reasons)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        memberId,
        metric_type,
        weight_kg || null,
        systolic_bp || null,
        diastolic_bp || null,
        heart_rate || null,
        workout_type || null,
        duration_minutes || null,
        calories_burned || null,
        notes || null,
        isRiskFlagged,
        riskReasonsStr,
      ]
    );

    const metricRecord = insertRes.rows[0];

    if (isRiskFlagged) {
      await query(`UPDATE users SET health_flagged = true WHERE id = $1`, [memberId]);

      await query(
        `INSERT INTO risk_review_queue (member_id, source, source_id, risk_reason, status)
         VALUES ($1, $2, $3, $4, $5)`,
        [memberId, 'metric', metricRecord.id, riskReasonsStr, 'pending']
      );

      setImmediate(() => {
        eventEmitter.emit('health.risk_flagged', {
          memberId,
          source: 'metric',
          riskReason: riskReasonsStr,
        });
      });
    }

    return metricRecord;
  }

  async getMemberHealthLogs(memberId) {
    const assessmentRes = await query(`SELECT * FROM health_assessments WHERE member_id = $1 ORDER BY id DESC LIMIT 1`, [memberId]);
    const metricsRes = await query(`SELECT * FROM health_metrics WHERE member_id = $1 ORDER BY logged_at DESC`, [memberId]);

    const assessment = assessmentRes.rows && assessmentRes.rows.length > 0 ? assessmentRes.rows[0] : null;
    if (assessment && assessment.medical_history) {
      assessment.medical_history_decrypted = decryptText(assessment.medical_history);
      assessment.medical_history = '[ENCRYPTED_AT_REST]';
    }

    return {
      assessment,
      metrics: metricsRes.rows || [],
    };
  }

  async getRiskReviewQueue() {
    const res = await query(
      `SELECT q.id, q.member_id, u.name as member_name, u.email as member_email,
              q.source, q.source_id, q.risk_reason, q.status, q.consultant_notes, q.created_at
       FROM risk_review_queue q
       JOIN users u ON q.member_id = u.id
       ORDER BY q.created_at DESC`
    );
    return res.rows || [];
  }

  async reviewRiskItem(consultantId, reviewId, { status = 'reviewed', notes = '' }) {
    const res = await query(`SELECT * FROM risk_review_queue WHERE id = $1`, [reviewId]);
    if (!res.rows || res.rows.length === 0) {
      const err = new Error('Risk review queue item not found');
      err.status = 404;
      throw err;
    }

    await query(
      `UPDATE risk_review_queue SET status = $1, consultant_notes = $2, reviewed_by = $3 WHERE id = $4`,
      [status, notes, consultantId, reviewId]
    );

    return { message: 'Risk item reviewed successfully', reviewId, status };
  }
}

module.exports = new HealthService();
