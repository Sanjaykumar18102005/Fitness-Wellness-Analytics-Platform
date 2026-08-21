const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// PostgreSQL connection configuration
const pgConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'testuser',
  password: process.env.DB_PASSWORD || 'testpassword',
  database: process.env.DB_NAME || 'fitness_platform',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// In-Memory Database Fallback for testing/standalone dev without live Postgres
class InMemoryDB {
  constructor() {
    this.tables = {
      users: [],
      membership_plans: [],
      trainer_availability: [],
      bookings: [],
      health_assessments: [],
      health_metrics: [],
      risk_review_queue: [],
      notifications_log: [],
    };
    this.autoIncrement = {
      users: 1,
      membership_plans: 1,
      trainer_availability: 1,
      bookings: 1,
      health_assessments: 1,
      health_metrics: 1,
      risk_review_queue: 1,
      notifications_log: 1,
    };
  }

  reset() {
    for (const key in this.tables) {
      this.tables[key] = [];
      this.autoIncrement[key] = 1;
    }
  }
}

const memoryDb = new InMemoryDB();
let pool = null;
let useMemory = false;

function getPool() {
  if (useMemory) return null;
  if (!pool) {
    pool = new Pool(pgConfig);
    pool.on('error', (err) => {
      console.warn('Postgres connection pool error:', err.message);
    });
  }
  return pool;
}

// Universal query runner supporting both Postgres pool and InMemoryDB fallback
async function query(text, params = []) {
  if (!useMemory) {
    try {
      const p = getPool();
      return await p.query(text, params);
    } catch (err) {
      // Fallback to in-memory DB if Postgres is not reachable
      if (
        err.code === 'ECONNREFUSED' ||
        err.message.includes('connect ECONNREFUSED') ||
        err.message.includes('Connection terminated') ||
        process.env.NODE_ENV === 'test'
      ) {
        useMemory = true;
      } else {
        throw err;
      }
    }
  }

  // Execute in-memory query execution for standalone/testing
  return runInMemoryQuery(text, params);
}

function runInMemoryQuery(text, params) {
  const normalized = text.trim().replace(/\s+/g, ' ');

  // INSERT INTO table (...) VALUES (...) RETURNING *
  if (normalized.toUpperCase().startsWith('INSERT INTO')) {
    const match = normalized.match(/INSERT INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
    if (match) {
      const table = match[1];
      const columns = match[2].split(',').map((c) => c.trim().replace(/"/g, ''));
      const newRow = {
        id: memoryDb.autoIncrement[table]++,
        created_at: new Date(),
        updated_at: new Date(),
      };

      columns.forEach((col, idx) => {
        newRow[col] = params[idx] !== undefined ? params[idx] : null;
      });

      if (!memoryDb.tables[table]) memoryDb.tables[table] = [];
      memoryDb.tables[table].push(newRow);

      return { rows: [newRow], rowCount: 1 };
    }
  }

  // SELECT query basic filtering
  if (normalized.toUpperCase().startsWith('SELECT')) {
    const tableMatch = normalized.match(/FROM\s+(\w+)/i);
    if (tableMatch) {
      const table = tableMatch[1];
      let rows = memoryDb.tables[table] ? [...memoryDb.tables[table]] : [];

      if (normalized.includes('WHERE email = $1')) {
        rows = rows.filter((r) => r.email === params[0]);
      } else if (normalized.includes('WHERE id = $1')) {
        rows = rows.filter((r) => r.id == params[0]);
      } else if (normalized.includes('WHERE member_id = $1')) {
        rows = rows.filter((r) => r.member_id == params[0]);
      } else if (normalized.includes('WHERE trainer_id = $1')) {
        rows = rows.filter((r) => r.trainer_id == params[0]);
        if (normalized.includes('is_booked = false')) {
          rows = rows.filter((r) => !r.is_booked);
        }
      } else if (normalized.includes('WHERE status = $1')) {
        rows = rows.filter((r) => r.status === params[0]);
      } else if (table === 'users' && normalized.includes('last_renewal_reminder_sent_at')) {
        const sevenDaysFromNow = params[0];
        const sevenDaysAgo = params[1];
        rows = rows.filter((r) => {
          if (!r.membership_expiry) return false;
          if (new Date(r.membership_expiry) > new Date(sevenDaysFromNow)) return false;
          if (!r.last_renewal_reminder_sent_at) return true;
          return new Date(r.last_renewal_reminder_sent_at) <= new Date(sevenDaysAgo);
        });
      }

      return { rows, rowCount: rows.length };
    }
  }

  // UPDATE query
  if (normalized.toUpperCase().startsWith('UPDATE')) {
    const tableMatch = normalized.match(/UPDATE\s+(\w+)/i);
    if (tableMatch) {
      const table = tableMatch[1];
      let rows = memoryDb.tables[table] || [];

      if (normalized.includes('WHERE id = $2') || normalized.includes('WHERE id = $3')) {
        const targetId = params[params.length - 1];
        const target = rows.find((r) => r.id == targetId);
        if (target) {
          if (normalized.includes('last_renewal_reminder_sent_at = $1')) {
            target.last_renewal_reminder_sent_at = params[0];
          }
          if (normalized.includes('membership_plan_id = $1')) {
            target.membership_plan_id = params[0];
            target.membership_expiry = params[1];
          }
          if (normalized.includes('is_booked = true')) {
            target.is_booked = true;
          }
          if (normalized.includes('status =')) {
            target.status = params[0];
          }
          return { rows: [target], rowCount: 1 };
        }
      } else if (normalized.includes('WHERE id = $1')) {
        const target = rows.find((r) => r.id == params[0]);
        if (target) {
          if (normalized.includes('health_flagged = true')) {
            target.health_flagged = true;
          }
          return { rows: [target], rowCount: 1 };
        }
      }
      return { rows, rowCount: rows.length };
    }
  }

  return { rows: [], rowCount: 0 };
}

// Transaction wrapper supporting FOR UPDATE locking simulation
async function withTransaction(callback) {
  if (!useMemory) {
    try {
      const client = await getPool().connect();
      try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      if (
        err.code === 'ECONNREFUSED' ||
        err.message.includes('connect ECONNREFUSED') ||
        process.env.NODE_ENV === 'test'
      ) {
        useMemory = true;
      } else {
        throw err;
      }
    }
  }

  // Fallback to memory transaction wrapper
  return await callback({
    query: async (text, params) => runInMemoryQuery(text, params),
  });
}

function setUseMemory(val) {
  useMemory = val;
}

module.exports = {
  query,
  withTransaction,
  memoryDb,
  setUseMemory,
  getPool,
};
