import { io, type Socket } from 'socket.io-client';
import { clientEnv } from '../config/env';

const SOCKET_URL = clientEnv.socketUrl;

let socketInstance: Socket | null = null;

export const getSocket = (token?: string): Socket => {
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

export const disconnectSocket = (): void => {
  if (!socketInstance) {
    return;
  }

  socketInstance.disconnect();
  socketInstance.removeAllListeners();
  socketInstance = null;
};

export const emitWithAck = <T = unknown>(
  socket: Socket,
  eventName: string,
  payload: unknown
): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    if (!socket) {
      reject(new Error('Socket connection is unavailable.'));
      return;
    }

    socket.emit(
      eventName,
      payload,
      (ack: { success?: boolean; data?: T; message?: string } | undefined) => {
        if (ack?.success) {
          resolve((ack.data ?? null) as T);
          return;
        }

        reject(
          new Error(ack?.message ?? `Failed to handle event: ${eventName}`)
        );
      }
    );
  });
