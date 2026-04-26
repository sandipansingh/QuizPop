import { ApiError } from '../../shared/utils/api-error.js';
import { env } from '../../shared/config/env.js';
import { roomModel } from './room.model.js';

export const formatRoom = (room) => ({
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

export const getRoomOrThrow = async (roomId) => {
  const room = await roomModel.findRoomById(roomId);
  if (!room) throw new ApiError(404, 'Room not found');
  return room;
};

export const ensureHostAccess = (room, userId, message) => {
  if (room.host_id !== userId) throw new ApiError(403, message);
};

export const createRoomWithActivity = async (hostId) => {
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
};

export const joinRoomWithActivity = async ({ roomId, userId }) => {
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
};

export const leaveRoomWithCleanup = async ({ roomId, userId }) => {
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
};
