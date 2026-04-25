import { leaderboardService } from '../../shared/services/leaderboard.service';
import { roomService } from '../../shared/services/room.service';
import { userService } from '../../shared/services/user.service';
import type { LeaderboardRow, Room, UserStats } from '../../shared/types';

export interface DashboardSnapshot {
  stats: UserStats;
  leaderboard: LeaderboardRow[];
}

export const homePageService = {
  getDashboardSnapshot: async (): Promise<DashboardSnapshot> => {
    const [stats, leaderboard] = await Promise.all([
      userService.getStats(),
      leaderboardService.getLeaderboard({ page: 1, limit: 3 }),
    ]);

    return {
      stats,
      leaderboard: (leaderboard.data ?? []) as LeaderboardRow[],
    };
  },

  createRoom: async (): Promise<Room> => {
    return roomService.createRoom();
  },

  joinRoom: async (roomId: string): Promise<Room> => {
    return roomService.joinRoom({ room_id: roomId.trim() });
  },
};
