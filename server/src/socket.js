import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from './config.js';
import * as db from './db.js';
import { engine, isSupported } from './stocks.js';

const stockRoom = (ticker) => `stock:${ticker}`;
const userRoom = (userId) => `user:${userId}`;

/**
 * Wire Socket.IO onto the HTTP server.
 *
 * Rooms are the core idea:
 *  - Every socket joins `user:<id>` so all of a user's tabs/devices stay in sync.
 *  - A socket joins `stock:<TICKER>` for each stock the user subscribes to.
 *  - The price engine emits one tick per stock; we forward it only to that
 *    stock's room. A user therefore receives updates for *their* stocks and
 *    nothing else — independent, asynchronous dashboards (requirement #3).
 */
export function initSocket(httpServer) {
  const io = new Server(httpServer, { cors: { origin: config.corsOrigin } });

  // Authenticate every socket from the JWT handed over during the handshake.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = jwt.verify(token, config.jwtSecret);
      socket.data.userId = payload.sub;
      socket.data.email = payload.email;
      next();
    } catch {
      next(new Error('Invalid or expired session'));
    }
  });

  io.on('connection', (socket) => {
    const uid = socket.data.userId;
    socket.join(userRoom(uid));
    socket.join('market'); // ambient market overview, for everyone

    // Restore this user's subscriptions (persisted in SQLite) and send a
    // snapshot so a reconnecting/reloading client is immediately up to date.
    const subs = db.getSubscriptions(uid);
    for (const t of subs) socket.join(stockRoom(t));
    socket.emit('snapshot', { subscriptions: subs, prices: engine.snapshot(subs) });
    socket.emit('market', engine.currentMarket()); // fill the ticker tape instantly

    socket.on('subscribe', ({ ticker } = {}, ack) => {
      ticker = String(ticker || '').toUpperCase();
      if (!isSupported(ticker)) return ack?.({ ok: false, error: 'Unsupported ticker.' });

      db.addSubscription(uid, ticker);
      io.in(userRoom(uid)).socketsJoin(stockRoom(ticker)); // sync every tab of this user
      const list = db.getSubscriptions(uid);
      // Push an incremental snapshot so the new card renders instantly with a
      // full sparkline (history), on every tab — no waiting for the next tick.
      io.to(userRoom(uid)).emit('snapshot', { subscriptions: list, prices: engine.snapshot([ticker]) });
      ack?.({ ok: true, subscriptions: list });
    });

    socket.on('unsubscribe', ({ ticker } = {}, ack) => {
      ticker = String(ticker || '').toUpperCase();
      db.removeSubscription(uid, ticker);
      io.in(userRoom(uid)).socketsLeave(stockRoom(ticker));
      const list = db.getSubscriptions(uid);
      io.to(userRoom(uid)).emit('subscriptions', list);
      ack?.({ ok: true, subscriptions: list });
    });
  });

  // Fan every engine tick out to the matching stock room (per-user watchlists).
  engine.on('tick', (tick) => {
    io.to(stockRoom(tick.ticker)).emit('price', tick);
  });

  // Broadcast the whole market once per cycle to everyone (ticker tape).
  engine.on('cycle', (cycle) => {
    io.to('market').emit('market', cycle);
  });

  return io;
}
