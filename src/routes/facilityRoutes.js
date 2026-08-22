const express = require('express');
const router = express.Router();
const facilityController = require('../controllers/facilityController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.get('/equipment', authenticateToken, (req, res) => facilityController.getEquipment(req, res));
router.post('/equipment/:id/status', authenticateToken, requireRole('admin', 'consultant'), (req, res) => facilityController.updateEquipmentStatus(req, res));

module.exports = router;
