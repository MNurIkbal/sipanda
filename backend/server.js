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

const app = express();

// Middlewares
app.use(cors());
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

// Global Error Handler
app.use(errorHandler);

// Server Listening
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`🚀 [SIPANDU] Backend Modular Architecture running at http://localhost:${PORT}`);
});

module.exports = app;
