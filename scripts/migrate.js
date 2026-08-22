const { query } = require('../src/config/db');

async function migrate() {
  console.log('Running database migrations...');

  const migrationSQL = `
    CREATE TABLE IF NOT EXISTS membership_plans (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) UNIQUE NOT NULL,
      price NUMERIC(10,2) NOT NULL,
      duration_days INTEGER NOT NULL,
      features TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'member',
      membership_plan_id INTEGER REFERENCES membership_plans(id),
      membership_expiry TIMESTAMPTZ,
      last_renewal_reminder_sent_at TIMESTAMPTZ,
      health_flagged BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS trainer_availability (
      id SERIAL PRIMARY KEY,
      trainer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      start_time TIMESTAMPTZ NOT NULL,
      end_time TIMESTAMPTZ NOT NULL,
      is_booked BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT unique_trainer_slot UNIQUE (trainer_id, start_time)
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      member_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      trainer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      availability_id INTEGER UNIQUE REFERENCES trainer_availability(id) ON DELETE CASCADE,
      start_time TIMESTAMPTZ NOT NULL,
      end_time TIMESTAMPTZ NOT NULL,
      status VARCHAR(50) DEFAULT 'confirmed',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS health_assessments (
      id SERIAL PRIMARY KEY,
      member_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      medical_history TEXT NOT NULL,
      fitness_goals TEXT NOT NULL,
      emergency_contact VARCHAR(255) NOT NULL,
      is_completed BOOLEAN DEFAULT TRUE,
      risk_flagged BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS health_metrics (
      id SERIAL PRIMARY KEY,
      member_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      metric_type VARCHAR(50) NOT NULL,
      weight_kg NUMERIC(5,2),
      systolic_bp INTEGER,
      diastolic_bp INTEGER,
      heart_rate INTEGER,
      workout_type VARCHAR(100),
      duration_minutes INTEGER,
      calories_burned INTEGER,
      notes TEXT,
      risk_flagged BOOLEAN DEFAULT FALSE,
      risk_reasons TEXT,
      logged_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS risk_review_queue (
      id SERIAL PRIMARY KEY,
      member_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      source VARCHAR(50) NOT NULL,
      source_id INTEGER,
      risk_reason TEXT NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      consultant_notes TEXT,
      reviewed_by INTEGER REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS notifications_log (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(100) NOT NULL,
      payload JSONB,
      status VARCHAR(50) DEFAULT 'sent',
      sent_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  try {
    await query(migrationSQL);
    console.log('Migrations executed successfully!');
  } catch (err) {
    console.warn('Migration status / note:', err.message);
  }
}

if (require.main === module) {
  migrate().then(() => process.exit(0)).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = migrate;
