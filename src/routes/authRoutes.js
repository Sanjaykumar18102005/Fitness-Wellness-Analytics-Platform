const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.post('/register', (req, res) => authController.register(req, res));
router.post('/login', (req, res) => authController.login(req, res));
router.get('/profile', authenticateToken, (req, res) => authController.getProfile(req, res));
router.get('/members', authenticateToken, requireRole('admin'), (req, res) => authController.getAllMembers(req, res));

module.exports = router;
