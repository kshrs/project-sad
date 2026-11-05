const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
require('dotenv').config();

const logger = require('./src/config/logger');
const { seedDatabase } = require('./src/config/seed');
const { initSocket } = require('./src/socket/sheetSocket');
const { initBackupWorker } = require('./src/workers/backupWorker');
const apiRoutes = require('./src/routes');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sad_db';

// Security & Parsing Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS Setup
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((url) => url.trim())
  : ['http://localhost:5100', 'http://localhost:5173', 'http://localhost:3000'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Idempotency-Key', 'X-Request-Id']
  })
);

// Health Check Endpoints (Root & /api/v1 for standard ALB / Load Balancer probes)
const handleHealth = (req, res) => res.status(200).json({ status: 'UP', timestamp: new Date() });
const handleReady = (req, res) => {
  const isDbReady = mongoose.connection.readyState === 1;
  if (isDbReady) {
    return res.status(200).json({ status: 'READY', db: 'CONNECTED' });
  }
  return res.status(503).json({ status: 'NOT_READY', db: 'DISCONNECTED' });
};

app.get('/health', handleHealth);
app.get('/healthz', handleHealth);
app.get('/ready', handleReady);
app.get('/readyz', handleReady);

app.get('/api/v1/health', handleHealth);
app.get('/api/v1/healthz', handleHealth);
app.get('/api/v1/ready', handleReady);
app.get('/api/v1/readyz', handleReady);

// API Routes
app.use('/api/v1', apiRoutes);

// Socket.io Real-Time Server
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});
initSocket(io);

// Connect to MongoDB & Start Server
mongoose
  .connect(MONGO_URI)
  .then(async () => {
    logger.info(`Connected to MongoDB at ${MONGO_URI}`);
    await seedDatabase();
    initBackupWorker();

    server.listen(PORT, HOST, () => {
      logger.info(`Server listening on http://${HOST}:${PORT}`);
    });
  })
  .catch((err) => {
    logger.error({ err }, 'MongoDB connection failure:');
  });

// Graceful SIGTERM Shutdown
const gracefulShutdown = () => {
  logger.info('Received termination signal. Shutting down gracefully...');
  server.close(async () => {
    await mongoose.connection.close(false);
    logger.info('Closed out remaining connections.');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

module.exports = { app, server };
