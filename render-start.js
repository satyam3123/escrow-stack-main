import express from 'express';
import http from 'node:http';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load config manually from environment
const config = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  dbPath: process.env.DB_PATH || path.join(__dirname, 'data', 'escrow.db'),
  tickMs: Number(process.env.TICK_MS) || 1000,
  corsOrigin: process.env.CORS_ORIGIN || '*',
};

// Import server modules
import { authRouter, authMiddleware } from './server/src/auth.js';
import * as db from './server/src/db.js';
import { engine, SUPPORTED } from './server/src/stocks.js';
import { initSocket } from './server/src/socket.js';

const app = express();
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));
app.use('/api/auth', authRouter);

app.get('/api/me', authMiddleware, (req, res) => {
  res.json({ user: req.user, subscriptions: db.getSubscriptions(req.user.id) });
});

app.get('/api/stocks', (_req, res) => {
  res.json(Object.values(engine.snapshot()));
});

// Serve the built React frontend
const frontendPath = path.join(__dirname, 'web/dist');
app.use(express.static(frontendPath));

// SPA fallback: send index.html for all non-API routes
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

const server = http.createServer(app);
const io = initSocket(server);
engine.start(config.tickMs);

const port = config.port;
server.listen(port, () => {
  console.log(`\n  Escrow Stack API   →  http://localhost:${port}`);
  console.log(`  Live price engine  →  ${SUPPORTED.length} stocks, tick every ${config.tickMs}ms`);
  console.log(`  Stocks             →  ${SUPPORTED.map((s) => s.ticker).join(', ')}\n`);
});

let closing = false;
const shutdown = () => {
  if (closing) return;
  closing = true;
  engine.stop();
  io.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 2000).unref();
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
