import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';

// Ensure the parent directory exists for file-backed databases.
if (config.dbPath !== ':memory:') {
  fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });
}

const db = new Database(config.dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS subscriptions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    ticker     TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (user_id, ticker),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
`);

const stmts = {
  insertUser: db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)'),
  userByEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
  userById: db.prepare('SELECT id, email, created_at FROM users WHERE id = ?'),
  subsByUser: db.prepare('SELECT ticker FROM subscriptions WHERE user_id = ? ORDER BY created_at ASC, id ASC'),
  addSub: db.prepare('INSERT OR IGNORE INTO subscriptions (user_id, ticker) VALUES (?, ?)'),
  removeSub: db.prepare('DELETE FROM subscriptions WHERE user_id = ? AND ticker = ?'),
};

export function createUser(email, passwordHash) {
  const info = stmts.insertUser.run(email, passwordHash);
  return { id: Number(info.lastInsertRowid), email };
}

export function getUserByEmail(email) {
  return stmts.userByEmail.get(email);
}

export function getUserById(id) {
  return stmts.userById.get(id);
}

export function getSubscriptions(userId) {
  return stmts.subsByUser.all(userId).map((r) => r.ticker);
}

export function addSubscription(userId, ticker) {
  stmts.addSub.run(userId, ticker);
}

export function removeSubscription(userId, ticker) {
  stmts.removeSub.run(userId, ticker);
}

export default db;
