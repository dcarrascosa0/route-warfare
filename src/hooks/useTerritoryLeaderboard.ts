import { useQuery } from '@tanstack/react-query';
import { GatewayAPI } from '@/lib/api';
import type { 
  TerritoryLeaderboardCategory, 
  TerritoryLeaderboardEntry, 
  TerritoryAchievement,
  LeaderboardStats 
} from '@/lib/api/types';

export const useTerritoryLeaderboard = (
  category: TerritoryLeaderboardCategory = 'territory_area',
  period: string = 'ALL_TIME',
  start: number = 0,
  limit: number = 50
) => {
  return useQuery({
    queryKey: ['territory-leaderboard', category, period, start, limit],
    queryFn: async () => {
      const result = await GatewayAPI.leaderboard.getTerritoryLeaderboard(category, period, start, limit);
      if (result.ok) {
        return result.data;
      }
      throw new Error((result.error as any)?.message || 'Failed to fetch territory leaderboard');
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });
};

export const useTerritoryLeaderboardStats = (category: TerritoryLeaderboardCategory = 'territory_area') => {
  return useQuery({
    queryKey: ['territory-leaderboard-stats', category],
    queryFn: async () => {
      const result = await GatewayAPI.leaderboard.getLeaderboardStats(category);
      if (result.ok) {
        return result.data as LeaderboardStats;
      }
      throw new Error((result.error as any)?.message || 'Failed to fetch territory leaderboard stats');
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

export const useTerritoryLeaderboardWithAchievements = (
  category: TerritoryLeaderboardCategory = 'territory_area',
  period: string = 'ALL_TIME',
  start: number = 0,
  limit: number = 50
) => {
  return useQuery({
    queryKey: ['territory-leaderboard-achievements', category, period, start, limit],
    queryFn: async () => {
      const result = await GatewayAPI.leaderboard.getTerritoryLeaderboardWithAchievements(category, period, start, limit);
      if (result.ok) {
        return result.data;
      }
      throw new Error((result.error as any)?.message || 'Failed to fetch territory leaderboard with achievements');
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });
};

// Helper hook to get all territory leaderboard categories
export const useTerritoryLeaderboardCategories = () => {
  const categories: Array<{
    key: TerritoryLeaderboardCategory;
    name: string;
    description: string;
    icon: string;
  }> = [
    {
      key: 'territory_area',
      name: 'Total Area',
      description: 'Total territory area claimed',
      icon: '🏆'
    },
    {
      key: 'territory_count',
      name: 'Territory Count',
      description: 'Number of territories claimed',
      icon: '📊'
    },
    {
      key: 'territory_recent',
      name: 'Recent Activity',
      description: 'Recent territory claims (7 days)',
      icon: '⚡'
    },
    {
      key: 'territory_avg_size',
      name: 'Average Size',
      description: 'Average territory size',
      icon: '📏'
    },
    {
      key: 'territory_efficiency',
      name: 'Efficiency',
      description: 'Territory area per route',
      icon: '🎯'
    }
  ];

  return { categories };
};