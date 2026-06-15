import { io } from 'socket.io-client';
import { api } from './api.js';

/** Create an authenticated Socket.IO connection (JWT passed in the handshake). */
export function createSocket(token) {
  return io(api.base, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 800,
  });
}
