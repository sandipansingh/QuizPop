import { create } from 'zustand';
import { type Socket } from 'socket.io-client';
import { useAuthStore } from './auth.store';
import {
  disconnectSocket,
  emitWithAck,
  getSocket,
} from '../../shared/realtime/socket';
import { socketEvents } from '../../shared/realtime/socket-events';
import { clientEnv } from '../../shared/config/env';
import { logger } from '../../shared/utils/logger';
import type {
  Question,
  Room,
  RoomPlayer,
  LeaderboardEntry,
} from '../../shared/types';

interface PlayerState {
  current_question_index?: number;
  finished?: boolean;
}

interface RoomState {
  socket: Socket | null;
  isSocketConnected: boolean;
  hasListenersAttached: boolean;
  room: Room | null;
  roomId: string | null;
  players: RoomPlayer[];
  leaderboard: LeaderboardEntry[];
  gameStatus: 'waiting' | 'active' | 'ended';
  questions: Question[];
  currentQuestion: Question | null;
  currentQuestionIndex: number;
  totalQuestions: number;
  playerState: PlayerState | null;
  startedAt: string | null;
  globalDeadlineAt: string | null;
  questionTimeLimitMs: number;
  finalLeaderboard: LeaderboardEntry[] | null;
  lastAnswerResult: unknown;
  isJoining: boolean;
  isStarting: boolean;
  isSubmitting: boolean;
  isEnding: boolean;
  errorMessage: string | null;
  attachListeners: (socket: Socket) => void;
  connect: () => Promise<Socket>;
  hydrateRoom: (room: Room) => void;
  joinRoom: (roomId: string) => Promise<Room>;
  startGame: () => Promise<void>;
  submitAnswer: (payload: {
    questionIndex: number;
    selectedAnswer: string;
    timeTaken: number;
  }) => Promise<{ success: boolean }>;
  leaveRoom: () => Promise<void>;
  endGame: () => Promise<void>;
  disconnect: () => void;
  clearRoomError: () => void;
}

const toPlayerList = (players: RoomPlayer[] = []): RoomPlayer[] =>
  players.map((player) => ({
    user_id: player.user_id,
    username: player.user?.username ?? player.username ?? 'Player',
    score: player.score ?? 0,
    avatar_url: player.user?.avatar_url ?? player.avatar_url ?? null,
  }));

const initialState = {
  socket: null,
  isSocketConnected: false,
  hasListenersAttached: false,
  room: null,
  roomId: null,
  players: [] as RoomPlayer[],
  leaderboard: [] as LeaderboardEntry[],
  gameStatus: 'waiting' as const,
  questions: [] as Question[],
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

export const useRoomStore = create<RoomState>((set, get) => ({
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

    socket.on(
      socketEvents.joinRoom,
      (payload: { room_id?: string; players?: RoomPlayer[] }) => {
        set((state) => ({
          roomId: payload.room_id ?? state.roomId,
          players: payload.players
            ? toPlayerList(payload.players)
            : state.players,
        }));
      }
    );

    socket.on(socketEvents.leaveRoom, (payload: { user_id: string }) => {
      set((state) => ({
        players: state.players.filter(
          (item) => item.user_id !== payload.user_id
        ),
      }));
    });

    const receiveGameStarted = (payload: {
      status?: string;
      questions?: Question[];
      total_questions?: number;
      started_at?: string;
      global_deadline_at?: string;
      question_time_limit_ms?: number;
    }) => {
      const questions = payload.questions ?? [];
      set({
        gameStatus: (payload.status ?? 'active') as
          | 'waiting'
          | 'active'
          | 'ended',
        questions,
        totalQuestions: payload.total_questions ?? questions.length ?? 0,
        currentQuestionIndex: questions.length ? 0 : -1,
        currentQuestion: questions[0] ?? null,
        startedAt: payload.started_at ?? null,
        globalDeadlineAt: payload.global_deadline_at ?? null,
        questionTimeLimitMs:
          payload.question_time_limit_ms ?? clientEnv.roomQuestionTimeLimitMs,
        playerState: null,
        lastAnswerResult: null,
        finalLeaderboard: null,
      });
    };

    socket.on(socketEvents.gameStarted, receiveGameStarted);

    const receiveLeaderboard = (payload: {
      room_id: string;
      leaderboard?: LeaderboardEntry[];
    }) => {
      set({
        roomId: payload.room_id,
        leaderboard: payload.leaderboard ?? [],
      });
    };

    socket.on(socketEvents.leaderboardUpdate, receiveLeaderboard);

    socket.on(
      socketEvents.playerState,
      (payload: {
        room_id?: string;
        questions?: Question[];
        total_questions?: number;
        player?: PlayerState;
        status?: string;
        started_at?: string;
        global_deadline_at?: string;
        question_time_limit_ms?: number;
      }) => {
        const questions = payload.questions ?? get().questions;
        const totalQuestions = payload.total_questions ?? questions.length ?? 0;

        const serverPlayerIndex = payload.player?.current_question_index ?? -1;
        const localIndex = get().currentQuestionIndex;
        const playerIndex = Math.max(serverPlayerIndex, localIndex);

        const currentQuestion =
          playerIndex >= 0 && playerIndex < questions.length
            ? questions[playerIndex]
            : null;

        set({
          roomId: payload.room_id ?? get().roomId,
          questions,
          totalQuestions,
          currentQuestionIndex: playerIndex,
          currentQuestion,
          playerState: payload.player ?? null,
          gameStatus: (payload.status ?? get().gameStatus) as
            | 'waiting'
            | 'active'
            | 'ended',
          startedAt: payload.started_at ?? get().startedAt,
          globalDeadlineAt:
            payload.global_deadline_at ?? get().globalDeadlineAt,
          questionTimeLimitMs:
            payload.question_time_limit_ms ?? get().questionTimeLimitMs,
        });
      }
    );

    const receiveGameFinished = (payload: {
      leaderboard?: LeaderboardEntry[];
    }) => {
      set({
        gameStatus: 'ended',
        finalLeaderboard: payload.leaderboard ?? [],
        leaderboard: payload.leaderboard ?? [],
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
      roomId: room?.id ?? null,
      players: room?.players ? toPlayerList(room.players) : [],
      gameStatus: room?.status ?? 'waiting',
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
      const room = await emitWithAck<Room>(socket, socketEvents.joinRoom, {
        room_id: roomId,
      });
      set({
        room,
        roomId,
        players: room?.players ? toPlayerList(room.players) : get().players,
        gameStatus: room?.status ?? get().gameStatus,
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
      const err = error as { message?: string };
      set({
        isJoining: false,
        errorMessage: err.message ?? 'Failed to join room.',
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
      const err = error as { message?: string };
      set({
        isStarting: false,
        errorMessage: err.message ?? 'Failed to start game.',
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
      currentQuestion: nextQuestion ?? null,
      errorMessage: null,
    });

    try {
      const socket = await get().connect();

      void emitWithAck(socket, socketEvents.submitAnswer, {
        room_id: roomId,
        question_index: questionIndex,
        selected_answer: selectedAnswer,
        time_taken: timeTaken,
      })
        .then((result) => {
          set({ lastAnswerResult: result });
          logger.debug('Submit answer acknowledged', result);
        })
        .catch((error: unknown) => {
          logger.error('Submit answer failed', error);
        });

      return { success: true };
    } catch (error) {
      const err = error as { message?: string };
      set({ errorMessage: err.message ?? 'Failed to submit answer.' });
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
      const err = error as { message?: string };
      set({
        isEnding: false,
        errorMessage: err.message ?? 'Failed to end game.',
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
