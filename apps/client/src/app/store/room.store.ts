import { create } from 'zustand';
import { type Socket } from 'socket.io-client';
import { clientEnv } from '../../shared/config/env';
import { createRoomActions } from './room.actions';
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
  ...createRoomActions(
    set as unknown as (partial: Record<string, unknown>) => void,
    get as unknown as () => Record<string, unknown>
  ),
}));
