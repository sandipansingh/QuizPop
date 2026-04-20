export const roomState = new Map();

export const initRoomState = ({ roomId, hostId }) => {
  const state = {
    room_id: roomId,
    host_id: hostId,
    status: 'waiting',
    started_at: null,
    global_deadline_at: null,
    players: new Map(),
    questions: [],
    game_timeout_ref: null,
  };

  roomState.set(roomId, state);
  return state;
};

export const getRoomState = (roomId) => roomState.get(roomId);

export const ensureRoomState = ({ roomId, hostId }) =>
  roomState.get(roomId) || initRoomState({ roomId, hostId });

export const removeRoomState = (roomId) => {
  const state = roomState.get(roomId);
  if (state?.game_timeout_ref) {
    clearTimeout(state.game_timeout_ref);
  }

  roomState.delete(roomId);
};

const getFinishSortValue = (player) => {
  if (!player.finish_time) {
    return Number.MAX_SAFE_INTEGER;
  }

  return new Date(player.finish_time).getTime();
};

export const serializeLeaderboard = (state) =>
  Array.from(state.players.values())
    .filter((player) => !player.is_spectator)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return getFinishSortValue(a) - getFinishSortValue(b);
    })
    .map((player, index) => ({
      rank: index + 1,
      user_id: player.user_id,
      username: player.username,
      score: player.score,
      current_question_index: player.current_question_index,
      finished: Boolean(player.finished),
      finish_time: player.finish_time || null,
      connected: Boolean(player.connected),
    }));

export const serializePlayers = (state) =>
  Array.from(state.players.values())
    .filter((player) => !player.is_spectator)
    .map((player) => ({
      user_id: player.user_id,
      username: player.username,
      score: player.score,
      current_question_index: player.current_question_index,
      finished: Boolean(player.finished),
      connected: Boolean(player.connected),
      is_spectator: Boolean(player.is_spectator),
      finish_time: player.finish_time || null,
    }));
