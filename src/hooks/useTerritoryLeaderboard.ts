import { useQuery } from '@tanstack/react-query';
import { GatewayAPI } from '@/lib/api';
import type { 
  LeaderboardEntry, 
  LeaderboardStats 
} from '@/lib/api/types/leaderboard';
import type { TerritoryAchievement } from '@/lib/api/types';

export const useLeaderboard = (
  category: string = 'territory_area',
  period: string = 'ALL_TIME',
  start: number = 0,
  limit: number = 50
) => {
  return useQuery({
    queryKey: ['leaderboard', category, period, start, limit],
    queryFn: async () => {
      const result = await GatewayAPI.leaderboard.getLeaderboard(category, period, start, limit);
      if (result.ok) {
        return result.data;
      }
      throw new Error((result.error as any)?.message || 'Failed to fetch leaderboard');
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });
};

export const useLeaderboardStats = (category: string = 'territory_area') => {
  return useQuery({
    queryKey: ['leaderboard-stats', category],
    queryFn: async () => {
      const result = await GatewayAPI.leaderboard.getLeaderboardStats(category);
      if (result.ok) {
        return result.data as LeaderboardStats;
      }
      throw new Error((result.error as any)?.message || 'Failed to fetch leaderboard stats');
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 15 * 60 * 1000, // 15 minutes
  });
};

export const useUserAchievements = (userId: string) => {
  return useQuery({
    queryKey: ['user-achievements', userId],
    queryFn: async () => {
      const result = await GatewayAPI.users.getUserAchievements(userId);
      if (result.ok) {
        return result.data;
      }
      throw new Error((result.error as any)?.message || 'Failed to fetch territory achievements');
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useLeaderboardWithAchievements = (
  category: string = 'territory_area',
  period: string = 'ALL_TIME',
  start: number = 0,
  limit: number = 50
) => {
  return useQuery({
    queryKey: ['leaderboard-achievements', category, period, start, limit],
    queryFn: async () => {
      const result = await GatewayAPI.leaderboard.getTerritoryLeaderboardWithAchievements(category, period, start, limit);
      if (result.ok) {
        return result.data;
      }
      throw new Error((result.error as any)?.message || 'Failed to fetch leaderboard with achievements');
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });
};

// Helper hook to get main leaderboard categories
export const useLeaderboardCategories = () => {
  const categories: Array<{
    key: string;
    name: string;
    description: string;
    icon: string;
  }> = [
    {
      key: 'territory_area',
      name: 'Most Territory',
      description: 'Total territory area claimed',
      icon: '🏆'
    },
    {
      key: 'routes_completed',
      name: 'Most Routes',
      description: 'Number of completed routes',
      icon: '🛣️'
    },
    {
      key: 'win_rate',
      name: 'Win Rate',
      description: 'Route completion percentage',
      icon: '📈'
    }
  ];

  return { categories };
};