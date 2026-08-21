// booking.test.js
const bookingController = require('../../src/controllers/bookingController');

describe('Booking Conflict Logic', () => {
  it('should not have conflict initially', () => {
    const conflict = bookingController.checkConflict(1, '10:00 AM');
    if (conflict) throw new Error('Expected no conflict');
  });
});
