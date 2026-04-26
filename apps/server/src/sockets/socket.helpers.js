import { env } from '../shared/config/env.js';
import { serializeLeaderboard, serializePlayers } from './room-state.js';

export const ROOM_QUESTION_TIME_LIMIT_MS = env.ROOM_QUESTION_TIME_LIMIT_MS;
export const RACE_END_BUFFER_MS = env.ROOM_RACE_END_BUFFER_MS;

export const getTokenFromHandshake = (socket) => {
  const token =
    socket.handshake.auth?.token || socket.handshake.headers?.authorization;
  if (!token) return null;
  if (token.startsWith('Bearer ')) return token.replace('Bearer ', '').trim();
  return token;
};

export const toPublicQuestion = (question) => ({
  id: question.id,
  question_text: question.question_text,
  options: question.options,
  difficulty: question.difficulty,
  category: question.category,
  tags: question.tags,
});

export const toPublicQuestions = (questions = []) =>
  questions.map(toPublicQuestion);

export const createPlayerState = ({
  userId,
  username,
  socketId,
  score = 0,
}) => ({
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

export const resetPlayerForRace = (player) => ({
  ...player,
  score: 0,
  current_question_index: 0,
  answers: [],
  finished: false,
  finish_time: null,
  correct_streak: 0,
});

export const clearGameTimeout = (state) => {
  if (!state?.game_timeout_ref) return;
  clearTimeout(state.game_timeout_ref);
  state.game_timeout_ref = null;
};

export const hasPlayerFinishedRace = (state) => {
  const activePlayers = Array.from(state.players.values()).filter(
    (p) => !p.is_spectator
  );
  if (!activePlayers.length) return false;
  return activePlayers.every((p) => p.finished);
};

export const emitLeaderboardUpdate = (io, roomId, state) => {
  io.to(roomId).emit('leaderboard_update', {
    room_id: roomId,
    leaderboard: serializeLeaderboard(state),
  });
};

export const emitRoomPlayers = (io, roomId, state) => {
  io.to(roomId).emit('join_room', {
    room_id: roomId,
    players: serializePlayers(state),
  });
};

export const getRaceDurationMs = (questionCount) =>
  Math.max(
    ROOM_QUESTION_TIME_LIMIT_MS,
    questionCount * ROOM_QUESTION_TIME_LIMIT_MS + RACE_END_BUFFER_MS
  );

export const emitRaceStarted = (io, roomId, state) => {
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

export const emitPlayerRaceState = (socket, roomId, player, state) => {
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
