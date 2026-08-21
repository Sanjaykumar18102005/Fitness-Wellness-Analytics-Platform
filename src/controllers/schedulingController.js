const schedulingService = require('../services/schedulingService');

class SchedulingController {
  async addAvailability(req, res) {
    try {
      const trainerId = req.user.role === 'admin' && req.body.trainerId ? req.body.trainerId : req.user.id;
      const result = await schedulingService.addAvailability(trainerId, req.body);
      return res.status(201).json(result);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  }

  async getAvailableSlots(req, res) {
    try {
      const trainerId = req.query.trainerId ? parseInt(req.query.trainerId, 10) : null;
      const slots = await schedulingService.getAvailableSlots(trainerId);
      return res.status(200).json(slots);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  }

  async bookSlot(req, res) {
    try {
      const { availabilityId } = req.body;
      const booking = await schedulingService.bookSlot(req.user.id, availabilityId);
      return res.status(201).json(booking);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  }

  async getMyBookings(req, res) {
    try {
      const bookings = await schedulingService.getMyBookings(req.user.id, req.user.role);
      return res.status(200).json(bookings);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  }

  async cancelBooking(req, res) {
    try {
      const bookingId = parseInt(req.params.id, 10);
      const result = await schedulingService.cancelBooking(req.user.id, req.user.role, bookingId);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  }
}

module.exports = new SchedulingController();
