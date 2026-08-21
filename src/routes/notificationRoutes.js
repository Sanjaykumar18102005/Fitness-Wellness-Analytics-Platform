const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/my-notifications', authenticateToken, (req, res) => notificationController.getMyNotifications(req, res));

module.exports = router;
