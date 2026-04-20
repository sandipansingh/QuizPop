import { io } from 'socket.io-client';
import { clientEnv } from '../config/env.js';

const SOCKET_URL = clientEnv.socketUrl;

let socketInstance = null;

export const getSocket = (token) => {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket'],
    });
  }

  if (token) {
    socketInstance.auth = { token: `Bearer ${token}` };
  }

  return socketInstance;
};

export const disconnectSocket = () => {
  if (!socketInstance) {
    return;
  }

  socketInstance.disconnect();
  socketInstance.removeAllListeners();
  socketInstance = null;
};

export const emitWithAck = (socket, eventName, payload) =>
  new Promise((resolve, reject) => {
    if (!socket) {
      reject(new Error('Socket connection is unavailable.'));
      return;
    }

    socket.emit(eventName, payload, (ack) => {
      if (ack?.success) {
        resolve(ack.data ?? null);
        return;
      }

      reject(new Error(ack?.message || `Failed to handle event: ${eventName}`));
    });
  });
