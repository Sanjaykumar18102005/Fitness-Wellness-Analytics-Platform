const express = require('express');
const router = express.Router();
const membershipController = require('../controllers/membershipController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.get('/plans', (req, res) => membershipController.getPlans(req, res));
router.post('/enroll', authenticateToken, (req, res) => membershipController.enrollPlan(req, res));
router.post('/reminders/run', authenticateToken, requireRole('admin'), (req, res) => membershipController.triggerRenewalReminders(req, res));

module.exports = router;
