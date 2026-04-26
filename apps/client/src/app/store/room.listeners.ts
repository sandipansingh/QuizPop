import { type Socket } from 'socket.io-client';
import { socketEvents } from '../../shared/realtime/socket-events';
import { clientEnv } from '../../shared/config/env';
import type {
  Question,
  RoomPlayer,
  LeaderboardEntry,
} from '../../shared/types';

interface PlayerState {
  current_question_index?: number;
  finished?: boolean;
}
type SetFn = (
  partial:
    | Record<string, unknown>
    | ((state: Record<string, unknown>) => Record<string, unknown>)
) => void;
type GetFn = () => Record<string, unknown>;

const toPlayerList = (players: RoomPlayer[] = []): RoomPlayer[] =>
  players.map((player) => ({
    user_id: player.user_id,
    username: player.user?.username ?? player.username ?? 'Player',
    score: player.score ?? 0,
    avatar_url: player.user?.avatar_url ?? player.avatar_url ?? null,
  }));

const attachRoomListeners = (socket: Socket, set: SetFn) => {
  socket.on(socketEvents.connect, () => {
    set({ isSocketConnected: true, errorMessage: null });
  });
  socket.on(socketEvents.disconnect, () => {
    set({ isSocketConnected: false });
  });
  socket.on(
    socketEvents.joinRoom,
    (payload: { room_id?: string; players?: RoomPlayer[] }) => {
      set((state: Record<string, unknown>) => ({
        roomId: payload.room_id ?? state.roomId,
        players: payload.players
          ? toPlayerList(payload.players)
          : state.players,
      }));
    }
  );
  socket.on(socketEvents.leaveRoom, (payload: { user_id: string }) => {
    set((state: Record<string, unknown>) => ({
      players: (state.players as RoomPlayer[]).filter(
        (item) => item.user_id !== payload.user_id
      ),
    }));
  });
  socket.on(
    socketEvents.leaderboardUpdate,
    (payload: { room_id: string; leaderboard?: LeaderboardEntry[] }) => {
      set({ roomId: payload.room_id, leaderboard: payload.leaderboard ?? [] });
    }
  );
  socket.on(
    socketEvents.gameFinished,
    (payload: { leaderboard?: LeaderboardEntry[] }) => {
      set({
        gameStatus: 'ended',
        finalLeaderboard: payload.leaderboard ?? [],
        leaderboard: payload.leaderboard ?? [],
      });
    }
  );
};

const attachGameListeners = (socket: Socket, set: SetFn, get: GetFn) => {
  socket.on(
    socketEvents.gameStarted,
    (payload: {
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
    }
  );

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
      const state = get() as {
        questions: Question[];
        currentQuestionIndex: number;
        roomId: string | null;
        gameStatus: string;
        startedAt: string | null;
        globalDeadlineAt: string | null;
        questionTimeLimitMs: number;
      };
      const questions = payload.questions ?? state.questions;
      const totalQuestions = payload.total_questions ?? questions.length ?? 0;
      const serverPlayerIndex = payload.player?.current_question_index ?? -1;
      const playerIndex = Math.max(
        serverPlayerIndex,
        state.currentQuestionIndex
      );
      const currentQuestion =
        playerIndex >= 0 && playerIndex < questions.length
          ? questions[playerIndex]
          : null;
      set({
        roomId: payload.room_id ?? state.roomId,
        questions,
        totalQuestions,
        currentQuestionIndex: playerIndex,
        currentQuestion,
        playerState: payload.player ?? null,
        gameStatus: (payload.status ?? state.gameStatus) as
          | 'waiting'
          | 'active'
          | 'ended',
        startedAt: payload.started_at ?? state.startedAt,
        globalDeadlineAt: payload.global_deadline_at ?? state.globalDeadlineAt,
        questionTimeLimitMs:
          payload.question_time_limit_ms ?? state.questionTimeLimitMs,
      });
    }
  );
};

export const attachSocketListeners = (
  socket: Socket,
  set: SetFn,
  get: GetFn
) => {
  [
    socketEvents.connect,
    socketEvents.disconnect,
    socketEvents.joinRoom,
    socketEvents.leaveRoom,
    socketEvents.gameStarted,
    socketEvents.leaderboardUpdate,
    socketEvents.playerState,
    socketEvents.gameFinished,
  ].forEach((event) => socket.off(event));

  attachRoomListeners(socket, set);
  attachGameListeners(socket, set, get);
  set({ hasListenersAttached: true });
};
