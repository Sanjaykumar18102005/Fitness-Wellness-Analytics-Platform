const express = require('express');
const router = express.Router();
const schedulingController = require('../controllers/schedulingController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// Public or member endpoint to browse open trainer slots
router.get('/availability', authenticateToken, (req, res) => schedulingController.getAvailableSlots(req, res));

// Trainers or admins add availability slots
router.post('/availability', authenticateToken, requireRole('trainer', 'admin'), (req, res) => schedulingController.addAvailability(req, res));

// Book an open slot (members or admins)
router.post('/book', authenticateToken, requireRole('member', 'admin'), (req, res) => schedulingController.bookSlot(req, res));

// View own bookings (members, trainers, admins)
router.get('/bookings', authenticateToken, (req, res) => schedulingController.getMyBookings(req, res));

// Cancel booking (member owner, assigned trainer, or admin)
router.post('/bookings/:id/cancel', authenticateToken, (req, res) => schedulingController.cancelBooking(req, res));

module.exports = router;
