export const socketEvents = {
  connect: 'connect',
  disconnect: 'disconnect',
  joinRoom: 'join_room',
  leaveRoom: 'leave_room',
  startGame: 'start_game',
  gameStarted: 'game_started',
  leaderboardUpdate: 'leaderboard_update',
  playerState: 'player_state',
  endGame: 'end_game',
  gameFinished: 'game_finished',
  submitAnswer: 'submit_answer',
} as const;

export type SocketEventKey = keyof typeof socketEvents;
export type SocketEventValue = (typeof socketEvents)[SocketEventKey];
