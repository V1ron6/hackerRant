/**
 * Socket service
 * One shared Socket.io connection. Auth is the hr_ticket cookie, so
 * withCredentials is required (cross-origin Vercel <-> Render).
 */

import { io } from 'socket.io-client';
import { API_BASE } from './api.js';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    const origin = new URL(API_BASE, window.location.href).origin;
    socket = io(origin, { withCredentials: true });
  }
  return socket;
};

export const closeSocket = () => {
  if (socket) {
    socket.close();
    socket = null;
  }
};
