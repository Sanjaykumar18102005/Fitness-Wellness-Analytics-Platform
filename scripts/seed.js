const bcrypt = require('bcryptjs');
const { query, memoryDb } = require('../src/config/db');
const migrate = require('./migrate');

async function seed() {
  console.log('Seeding initial data...');
  await migrate();

  const passwordHash = await bcrypt.hash('Password123!', 10);
  const adminHash = await bcrypt.hash('adminpass', 10);
  const trainerHash = await bcrypt.hash('trainerpass', 10);
  const consultantHash = await bcrypt.hash('consultantpass', 10);

  // Clear in-memory DB if active
  memoryDb.reset();

  // 1. Seed Membership Plans
  const plans = [
    { name: 'Basic Tier', price: 29.99, duration_days: 30, features: 'Access to gym floor and standard locker rooms' },
    { name: 'Premium Tier', price: 59.99, duration_days: 30, features: 'Gym access + group classes + 1 trainer session' },
    { name: 'VIP Tier', price: 99.99, duration_days: 30, features: 'All access + unlimited trainer sessions + consultant review' },
  ];

  for (const p of plans) {
    try {
      await query(
        `INSERT INTO membership_plans (name, price, duration_days, features) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (name) DO NOTHING`,
        [p.name, p.price, p.duration_days, p.features]
      );
    } catch (e) {
      // Ignore conflict
    }
  }

  // 2. Seed Users
  const users = [
    { email: 'admin@fitclub.com', password_hash: adminHash, name: 'System Admin', role: 'admin', membership_plan_id: null, expiry: null },
    { email: 'consultant.sarah@fitclub.com', password_hash: consultantHash, name: 'Sarah Jenkins', role: 'consultant', membership_plan_id: null, expiry: null },
    { email: 'trainer.alex@fitclub.com', password_hash: trainerHash, name: 'Alex Rivera', role: 'trainer', membership_plan_id: null, expiry: null },
    { email: 'john.member@fitclub.com', password_hash: passwordHash, name: 'John Doe', role: 'member', membership_plan_id: 2, expiry: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) },
    { email: 'jane.member@fitclub.com', password_hash: passwordHash, name: 'Jane Smith', role: 'member', membership_plan_id: 1, expiry: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000) },
  ];

  for (const u of users) {
    try {
      await query(
        `INSERT INTO users (email, password_hash, name, role, membership_plan_id, membership_expiry) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         ON CONFLICT (email) DO NOTHING`,
        [u.email, u.password_hash, u.name, u.role, u.membership_plan_id, u.expiry]
      );
    } catch (e) {
      // Ignore conflict
    }
  }

  // 3. Seed Trainer Availability (Trainer ID 3 = Alex Rivera)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const slot1End = new Date(tomorrow.getTime() + 60 * 60 * 1000);

  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  dayAfter.setHours(14, 0, 0, 0);

  const slot2End = new Date(dayAfter.getTime() + 60 * 60 * 1000);

  try {
    await query(
      `INSERT INTO trainer_availability (trainer_id, start_time, end_time, is_booked) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (trainer_id, start_time) DO NOTHING`,
      [3, tomorrow, slot1End, false]
    );

    await query(
      `INSERT INTO trainer_availability (trainer_id, start_time, end_time, is_booked) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (trainer_id, start_time) DO NOTHING`,
      [3, dayAfter, slot2End, false]
    );
  } catch (e) {
    // Ignore conflict
  }

  console.log('Seed data successfully inserted!');
}

if (require.main === module) {
  seed().then(() => process.exit(0)).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = seed;
