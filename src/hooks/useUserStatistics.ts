import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { GatewayAPI } from '@/lib/api';

export interface UserStatistics {
  total_territory_area: number;
  total_zones: number;
  routes_completed: number;
  win_rate: number;
  current_rank: number;
  level: number;
  experience: number;
  total_distance?: number;
  average_route_time?: number;
  longest_route?: number;
  territories_lost?: number;
  territories_defended?: number;
  streak_days?: number;
  best_rank?: number;
}

export interface ComparisonData {
  user_percentile: number;
  average_territory_area: number;
  average_routes: number;
  average_win_rate: number;
  top_10_percent_threshold: number;
}

export interface HistoricalData {
  date: string;
  territory_area: number;
  routes_completed: number;
  rank: number;
  experience: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked_at?: string;
  progress?: number;
  max_progress?: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: 'territory' | 'routes' | 'social' | 'special';
  requirements?: string[];
  reward_xp?: number;
  reward_title?: string;
}

// Hook for fetching user statistics
export function useUserStatistics(userId: string): UseQueryResult<UserStatistics> {
  return useQuery({
    queryKey: ['user', 'statistics', userId],
    queryFn: async () => {
      const result = await GatewayAPI.userStatistics(userId);
      if (!result.ok) {
        throw new Error('Failed to fetch user statistics');
      }
      return result.data as UserStatistics;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook for fetching comparison data
export function useUserStatisticsComparison(userId: string): UseQueryResult<ComparisonData> {
  return useQuery({
    queryKey: ['user', 'statistics', 'comparison', userId],
    queryFn: async () => {
      const result = await GatewayAPI.userStatisticsComparison(userId);
      if (!result.ok) {
        throw new Error('Failed to fetch comparison data');
      }
      return result.data as ComparisonData;
    },
    enabled: !!userId,
    staleTime: 15 * 60 * 1000, // 15 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Hook for fetching historical data
export function useUserStatisticsHistory(userId: string, period: string = '30d'): UseQueryResult<HistoricalData[]> {
  return useQuery({
    queryKey: ['user', 'statistics', 'history', userId, period],
    queryFn: async () => {
      const result = await GatewayAPI.userStatisticsHistory(userId, period);
      if (!result.ok) {
        throw new Error('Failed to fetch historical data');
      }
      return result.data as HistoricalData[];
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 20 * 60 * 1000, // 20 minutes
  });
}

// Hook for fetching user achievements
export function useUserAchievements(userId: string): UseQueryResult<Achievement[]> {
  return useQuery({
    queryKey: ['user', 'achievements', userId],
    queryFn: async () => {
      const result = await GatewayAPI.userAchievements(userId);
      if (!result.ok) {
        throw new Error('Failed to fetch user achievements');
      }
      return result.data as Achievement[];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
  });
}

// Hook for fetching achievement progress
export function useAchievementProgress(userId: string, achievementId: string): UseQueryResult<{ progress: number; max_progress: number }> {
  return useQuery({
    queryKey: ['user', 'achievement', 'progress', userId, achievementId],
    queryFn: async () => {
      const result = await GatewayAPI.achievementProgress(userId, achievementId);
      if (!result.ok) {
        throw new Error('Failed to fetch achievement progress');
      }
      return result.data as { progress: number; max_progress: number };
    },
    enabled: !!userId && !!achievementId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Combined hook for all statistics data
export function useUserStatisticsData(userId: string) {
  const statistics = useUserStatistics(userId);
  const comparison = useUserStatisticsComparison(userId);
  const history = useUserStatisticsHistory(userId);
  const achievements = useUserAchievements(userId);

  return {
    statistics,
    comparison,
    history,
    achievements,
    isLoading: statistics.isLoading || comparison.isLoading || history.isLoading || achievements.isLoading,
    isError: statistics.isError || comparison.isError || history.isError || achievements.isError,
    error: statistics.error || comparison.error || history.error || achievements.error,
  };
}