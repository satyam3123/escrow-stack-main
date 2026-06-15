import express from 'express';
import http from 'node:http';
import cors from 'cors';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { authRouter, authMiddleware } from './auth.js';
import * as db from './db.js';
import { engine, SUPPORTED } from './stocks.js';
import { initSocket } from './socket.js';

export function createApp() {
  const app = express();
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());

  app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

  app.use('/api/auth', authRouter);

  // Current user + their persisted subscriptions.
  app.get('/api/me', authMiddleware, (req, res) => {
    res.json({ user: req.user, subscriptions: db.getSubscriptions(req.user.id) });
  });

  // Catalog of supported stocks, with the latest price snapshot.
  app.get('/api/stocks', (_req, res) => {
    res.json(Object.values(engine.snapshot()));
  });

  return app;
}

export function startServer() {
  const app = createApp();
  const server = http.createServer(app);
  const io = initSocket(server);
  engine.start(config.tickMs);

  server.listen(config.port, () => {
    console.log(`\n  Escrow Stack API   →  http://localhost:${config.port}`);
    console.log(`  Live price engine  →  ${SUPPORTED.length} stocks, tick every ${config.tickMs}ms`);
    console.log(`  Stocks             →  ${SUPPORTED.map((s) => s.ticker).join(', ')}\n`);
  });

  let closing = false;
  const shutdown = () => {
    if (closing) return; // ignore repeated Ctrl+C / signals
    closing = true;
    engine.stop();
    io.close(() => process.exit(0)); // disconnects WebSocket clients + closes the HTTP server
    setTimeout(() => process.exit(0), 2000).unref(); // fail-safe if a connection lingers
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return server;
}

// Start only when executed directly (so tests can import without listening).
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer();
}
