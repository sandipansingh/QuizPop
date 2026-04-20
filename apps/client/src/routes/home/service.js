import { leaderboardService } from '../../shared/services/leaderboard.service.js';
import { roomService } from '../../shared/services/room.service.js';
import { userService } from '../../shared/services/user.service.js';

export const homePageService = {
  getDashboardSnapshot: async () => {
    const [stats, leaderboard] = await Promise.all([
      userService.getStats(),
      leaderboardService.getLeaderboard({ page: 1, limit: 3 }),
    ]);

    return {
      stats,
      leaderboard: leaderboard.data || [],
    };
  },
  createRoom: async () => {
    return roomService.createRoom();
  },
  joinRoom: async (roomId) => {
    return roomService.joinRoom({ room_id: roomId.trim() });
  },
};
