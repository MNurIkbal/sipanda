const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config/app.config');
const errorHandler = require('./middlewares/error.middleware');

// Routes Import
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const documentRoutes = require('./routes/document.routes');
const auditRoutes = require('./routes/audit.routes');
const monitoringRoutes = require('./routes/monitoring.routes');
const masterRoutes = require('./routes/master.routes');

const app = express();

// Middlewares
const allowedOrigins = [
  config.frontendUrl,
  'http://localhost:3000',
  'http://192.168.19.212:3000',
  'http://127.0.0.1:3000'
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Izinkan request tanpa origin (seperti curl, mobile apps, Postman) atau origin yang terdaftar
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Tetap izinkan atau fallback agar development tidak terblokir
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Disposition']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, config.uploadDir)));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    appName: 'SIPANDU API',
    timestamp: new Date().toISOString(),
  });
});

// Modular Routes Registration
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/audit-trail', auditRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/master', masterRoutes);

// Global Error Handler
app.use(errorHandler);

// Server Listening
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`🚀 [SIPANDU] Backend Modular Architecture running at http://localhost:${PORT}`);
});

module.exports = app;
