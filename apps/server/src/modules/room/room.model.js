import { ActivityType, RoomStatus } from '@prisma/client';
import { prisma } from '../../shared/db/connection.js';

const ROOM_WITH_PLAYERS_INCLUDE = {
  players: {
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatar_url: true,
          rank: true,
          rating_points: true,
        },
      },
    },
  },
};

export const roomModel = {
  createRoom: async ({ hostId }) =>
    prisma.room.create({
      data: {
        host_id: hostId,
        status: RoomStatus.waiting,
        players: {
          create: {
            user_id: hostId,
            score: 0,
            is_online: true,
          },
        },
      },
      include: ROOM_WITH_PLAYERS_INCLUDE,
    }),

  findRoomById: (roomId) =>
    prisma.room.findUnique({
      where: { id: roomId },
      include: ROOM_WITH_PLAYERS_INCLUDE,
    }),

  findRoomPlayer: ({ roomId, userId }) =>
    prisma.roomPlayer.findUnique({
      where: {
        room_id_user_id: {
          room_id: roomId,
          user_id: userId,
        },
      },
    }),

  updateRoomPlayerScore: ({ roomId, userId, score }) =>
    prisma.roomPlayer.updateMany({
      where: {
        room_id: roomId,
        user_id: userId,
      },
      data: {
        score,
      },
    }),

  joinRoom: ({ roomId, userId }) =>
    prisma.roomPlayer.upsert({
      where: {
        room_id_user_id: {
          room_id: roomId,
          user_id: userId,
        },
      },
      create: {
        room_id: roomId,
        user_id: userId,
        score: 0,
        is_online: true,
      },
      update: {
        is_online: true,
      },
    }),

  leaveRoom: ({ roomId, userId }) =>
    prisma.roomPlayer.deleteMany({
      where: {
        room_id: roomId,
        user_id: userId,
      },
    }),

  setRoomStatus: ({ roomId, status }) =>
    prisma.room.update({
      where: { id: roomId },
      data: { status },
    }),

  updateHost: ({ roomId, hostId }) =>
    prisma.room.update({
      where: { id: roomId },
      data: { host_id: hostId },
    }),

  deleteRoom: (roomId) =>
    prisma.room.delete({
      where: { id: roomId },
    }),

  logActivity: ({ userId, type, description, metadata }) =>
    prisma.activityLog.create({
      data: {
        user_id: userId,
        type,
        description,
        metadata,
      },
    }),

  markUserActive: (userId) =>
    prisma.user.update({
      where: { id: userId },
      data: { last_active_at: new Date() },
    }),

  ActivityType,
  RoomStatus,
};
