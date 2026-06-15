// Creates two demo accounts so you can immediately test requirement #3
// (two users, different subscriptions, asynchronous updates).
//
//   Run:  npm run seed   (from the server/ folder)
import bcrypt from 'bcryptjs';
import * as db from './db.js';

const DEMO_USERS = [
  { email: 'alice@demo.com', password: 'password' },
  { email: 'bob@demo.com', password: 'password' },
];

for (const u of DEMO_USERS) {
  if (db.getUserByEmail(u.email)) {
    console.log(`• already exists: ${u.email}`);
    continue;
  }
  db.createUser(u.email, bcrypt.hashSync(u.password, 10));
  console.log(`✓ created: ${u.email}  (password: ${u.password})`);
}

console.log('\nSeed complete. Log in as these two users in two browsers/windows to demo live updates.');
process.exit(0);
