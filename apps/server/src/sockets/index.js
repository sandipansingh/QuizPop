import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../shared/config/env.js';
import { prisma } from '../shared/db/connection.js';
import { registerRoomHandlers } from './socket.room.js';
import {
  registerGameHandlers,
  registerDisconnectHandler,
} from './socket.game.js';

export const initializeSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: env.SOCKET_CORS_ORIGIN.split(',').map((item) => item.trim()),
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token || socket.handshake.headers?.authorization;
      if (!token) throw new Error('Unauthorized socket connection');
      const rawToken = token.startsWith('Bearer ')
        ? token.replace('Bearer ', '').trim()
        : token;
      const payload = jwt.verify(rawToken, env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, username: true, avatar_url: true },
      });
      if (!user) throw new Error('Socket user not found');
      socket.data.user = user;
      return next();
    } catch {
      return next(new Error('Unauthorized socket connection'));
    }
  });

  io.on('connection', (socket) => {
    registerRoomHandlers(io, socket);
    registerGameHandlers(io, socket);
    registerDisconnectHandler(io, socket);
  });

  return io;
};
