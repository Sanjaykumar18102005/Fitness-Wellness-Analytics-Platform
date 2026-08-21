const { query, withTransaction, memoryDb } = require('../config/db');
const eventEmitter = require('./eventEmitter');

class SchedulingService {
  async addAvailability(trainerId, { startTime, endTime }) {
    if (!startTime || !endTime) {
      const err = new Error('startTime and endTime are required');
      err.status = 400;
      throw err;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      const err = new Error('Invalid time range: startTime must be before endTime');
      err.status = 400;
      throw err;
    }

    // Check for existing overlapping availability for this trainer
    const overlapRes = await query(
      `SELECT * FROM trainer_availability
       WHERE trainer_id = $1 AND start_time < $2 AND end_time > $3`,
      [trainerId, end, start]
    );

    if (overlapRes.rows && overlapRes.rows.length > 0) {
      const err = new Error('Trainer availability overlaps with an existing time slot');
      err.status = 409;
      throw err;
    }

    const insertRes = await query(
      `INSERT INTO trainer_availability (trainer_id, start_time, end_time, is_booked)
       VALUES ($1, $2, $3, $4)
       RETURNING id, trainer_id, start_time, end_time, is_booked, created_at`,
      [trainerId, start, end, false]
    );

    return insertRes.rows[0];
  }

  async getAvailableSlots(trainerId = null) {
    let sql = `SELECT a.id, a.trainer_id, u.name as trainer_name, u.email as trainer_email, a.start_time, a.end_time, a.is_booked
               FROM trainer_availability a
               JOIN users u ON a.trainer_id = u.id
               WHERE a.is_booked = false`;
    const params = [];

    if (trainerId) {
      sql += ` AND a.trainer_id = $1`;
      params.push(trainerId);
    }

    sql += ` ORDER BY a.start_time ASC`;

    const res = await query(sql, params);
    return res.rows || [];
  }

  async bookSlot(memberId, availabilityId) {
    if (!availabilityId) {
      const err = new Error('availabilityId is required');
      err.status = 400;
      throw err;
    }

    // Perform atomic transaction lock to guarantee double-booking prevention under concurrency
    return await withTransaction(async (client) => {
      // 1. Lock availability slot FOR UPDATE or in-memory lock
      const slotRes = await client.query(
        `SELECT * FROM trainer_availability WHERE id = $1 FOR UPDATE`,
        [availabilityId]
      );

      if (!slotRes.rows || slotRes.rows.length === 0) {
        const err = new Error('Trainer availability slot not found');
        err.status = 404;
        throw err;
      }

      const slot = slotRes.rows[0];
      if (slot.is_booked) {
        const err = new Error('Slot no longer available');
        err.status = 409;
        throw err;
      }

      // 2. Mark slot booked atomically
      const updateRes = await client.query(
        `UPDATE trainer_availability SET is_booked = true WHERE id = $1 AND is_booked = false RETURNING *`,
        [availabilityId]
      );

      if (!updateRes.rows || updateRes.rows.length === 0) {
        const err = new Error('Slot no longer available');
        err.status = 409;
        throw err;
      }

      // 3. Create booking record
      const bookingRes = await client.query(
        `INSERT INTO bookings (member_id, trainer_id, availability_id, start_time, end_time, status)
         VALUES ($1, $2, $3, $4, $5, 'confirmed')
         RETURNING id, member_id, trainer_id, availability_id, start_time, end_time, status, created_at`,
        [memberId, slot.trainer_id, slot.id, slot.start_time, slot.end_time]
      );

      const booking = bookingRes.rows[0];

      // Async event notification (non-blocking)
      setImmediate(() => {
        eventEmitter.emit('booking.created', {
          bookingId: booking.id,
          memberId,
          trainerId: slot.trainer_id,
          startTime: slot.start_time,
          endTime: slot.end_time,
        });
      });

      return booking;
    });
  }

  async getMyBookings(userId, role) {
    let sql = `SELECT b.id, b.member_id, m.name as member_name, m.email as member_email,
                      b.trainer_id, t.name as trainer_name, t.email as trainer_email,
                      b.start_time, b.end_time, b.status, b.created_at
               FROM bookings b
               JOIN users m ON b.member_id = m.id
               JOIN users t ON b.trainer_id = t.id`;
    const params = [];

    if (role === 'member') {
      sql += ` WHERE b.member_id = $1`;
      params.push(userId);
    } else if (role === 'trainer') {
      sql += ` WHERE b.trainer_id = $1`;
      params.push(userId);
    }

    sql += ` ORDER BY b.start_time DESC`;

    const res = await query(sql, params);
    return res.rows || [];
  }

  async cancelBooking(userId, role, bookingId) {
    return await withTransaction(async (client) => {
      const res = await client.query(`SELECT * FROM bookings WHERE id = $1`, [bookingId]);
      if (!res.rows || res.rows.length === 0) {
        const err = new Error('Booking not found');
        err.status = 404;
        throw err;
      }

      const booking = res.rows[0];

      // Check RBAC permission (member owns booking, or trainer assigned to it, or admin)
      if (role === 'member' && booking.member_id != userId) {
        const err = new Error('Forbidden: You can only cancel your own bookings');
        err.status = 403;
        throw err;
      }
      if (role === 'trainer' && booking.trainer_id != userId) {
        const err = new Error('Forbidden: You can only cancel bookings assigned to you');
        err.status = 403;
        throw err;
      }

      if (booking.status === 'cancelled') {
        const err = new Error('Booking is already cancelled');
        err.status = 400;
        throw err;
      }

      // Mark booking cancelled
      await client.query(`UPDATE bookings SET status = 'cancelled', updated_at = NOW() WHERE id = $1`, [bookingId]);

      // Free availability slot
      if (booking.availability_id) {
        await client.query(`UPDATE trainer_availability SET is_booked = false WHERE id = $1`, [booking.availability_id]);
      }

      setImmediate(() => {
        eventEmitter.emit('booking.cancelled', {
          bookingId: booking.id,
          memberId: booking.member_id,
          trainerId: booking.trainer_id,
        });
      });

      return { message: 'Booking cancelled successfully', bookingId };
    });
  }
}

module.exports = new SchedulingService();
