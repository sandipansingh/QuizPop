import { env } from '../shared/config/env.js';
import { roomService } from '../modules/room/room.service.js';
import { roomGameService } from '../shared/services/room-game.service.js';
import { withSocketAck } from './socket-ack.js';
import { ensureRoomState, getRoomState, roomState } from './room-state.js';
import {
  ROOM_QUESTION_TIME_LIMIT_MS,
  resetPlayerForRace,
  clearGameTimeout,
  hasPlayerFinishedRace,
  emitLeaderboardUpdate,
  emitRoomPlayers,
  emitRaceStarted,
  emitPlayerRaceState,
  getRaceDurationMs,
} from './socket.helpers.js';
import { finishRoomGame } from './socket.finish.js';

const scheduleRaceTimeout = (io, roomId, questionCount) => {
  const state = getRoomState(roomId);
  if (!state || state.status !== 'active') return;
  clearGameTimeout(state);
  state.game_timeout_ref = setTimeout(() => {
    void finishRoomGame(io, roomId, 'timer_expired');
  }, getRaceDurationMs(questionCount));
};

export const registerGameHandlers = (io, socket) => {
  socket.on(
    'start_game',
    withSocketAck(async ({ room_id: roomId }) => {
      const room = await roomService.startRoomGame({
        roomId,
        userId: socket.data.user.id,
      });
      const state = ensureRoomState({ roomId, hostId: room.host_id });
      const questions = await roomGameService.fetchRaceQuestions({
        players: room.players,
        limit: env.ROOM_QUESTION_COUNT,
        roomId,
      });
      const now = new Date();
      const deadline = new Date(
        now.getTime() + getRaceDurationMs(questions.length)
      );
      state.status = 'active';
      state.questions = questions;
      state.started_at = now.toISOString();
      state.global_deadline_at = deadline.toISOString();
      for (const [userId, player] of state.players.entries()) {
        state.players.set(userId, resetPlayerForRace(player));
      }
      emitRaceStarted(io, roomId, state);
      emitRoomPlayers(io, roomId, state);
      emitLeaderboardUpdate(io, roomId, state);
      scheduleRaceTimeout(io, roomId, questions.length);
      return room;
    })
  );

  socket.on(
    'submit_answer',
    withSocketAck(
      ({
        room_id: roomId,
        question_index: questionIndex,
        selected_answer: selectedAnswer,
        time_taken: timeTaken,
      }) => {
        const state = getRoomState(roomId);
        const player = state?.players.get(socket.data.user.id);
        const evaluation = roomGameService.evaluateSubmission({
          roomState: state,
          player,
          questionIndex,
          selectedAnswer,
          timeTaken,
          questionTimeLimitMs: ROOM_QUESTION_TIME_LIMIT_MS,
        });
        state.players.set(socket.data.user.id, evaluation.player);
        emitLeaderboardUpdate(io, roomId, state);
        emitRoomPlayers(io, roomId, state);
        emitPlayerRaceState(socket, roomId, evaluation.player, state);
        if (hasPlayerFinishedRace(state))
          void finishRoomGame(io, roomId, 'all_finished');
        return evaluation.result;
      }
    )
  );

  socket.on(
    'end_game',
    withSocketAck(async ({ room_id: roomId }) => {
      const state = getRoomState(roomId);
      if (!state) throw new Error('Room state not found');
      if (state.host_id !== socket.data.user.id)
        throw new Error('Only host can end the game');
      await roomService.endRoomGame({ roomId, userId: socket.data.user.id });
      await finishRoomGame(io, roomId, 'host_ended');
      return null;
    })
  );
};

export const registerDisconnectHandler = (io, socket) => {
  socket.on('disconnect', () => {
    for (const [roomId, state] of Array.from(roomState.entries())) {
      const player = state.players.get(socket.data.user.id);
      if (!player || player.socket_id !== socket.id) continue;
      state.players.set(socket.data.user.id, {
        ...player,
        connected: false,
        socket_id: null,
      });
      io.to(roomId).emit('player_disconnected', {
        room_id: roomId,
        user_id: socket.data.user.id,
      });
      emitRoomPlayers(io, roomId, state);
      emitLeaderboardUpdate(io, roomId, state);
      return;
    }
  });
};
