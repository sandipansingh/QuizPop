import { roomService } from '../modules/room/room.service.js';
import { withSocketAck } from './socket-ack.js';
import {
  ensureRoomState,
  getRoomState,
  removeRoomState,
} from './room-state.js';
import {
  createPlayerState,
  emitLeaderboardUpdate,
  emitRoomPlayers,
  emitPlayerRaceState,
  hasPlayerFinishedRace,
} from './socket.helpers.js';
import { finishRoomGame } from './socket.finish.js';

export const registerRoomHandlers = (io, socket) => {
  socket.on(
    'create_room',
    withSocketAck(async () => {
      const room = await roomService.createRoom(socket.data.user.id);
      const state = ensureRoomState({ roomId: room.id, hostId: room.host_id });
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
        if (!existing || existing.is_spectator)
          throw new Error('Game already started. Late join is not allowed.');
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
};
