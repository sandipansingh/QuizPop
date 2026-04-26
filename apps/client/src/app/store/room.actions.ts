import { type Socket } from 'socket.io-client';
import { useAuthStore } from './auth.store';
import {
  disconnectSocket,
  emitWithAck,
  getSocket,
} from '../../shared/realtime/socket';
import { socketEvents } from '../../shared/realtime/socket-events';
import { attachSocketListeners } from './room.listeners';
import { createGameActions } from './room.game-actions';
import type { Room, RoomPlayer } from '../../shared/types';

type SetFn = (partial: Record<string, unknown>) => void;
type GetFn = () => Record<string, unknown>;

const toPlayerList = (players: RoomPlayer[] = []): RoomPlayer[] =>
  players.map((player) => ({
    user_id: player.user_id,
    username: player.user?.username ?? player.username ?? 'Player',
    score: player.score ?? 0,
    avatar_url: player.user?.avatar_url ?? player.avatar_url ?? null,
  }));

export const createRoomActions = (set: SetFn, get: GetFn) => ({
  attachListeners: (socket: Socket) => {
    attachSocketListeners(
      socket,
      set as Parameters<typeof attachSocketListeners>[1],
      get as Parameters<typeof attachSocketListeners>[2]
    );
  },

  connect: async (): Promise<Socket> => {
    const token = useAuthStore.getState().accessToken;
    if (!token) throw new Error('Please login to connect to room socket.');
    const socket = getSocket(token);
    const state = get() as {
      hasListenersAttached: boolean;
      attachListeners: (s: Socket) => void;
    };
    if (!state.hasListenersAttached) state.attachListeners(socket);
    if (!socket.connected) socket.connect();
    set({ socket, errorMessage: null });
    return socket;
  },

  hydrateRoom: (room: Room) => {
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

  joinRoom: async (roomId: string): Promise<Room> => {
    set({ isJoining: true, errorMessage: null });
    try {
      const state = get() as {
        connect: () => Promise<Socket>;
        players: RoomPlayer[];
        gameStatus: string;
      };
      const socket = await state.connect();
      const room = await emitWithAck<Room>(socket, socketEvents.joinRoom, {
        room_id: roomId,
      });
      set({
        room,
        roomId,
        players: room?.players ? toPlayerList(room.players) : state.players,
        gameStatus: room?.status ?? state.gameStatus,
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

  leaveRoom: async (): Promise<void> => {
    const state = get() as {
      roomId: string | null;
      connect: () => Promise<Socket>;
    };
    if (!state.roomId) return;
    try {
      const socket = await state.connect();
      await emitWithAck(socket, socketEvents.leaveRoom, {
        room_id: state.roomId,
      });
    } catch {
      /* ignore */
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

  disconnect: (): void => {
    disconnectSocket();
    set({
      socket: null,
      isSocketConnected: false,
      hasListenersAttached: false,
    });
  },

  clearRoomError: (): void => {
    set({ errorMessage: null });
  },

  ...createGameActions(set, get),
});
