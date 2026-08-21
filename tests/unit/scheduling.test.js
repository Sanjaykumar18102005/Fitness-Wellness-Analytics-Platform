const schedulingService = require('../../src/services/schedulingService');
const { setUseMemory, memoryDb } = require('../../src/config/db');

describe('Scheduling Module & Booking Conflict Detection', () => {
  beforeEach(() => {
    setUseMemory(true);
    memoryDb.reset();
  });

  it('should add trainer availability slot', async () => {
    const slot = await schedulingService.addAvailability(3, {
      startTime: '2026-09-01T10:00:00Z',
      endTime: '2026-09-01T11:00:00Z',
    });

    expect(slot).toHaveProperty('id');
    expect(slot.trainer_id).toBe(3);
    expect(slot.is_booked).toBe(false);
  });

  it('should prevent double booking of the same slot concurrently', async () => {
    // Seed availability slot
    const slot = await schedulingService.addAvailability(3, {
      startTime: '2026-09-01T14:00:00Z',
      endTime: '2026-09-01T15:00:00Z',
    });

    const member1Id = 10;
    const member2Id = 11;

    // Simulate concurrent booking requests using Promise.all
    const results = await Promise.allSettled([
      schedulingService.bookSlot(member1Id, slot.id),
      schedulingService.bookSlot(member2Id, slot.id),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // Exactly 1 booking request must succeed
    expect(fulfilled.length).toBe(1);
    expect(fulfilled[0].value.availability_id).toBe(slot.id);

    // Exactly 1 booking request must be rejected with 409 Conflict "Slot no longer available"
    expect(rejected.length).toBe(1);
    expect(rejected[0].reason.message).toContain('Slot no longer available');
    expect(rejected[0].reason.status).toBe(409);
  });
});
