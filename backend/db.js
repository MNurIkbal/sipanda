const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL Connection Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sipandu',
  // fallback individual parameters
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'sipandu',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

let isPgConnected = false;

// Check connection
pool.connect((err, client, release) => {
  if (err) {
    console.warn('⚠️  PostgreSQL belum tersambung langsung. Menggunakan penyimpanan Memory/Mock Data yang sinkron:', err.message);
    isPgConnected = false;
  } else {
    console.log('✅ Berhasil tersambung ke database PostgreSQL!');
    isPgConnected = true;
    release();
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  isPgConnected: () => isPgConnected,
};
