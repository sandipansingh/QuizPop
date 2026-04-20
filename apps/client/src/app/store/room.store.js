import { create } from 'zustand';
import { useAuthStore } from './auth.store.js';
import {
  disconnectSocket,
  emitWithAck,
  getSocket,
} from '../../shared/realtime/socket.js';
import { socketEvents } from '../../shared/realtime/socket-events.js';
import { clientEnv } from '../../shared/config/env.js';
import { logger } from '../../shared/utils/logger.js';

const toPlayerList = (players = []) =>
  players.map((player) => ({
    user_id: player.user_id,
    username: player.user?.username || player.username || 'Player',
    score: player.score ?? 0,
    avatar_url: player.user?.avatar_url || player.avatar_url || null,
  }));

const initialState = {
  socket: null,
  isSocketConnected: false,
  hasListenersAttached: false,
  room: null,
  roomId: null,
  players: [],
  leaderboard: [],
  gameStatus: 'waiting',
  questions: [],
  currentQuestion: null,
  currentQuestionIndex: -1,
  totalQuestions: 0,
  playerState: null,
  startedAt: null,
  globalDeadlineAt: null,
  questionTimeLimitMs: clientEnv.roomQuestionTimeLimitMs,
  finalLeaderboard: null,
  lastAnswerResult: null,
  isJoining: false,
  isStarting: false,
  isSubmitting: false,
  isEnding: false,
  errorMessage: null,
};

export const useRoomStore = create((set, get) => ({
  ...initialState,
  attachListeners: (socket) => {
    socket.off(socketEvents.connect);
    socket.off(socketEvents.disconnect);
    socket.off(socketEvents.joinRoom);
    socket.off(socketEvents.leaveRoom);
    socket.off(socketEvents.startGame);
    socket.off(socketEvents.gameStarted);
    socket.off(socketEvents.leaderboardUpdate);
    socket.off(socketEvents.playerState);
    socket.off(socketEvents.endGame);
    socket.off(socketEvents.gameFinished);

    socket.on(socketEvents.connect, () => {
      set({ isSocketConnected: true, errorMessage: null });
    });

    socket.on(socketEvents.disconnect, () => {
      set({ isSocketConnected: false });
    });

    socket.on(socketEvents.joinRoom, (payload) => {
      set((state) => ({
        roomId: payload.room_id || state.roomId,
        players: payload.players
          ? toPlayerList(payload.players)
          : state.players,
      }));
    });

    socket.on(socketEvents.leaveRoom, (payload) => {
      set((state) => ({
        players: state.players.filter(
          (item) => item.user_id !== payload.user_id
        ),
      }));
    });

    const receiveGameStarted = (payload) => {
      const questions = payload.questions || [];
      set({
        gameStatus: payload.status || 'active',
        questions,
        totalQuestions: payload.total_questions || questions.length || 0,
        currentQuestionIndex: questions.length ? 0 : -1,
        currentQuestion: questions[0] || null,
        startedAt: payload.started_at || null,
        globalDeadlineAt: payload.global_deadline_at || null,
        questionTimeLimitMs:
          payload.question_time_limit_ms || clientEnv.roomQuestionTimeLimitMs,
        playerState: null,
        lastAnswerResult: null,
        finalLeaderboard: null,
      });
    };

    socket.on(socketEvents.gameStarted, receiveGameStarted);

    const receiveLeaderboard = (payload) => {
      set({
        roomId: payload.room_id,
        leaderboard: payload.leaderboard || [],
      });
    };

    socket.on(socketEvents.leaderboardUpdate, receiveLeaderboard);

    socket.on(socketEvents.playerState, (payload) => {
      const questions = payload.questions || get().questions;
      const totalQuestions = payload.total_questions || questions.length || 0;

      const serverPlayerIndex = payload.player?.current_question_index ?? -1;
      const localIndex = get().currentQuestionIndex;
      const playerIndex = Math.max(serverPlayerIndex, localIndex);

      const currentQuestion =
        playerIndex >= 0 && playerIndex < questions.length
          ? questions[playerIndex]
          : null;

      set({
        roomId: payload.room_id || get().roomId,
        questions,
        totalQuestions,
        currentQuestionIndex: playerIndex,
        currentQuestion,
        playerState: payload.player || null,
        gameStatus: payload.status || get().gameStatus,
        startedAt: payload.started_at || get().startedAt,
        globalDeadlineAt: payload.global_deadline_at || get().globalDeadlineAt,
        questionTimeLimitMs:
          payload.question_time_limit_ms || get().questionTimeLimitMs,
      });
    });

    const receiveGameFinished = (payload) => {
      set({
        gameStatus: 'ended',
        finalLeaderboard: payload.leaderboard || [],
        leaderboard: payload.leaderboard || [],
      });
    };

    socket.on(socketEvents.gameFinished, receiveGameFinished);

    set({ hasListenersAttached: true });
  },
  connect: async () => {
    const token = useAuthStore.getState().accessToken;

    if (!token) {
      throw new Error('Please login to connect to room socket.');
    }

    const socket = getSocket(token);

    if (!get().hasListenersAttached) {
      get().attachListeners(socket);
    }

    if (!socket.connected) {
      socket.connect();
    }

    set({ socket, errorMessage: null });
    return socket;
  },
  hydrateRoom: (room) => {
    set({
      room,
      roomId: room?.id || null,
      players: room?.players ? toPlayerList(room.players) : [],
      gameStatus: room?.status || 'waiting',
      questions: [],
      currentQuestion: null,
      currentQuestionIndex: -1,
      playerState: null,
      startedAt: null,
      globalDeadlineAt: null,
      errorMessage: null,
    });
  },
  joinRoom: async (roomId) => {
    set({ isJoining: true, errorMessage: null });

    try {
      const socket = await get().connect();
      const room = await emitWithAck(socket, socketEvents.joinRoom, {
        room_id: roomId,
      });
      set({
        room,
        roomId,
        players: room?.players ? toPlayerList(room.players) : get().players,
        gameStatus: room?.status || get().gameStatus,
        questions: [],
        currentQuestion: null,
        currentQuestionIndex: -1,
        playerState: null,
        startedAt: null,
        globalDeadlineAt: null,
        isJoining: false,
      });
      return room;
    } catch (error) {
      set({
        isJoining: false,
        errorMessage: error.message || 'Failed to join room.',
      });
      throw error;
    }
  },
  startGame: async () => {
    const roomId = get().roomId;

    if (!roomId) {
      throw new Error('Room not selected.');
    }

    set({ isStarting: true, errorMessage: null });

    try {
      const socket = await get().connect();
      await emitWithAck(socket, socketEvents.startGame, { room_id: roomId });
      set({ isStarting: false });
    } catch (error) {
      set({
        isStarting: false,
        errorMessage: error.message || 'Failed to start game.',
      });
      throw error;
    }
  },
  submitAnswer: async ({ questionIndex, selectedAnswer, timeTaken }) => {
    const state = get();
    const roomId = state.roomId;

    if (!roomId || !Number.isInteger(questionIndex) || questionIndex < 0) {
      throw new Error('Question payload is incomplete.');
    }

    const nextIndex = questionIndex + 1;
    const isFinished = nextIndex >= state.totalQuestions;
    const nextQuestion = isFinished ? null : state.questions[nextIndex];

    logger.debug('Advancing local question index', { nextIndex });

    set({
      currentQuestionIndex: nextIndex,
      currentQuestion: nextQuestion,
      errorMessage: null,
    });

    try {
      const socket = await get().connect();

      emitWithAck(socket, socketEvents.submitAnswer, {
        room_id: roomId,
        question_index: questionIndex,
        selected_answer: selectedAnswer,
        time_taken: timeTaken,
      })
        .then((result) => {
          set({ lastAnswerResult: result });
          logger.debug('Submit answer acknowledged', result);
        })
        .catch((error) => {
          logger.error('Submit answer failed', error);
        });

      return { success: true };
    } catch (error) {
      set({ errorMessage: error.message || 'Failed to submit answer.' });
      throw error;
    }
  },
  leaveRoom: async () => {
    const roomId = get().roomId;

    if (!roomId) {
      return;
    }

    try {
      const socket = await get().connect();
      await emitWithAck(socket, socketEvents.leaveRoom, { room_id: roomId });
    } catch {
      // Ignore errors when leaving on unmount.
    }

    set({
      room: null,
      roomId: null,
      players: [],
      leaderboard: [],
      gameStatus: 'waiting',
      questions: [],
      currentQuestion: null,
      currentQuestionIndex: -1,
      totalQuestions: 0,
      playerState: null,
      startedAt: null,
      globalDeadlineAt: null,
      finalLeaderboard: null,
      lastAnswerResult: null,
      errorMessage: null,
    });
  },
  endGame: async () => {
    const roomId = get().roomId;

    if (!roomId) {
      throw new Error('Room not selected.');
    }

    set({ isEnding: true, errorMessage: null });

    try {
      const socket = await get().connect();
      await emitWithAck(socket, socketEvents.endGame, { room_id: roomId });
      set({ isEnding: false });
    } catch (error) {
      set({
        isEnding: false,
        errorMessage: error.message || 'Failed to end game.',
      });
      throw error;
    }
  },
  disconnect: () => {
    disconnectSocket();
    set({
      socket: null,
      isSocketConnected: false,
      hasListenersAttached: false,
    });
  },
  clearRoomError: () => {
    set({ errorMessage: null });
  },
}));
