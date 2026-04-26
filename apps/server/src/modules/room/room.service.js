import { scoringService } from '../../shared/services/scoring.service.js';
import { roomModel } from './room.model.js';
import {
  formatRoom,
  getRoomOrThrow,
  ensureHostAccess,
  createRoomWithActivity,
  joinRoomWithActivity,
  leaveRoomWithCleanup,
} from './room.mutations.js';

export const roomService = {
  getRoomById: async (roomId) => {
    const room = await getRoomOrThrow(roomId);
    return formatRoom(room);
  },

  createRoom: createRoomWithActivity,

  joinRoom: joinRoomWithActivity,

  leaveRoom: leaveRoomWithCleanup,

  startRoomGame: async ({ roomId, userId }) => {
    const room = await getRoomOrThrow(roomId);
    ensureHostAccess(room, userId, 'Only host can start the game');
    if (room.status !== roomModel.RoomStatus.waiting) {
      throw new Error('Room already started or finished');
    }
    if (room.players.length < 2) {
      throw new Error('At least 2 players required to start the game');
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
      return { leaderboard: [], updates: [] };
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
