const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// Member health onboarding assessment (required fields validation)
router.post('/assessment', authenticateToken, requireRole('member', 'admin'), (req, res) => healthController.submitAssessment(req, res));

// Member workout & biometric logging (validation & risk thresholds)
router.post('/metrics', authenticateToken, requireRole('member', 'admin'), (req, res) => healthController.logHealthMetrics(req, res));

// Member view own health logs
router.get('/my-logs', authenticateToken, (req, res) => healthController.getMyHealthLogs(req, res));

// Health Consultant & Admin only: view risk review queue
router.get('/review-queue', authenticateToken, requireRole('consultant', 'admin'), (req, res) => healthController.getRiskReviewQueue(req, res));

// Health Consultant & Admin only: review risk flagged item
router.post('/review-queue/:id/review', authenticateToken, requireRole('consultant', 'admin'), (req, res) => healthController.reviewRiskItem(req, res));

module.exports = router;
