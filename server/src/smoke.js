// Automated proof of the hardest requirement (#3): two users who subscribe to
// DIFFERENT stocks each receive only their own live updates, asynchronously.
//
//   Run:  npm run smoke   (from the server/ folder)
//
// It boots the real server on a throwaway port + temp database, registers two
// users over HTTP, connects two authenticated WebSocket clients, and asserts
// strict isolation of the price streams.

process.env.DB_PATH = './data/smoke-test.db';
process.env.PORT = process.env.SMOKE_PORT || '4555';
process.env.JWT_SECRET = 'smoke-secret';
process.env.TICK_MS = '200'; // speed the test up

import fs from 'node:fs';
import { io as ioClient } from 'socket.io-client';

// Start from a clean database every run.
for (const suffix of ['', '-wal', '-shm']) {
  try { fs.unlinkSync(process.env.DB_PATH + suffix); } catch { /* ignore */ }
}

const { startServer } = await import('./index.js');
const server = startServer();
const BASE = `http://localhost:${process.env.PORT}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pass = (m) => console.log(`  ✓ ${m}`);
const fail = (m) => { console.error(`  ✗ ${m}`); process.exitCode = 1; };

async function register(email) {
  const res = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: 'password' }),
  });
  if (!res.ok) throw new Error(`register(${email}) -> HTTP ${res.status}`);
  return (await res.json()).token;
}

function connect(token) {
  return new Promise((resolve, reject) => {
    const s = ioClient(BASE, { auth: { token }, transports: ['websocket'] });
    s.once('connect', () => resolve(s));
    s.once('connect_error', reject);
  });
}

const emitAck = (socket, event, payload) =>
  new Promise((resolve) => socket.emit(event, payload, resolve));

try {
  console.log('\nReal-time multi-user isolation test\n');

  const stamp = Date.now();
  const tokenA = await register(`alice_${stamp}@test.com`);
  const tokenB = await register(`bob_${stamp}@test.com`);
  pass('registered two users (email + password)');

  const a = await connect(tokenA);
  const b = await connect(tokenB);
  pass('both WebSocket clients authenticated & connected');

  const seenByA = new Set();
  const seenByB = new Set();
  a.on('price', (p) => seenByA.add(p.ticker));
  b.on('price', (p) => seenByB.add(p.ticker));

  await emitAck(a, 'subscribe', { ticker: 'GOOG' });
  await emitAck(b, 'subscribe', { ticker: 'TSLA' });
  pass('A subscribed to GOOG, B subscribed to TSLA');

  await sleep(1500); // collect several ticks

  (seenByA.has('GOOG') && seenByA.size === 1)
    ? pass('A received GOOG ticks only')
    : fail(`A should see only GOOG, saw: [${[...seenByA]}]`);

  (seenByB.has('TSLA') && seenByB.size === 1)
    ? pass('B received TSLA ticks only')
    : fail(`B should see only TSLA, saw: [${[...seenByB]}]`);

  !seenByA.has('TSLA') ? pass("A never received B's stock (TSLA)") : fail('A leaked TSLA');
  !seenByB.has('GOOG') ? pass("B never received A's stock (GOOG)") : fail('B leaked GOOG');

  // Unsubscribing must stop the stream.
  seenByA.clear();
  await emitAck(a, 'unsubscribe', { ticker: 'GOOG' });
  await sleep(800);
  seenByA.size === 0
    ? pass('A stopped receiving ticks after unsubscribe')
    : fail(`A still received ticks after unsubscribe: [${[...seenByA]}]`);

  a.close();
  b.close();
} catch (err) {
  fail(err.message);
} finally {
  await sleep(100);
  engineStopAndClose();
}

function engineStopAndClose() {
  server.close(() => {
    for (const suffix of ['', '-wal', '-shm']) {
      try { fs.unlinkSync(process.env.DB_PATH + suffix); } catch { /* ignore */ }
    }
    console.log(process.exitCode ? '\nSMOKE TEST FAILED\n' : '\nALL CHECKS PASSED ✓\n');
    process.exit(process.exitCode || 0);
  });
}
