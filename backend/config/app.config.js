require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sipandu_db',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    name: process.env.DB_NAME || 'sipandu_db',
  },
  jwtSecret: process.env.JWT_SECRET || 'sipandu_super_secret_jwt_key_2027',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  maxFileSize: 25 * 1024 * 1024 // 25 MB
};
