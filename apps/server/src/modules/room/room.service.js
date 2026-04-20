import { ApiError } from '../../shared/utils/api-error.js';
import { env } from '../../shared/config/env.js';
import { scoringService } from '../../shared/services/scoring.service.js';
import { roomModel } from './room.model.js';

const formatRoom = (room) => ({
  id: room.id,
  host_id: room.host_id,
  status: room.status,
  created_at: room.created_at,
  players: room.players.map((player) => ({
    user_id: player.user_id,
    score: player.score,
    joined_at: player.joined_at,
    is_online: player.is_online,
    user: player.user,
  })),
});

const getRoomOrThrow = async (roomId) => {
  const room = await roomModel.findRoomById(roomId);
  if (!room) {
    throw new ApiError(404, 'Room not found');
  }

  return room;
};

const ensureHostAccess = (room, userId, message) => {
  if (room.host_id !== userId) {
    throw new ApiError(403, message);
  }
};

export const roomService = {
  getRoomById: async (roomId) => {
    const room = await getRoomOrThrow(roomId);
    return formatRoom(room);
  },

  createRoom: async (hostId) => {
    const room = await roomModel.createRoom({ hostId });

    await Promise.all([
      roomModel.logActivity({
        userId: hostId,
        type: roomModel.ActivityType.ROOM_CREATED,
        description: `Created room ${room.id}`,
        metadata: { room_id: room.id },
      }),
      roomModel.markUserActive(hostId),
    ]);

    return formatRoom(room);
  },

  joinRoom: async ({ roomId, userId }) => {
    const room = await getRoomOrThrow(roomId);

    if (room.status !== roomModel.RoomStatus.waiting) {
      throw new ApiError(409, 'Cannot join room after game started');
    }

    if (room.players.length >= env.ROOM_MAX_PLAYERS) {
      throw new ApiError(409, 'Room is full');
    }

    await roomModel.joinRoom({ roomId, userId });

    const refreshed = await roomModel.findRoomById(roomId);

    await Promise.all([
      roomModel.logActivity({
        userId,
        type: roomModel.ActivityType.ROOM_JOINED,
        description: `Joined room ${roomId}`,
        metadata: { room_id: roomId },
      }),
      roomModel.markUserActive(userId),
    ]);

    return formatRoom(refreshed);
  },

  leaveRoom: async ({ roomId, userId }) => {
    await getRoomOrThrow(roomId);

    await roomModel.leaveRoom({ roomId, userId });

    const refreshed = await roomModel.findRoomById(roomId);

    if (!refreshed || refreshed.players.length === 0) {
      await roomModel.deleteRoom(roomId);
      return null;
    }

    if (refreshed.host_id === userId) {
      const nextHost = refreshed.players[0];
      await roomModel.updateHost({ roomId, hostId: nextHost.user_id });
    }

    const finalRoom = await roomModel.findRoomById(roomId);
    return formatRoom(finalRoom);
  },

  startRoomGame: async ({ roomId, userId }) => {
    const room = await getRoomOrThrow(roomId);
    ensureHostAccess(room, userId, 'Only host can start the game');

    if (room.status !== roomModel.RoomStatus.waiting) {
      throw new ApiError(409, 'Room already started or finished');
    }

    if (room.players.length < 2) {
      throw new ApiError(409, 'At least 2 players required to start the game');
    }

    await roomModel.setRoomStatus({
      roomId,
      status: roomModel.RoomStatus.active,
    });
    const updated = await roomModel.findRoomById(roomId);
    return formatRoom(updated);
  },

  endRoomGame: async ({ roomId, userId }) => {
    const room = await getRoomOrThrow(roomId);
    ensureHostAccess(room, userId, 'Only host can end the game');

    await roomModel.setRoomStatus({
      roomId,
      status: roomModel.RoomStatus.finished,
    });
    const updated = await roomModel.findRoomById(roomId);
    return formatRoom(updated);
  },

  finalizeRoomGame: async ({
    roomId,
    players,
    questions,
    questionTimeLimitMs,
  }) => {
    if (!Array.isArray(players) || !players.length) {
      return {
        leaderboard: [],
        updates: [],
      };
    }

    await roomModel.setRoomStatus({
      roomId,
      status: roomModel.RoomStatus.finished,
    });

    const scoringResult = await scoringService.updateMultipleUsersRanking({
      roomId,
      players,
      questions,
      questionTimeLimitMs,
    });

    await Promise.all(
      scoringResult.leaderboard.map((item) =>
        roomModel.updateRoomPlayerScore({
          roomId,
          userId: item.user_id,
          score: item.score,
        })
      )
    );

    return scoringResult;
  },
};
