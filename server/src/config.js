import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const config = {
  port: Number(process.env.PORT) || 4000,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  dbPath: process.env.DB_PATH || path.join(__dirname, '..', 'data', 'escrow.db'),
  tickMs: Number(process.env.TICK_MS) || 1000,
  corsOrigin: process.env.CORS_ORIGIN || '*',
};

if (config.jwtSecret === 'dev-secret-change-me') {
  console.warn('[config] Using the default JWT secret. Set JWT_SECRET in server/.env before deploying.');
}
