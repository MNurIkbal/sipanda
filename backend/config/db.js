const { Pool } = require('pg');
const config = require('./app.config');

const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.name,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ [Database Error] Gagal terhubung ke PostgreSQL:', err.message);
  } else {
    console.log(`✅ [Database] Berhasil terhubung ke database PostgreSQL "${config.database.name}" di ${config.database.host}:${config.database.port}!`);
    release();
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
