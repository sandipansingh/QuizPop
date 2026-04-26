import { roomService } from '../modules/room/room.service.js';
import { getRoomState, removeRoomState } from './room-state.js';
import {
  ROOM_QUESTION_TIME_LIMIT_MS,
  clearGameTimeout,
} from './socket.helpers.js';

export const finishRoomGame = async (io, roomId, reason) => {
  const state = getRoomState(roomId);
  if (!state || state.status === 'ended') return;
  state.status = 'ended';
  clearGameTimeout(state);

  const finalized = await roomService.finalizeRoomGame({
    roomId,
    players: Array.from(state.players.values())
      .filter((p) => !p.is_spectator)
      .map((p) => ({
        user_id: p.user_id,
        finish_time: p.finish_time,
        connected: p.connected,
        answers: p.answers,
      })),
    questions: state.questions,
    questionTimeLimitMs: ROOM_QUESTION_TIME_LIMIT_MS,
  });

  const usernameByUserId = new Map(
    Array.from(state.players.values()).map((p) => [p.user_id, p.username])
  );
  const leaderboard = finalized.leaderboard.map((entry) => ({
    rank: entry.rank,
    user_id: entry.user_id,
    username: usernameByUserId.get(entry.user_id) || 'Unknown',
    score: entry.score,
    finish_time: entry.finish_time,
    connected: Boolean(state.players.get(entry.user_id)?.connected),
    rating_change: entry.rating_change,
  }));

  io.to(roomId).emit('game_finished', { room_id: roomId, reason, leaderboard });
  removeRoomState(roomId);
};
