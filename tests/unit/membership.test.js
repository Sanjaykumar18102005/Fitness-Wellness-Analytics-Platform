const membershipService = require('../../src/services/membershipService');
const authService = require('../../src/services/authService');
const { setUseMemory, memoryDb } = require('../../src/config/db');

describe('Membership Module & Renewal Reminders', () => {
  beforeEach(() => {
    setUseMemory(true);
    memoryDb.reset();
  });

  it('should register a member and generate a JWT token', async () => {
    const res = await authService.register({
      email: 'test.member@example.com',
      password: 'password123',
      name: 'Test Member',
      role: 'member',
    });

    expect(res.user).toHaveProperty('id');
    expect(res.user.email).toBe('test.member@example.com');
    expect(res.token).toBeDefined();
  });

  it('should process renewal reminders for members expiring in 7 days and prevent duplicate sends', async () => {
    // 1. Create a user expiring in 4 days
    const now = new Date();
    const expiry = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000); // 4 days out

    memoryDb.tables.users.push({
      id: 101,
      email: 'expiring.member@example.com',
      name: 'Expiring Member',
      role: 'member',
      membership_expiry: expiry,
      last_renewal_reminder_sent_at: null,
    });

    // 2. Run first reminder job
    const run1 = await membershipService.processRenewalReminders();
    expect(run1.processedCount).toBe(1);
    expect(run1.notifiedMembers[0].email).toBe('expiring.member@example.com');

    // 3. Verify user record has last_renewal_reminder_sent_at set
    const updatedUser = memoryDb.tables.users.find((u) => u.id === 101);
    expect(updatedUser.last_renewal_reminder_sent_at).toBeDefined();

    // 4. Run second reminder job immediately -> duplicate send must be PREVENTED (0 notified)
    const run2 = await membershipService.processRenewalReminders();
    expect(run2.processedCount).toBe(0);
  });
});
