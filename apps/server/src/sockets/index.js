import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../shared/config/env.js';
import { prisma } from '../shared/db/connection.js';
import { roomGameService } from '../shared/services/room-game.service.js';
import { roomService } from '../modules/room/room.service.js';
import { withSocketAck } from './socket-ack.js';
import {
  ensureRoomState,
  getRoomState,
  removeRoomState,
  roomState,
  serializeLeaderboard,
  serializePlayers,
} from './room-state.js';

const ROOM_QUESTION_TIME_LIMIT_MS = env.ROOM_QUESTION_TIME_LIMIT_MS;
const RACE_END_BUFFER_MS = env.ROOM_RACE_END_BUFFER_MS;

const getTokenFromHandshake = (socket) => {
  const token =
    socket.handshake.auth?.token || socket.handshake.headers?.authorization;

  if (!token) {
    return null;
  }

  if (token.startsWith('Bearer ')) {
    return token.replace('Bearer ', '').trim();
  }

  return token;
};

const toPublicQuestion = (question) => ({
  id: question.id,
  question_text: question.question_text,
  options: question.options,
  difficulty: question.difficulty,
  category: question.category,
  tags: question.tags,
});

const toPublicQuestions = (questions = []) => questions.map(toPublicQuestion);

const createPlayerState = ({ userId, username, socketId, score = 0 }) => ({
  user_id: userId,
  username,
  socket_id: socketId,
  connected: true,
  is_spectator: false,
  score,
  current_question_index: 0,
  answers: [],
  finished: false,
  finish_time: null,
  correct_streak: 0,
});

const resetPlayerForRace = (player) => ({
  ...player,
  score: 0,
  current_question_index: 0,
  answers: [],
  finished: false,
  finish_time: null,
  correct_streak: 0,
});

const clearGameTimeout = (state) => {
  if (!state?.game_timeout_ref) {
    return;
  }
  clearTimeout(state.game_timeout_ref);
  state.game_timeout_ref = null;
};

const hasPlayerFinishedRace = (state) => {
  const activePlayers = Array.from(state.players.values()).filter(
    (player) => !player.is_spectator
  );

  if (!activePlayers.length) {
    return false;
  }

  return activePlayers.every((player) => player.finished);
};

const emitLeaderboardUpdate = (io, roomId, state) => {
  io.to(roomId).emit('leaderboard_update', {
    room_id: roomId,
    leaderboard: serializeLeaderboard(state),
  });
};

const emitRoomPlayers = (io, roomId, state) => {
  io.to(roomId).emit('join_room', {
    room_id: roomId,
    players: serializePlayers(state),
  });
};

const finishRoomGame = async (io, roomId, reason) => {
  const state = getRoomState(roomId);
  if (!state || state.status === 'ended') {
    return;
  }

  state.status = 'ended';
  clearGameTimeout(state);

  const finalized = await roomService.finalizeRoomGame({
    roomId,
    players: Array.from(state.players.values())
      .filter((player) => !player.is_spectator)
      .map((player) => ({
        user_id: player.user_id,
        finish_time: player.finish_time,
        connected: player.connected,
        answers: player.answers,
      })),
    questions: state.questions,
    questionTimeLimitMs: ROOM_QUESTION_TIME_LIMIT_MS,
  });

  const usernameByUserId = new Map(
    Array.from(state.players.values()).map((player) => [
      player.user_id,
      player.username,
    ])
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

  const payload = {
    room_id: roomId,
    reason,
    leaderboard,
  };

  io.to(roomId).emit('game_finished', payload);

  removeRoomState(roomId);
};

const getRaceDurationMs = (questionCount) =>
  Math.max(
    ROOM_QUESTION_TIME_LIMIT_MS,
    questionCount * ROOM_QUESTION_TIME_LIMIT_MS + RACE_END_BUFFER_MS
  );

const scheduleRaceTimeout = (io, roomId, questionCount) => {
  const state = getRoomState(roomId);
  if (!state || state.status !== 'active') {
    return;
  }

  clearGameTimeout(state);
  state.game_timeout_ref = setTimeout(() => {
    void finishRoomGame(io, roomId, 'timer_expired');
  }, getRaceDurationMs(questionCount));
};

const emitRaceStarted = (io, roomId, state) => {
  io.to(roomId).emit('game_started', {
    room_id: roomId,
    status: state.status,
    total_questions: state.questions.length,
    questions: toPublicQuestions(state.questions),
    started_at: state.started_at,
    global_deadline_at: state.global_deadline_at,
    question_time_limit_ms: ROOM_QUESTION_TIME_LIMIT_MS,
  });
};

const emitPlayerRaceState = (socket, roomId, player, state) => {
  socket.emit('player_state', {
    room_id: roomId,
    player: {
      user_id: player.user_id,
      current_question_index: player.current_question_index,
      score: player.score,
      finished: player.finished,
      finish_time: player.finish_time,
      answers: player.answers,
    },
    status: state.status,
    started_at: state.started_at,
    global_deadline_at: state.global_deadline_at,
    total_questions: state.questions.length,
    question_time_limit_ms: ROOM_QUESTION_TIME_LIMIT_MS,
    questions: toPublicQuestions(state.questions),
  });
};

export const initializeSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: env.SOCKET_CORS_ORIGIN.split(',').map((item) => item.trim()),
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = getTokenFromHandshake(socket);
      if (!token) {
        throw new Error('Unauthorized socket connection');
      }

      const payload = jwt.verify(token, env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, username: true, avatar_url: true },
      });

      if (!user) {
        throw new Error('Socket user not found');
      }

      socket.data.user = user;
      return next();
    } catch {
      return next(new Error('Unauthorized socket connection'));
    }
  });

  io.on('connection', (socket) => {
    socket.on(
      'create_room',
      withSocketAck(async () => {
        const room = await roomService.createRoom(socket.data.user.id);
        const state = ensureRoomState({
          roomId: room.id,
          hostId: room.host_id,
        });

        state.players.set(
          socket.data.user.id,
          createPlayerState({
            userId: socket.data.user.id,
            username: socket.data.user.username,
            socketId: socket.id,
          })
        );

        socket.join(room.id);
        emitRoomPlayers(io, room.id, state);
        emitLeaderboardUpdate(io, room.id, state);

        return room;
      })
    );

    socket.on(
      'join_room',
      withSocketAck(async ({ room_id: roomId }) => {
        const room = await roomService.getRoomById(roomId);
        const state = ensureRoomState({ roomId, hostId: room.host_id });

        if (state.status === 'active') {
          const existing = state.players.get(socket.data.user.id);
          if (!existing || existing.is_spectator) {
            throw new Error('Game already started. Late join is not allowed.');
          }

          state.players.set(socket.data.user.id, {
            ...existing,
            socket_id: socket.id,
            connected: true,
          });
          socket.join(roomId);

          emitRoomPlayers(io, roomId, state);
          emitLeaderboardUpdate(io, roomId, state);
          emitPlayerRaceState(
            socket,
            roomId,
            state.players.get(socket.data.user.id),
            state
          );

          return room;
        }

        const joinedRoom = await roomService.joinRoom({
          roomId,
          userId: socket.data.user.id,
        });
        const existingPlayer = state.players.get(socket.data.user.id);

        state.players.set(
          socket.data.user.id,
          createPlayerState({
            userId: socket.data.user.id,
            username: socket.data.user.username,
            socketId: socket.id,
            score: existingPlayer?.score || 0,
          })
        );

        socket.join(roomId);
        emitRoomPlayers(io, roomId, state);
        emitLeaderboardUpdate(io, roomId, state);

        return joinedRoom;
      })
    );

    socket.on(
      'leave_room',
      withSocketAck(async ({ room_id: roomId }) => {
        const room = await roomService.leaveRoom({
          roomId,
          userId: socket.data.user.id,
        });
        const state = getRoomState(roomId);

        socket.leave(roomId);

        if (state) {
          state.players.delete(socket.data.user.id);

          if (!state.players.size) {
            removeRoomState(roomId);
          } else {
            emitRoomPlayers(io, roomId, state);
            emitLeaderboardUpdate(io, roomId, state);
            if (state.status === 'active' && hasPlayerFinishedRace(state)) {
              void finishRoomGame(io, roomId, 'all_finished');
            }
          }
        }

        io.to(roomId).emit('leave_room', {
          room_id: roomId,
          user_id: socket.data.user.id,
          room,
        });

        return room;
      })
    );

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

          if (hasPlayerFinishedRace(state)) {
            void finishRoomGame(io, roomId, 'all_finished');
          }

          return evaluation.result;
        }
      )
    );

    socket.on(
      'end_game',
      withSocketAck(async ({ room_id: roomId }) => {
        const state = getRoomState(roomId);
        if (!state) {
          throw new Error('Room state not found');
        }

        if (state.host_id !== socket.data.user.id) {
          throw new Error('Only host can end the game');
        }

        await roomService.endRoomGame({ roomId, userId: socket.data.user.id });
        await finishRoomGame(io, roomId, 'host_ended');

        return null;
      })
    );

    socket.on('disconnect', () => {
      for (const [roomId, state] of Array.from(roomState.entries())) {
        const player = state.players.get(socket.data.user.id);
        if (!player || player.socket_id !== socket.id) {
          continue;
        }

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
  });

  return io;
};
