/**
 * React hooks for gamification features including level progression, XP tracking, and achievements.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gamificationClient } from '@/lib/api';
import type {
  GamificationProfile,
  UserStatistics,
  UserProgress,
  UserComparison,
  UserRanking,
  StreakInformation,
  LevelInfo,
  XPSummary,
  UserComparisonRequest,
  AchievementNotification,
  ChallengeNotification,
  GamificationNotification,
  AchievementRarity,
  StreakStatistics,
  StreakMilestone,
  LevelMilestone,
  ProgressionCurve
} from '@/lib/api/types/gamification';

// Query Keys
export const GAMIFICATION_QUERY_KEYS = {
  profile: (userId: string) => ['gamification', 'profile', userId],
  statistics: (userId: string) => ['gamification', 'statistics', userId],
  progress: (userId: string, period: string) => ['gamification', 'progress', userId, period],
  levelInfo: (userId: string) => ['gamification', 'level', userId],
  xpSummary: (userId: string, days: number) => ['gamification', 'xp-summary', userId, days],
  rankings: (userId: string, categories: string) => ['gamification', 'rankings', userId, categories],
  streakInfo: (userId: string) => ['gamification', 'streak', userId],
  progressSummary: (userId: string) => ['gamification', 'progress-summary', userId],
  notifications: (type: string, limit: number) => ['gamification', 'notifications', type, limit],
  achievementRarity: (achievementId: string) => ['gamification', 'achievement-rarity', achievementId],
  milestones: () => ['gamification', 'milestones'],
  progressionCurve: (maxLevel: number) => ['gamification', 'progression-curve', maxLevel],
  streakLeaderboard: (type: string, limit: number) => ['gamification', 'streak-leaderboard', type, limit],
  streakStatistics: () => ['gamification', 'streak-statistics'],
  streakMilestones: () => ['gamification', 'streak-milestones'],
} as const;

// Core Profile and Statistics Hooks

/**
 * Get user's complete gamification profile
 */
export const useGamificationProfile = (userId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: GAMIFICATION_QUERY_KEYS.profile(userId),
    queryFn: async () => {
      const result = await gamificationClient.getUserGamificationProfile(userId);
      if (result.ok) {
        return result.data;
      }
      throw new Error((result.error as any)?.message || 'Failed to fetch gamification profile');
    },
    enabled: enabled && !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 404 errors (user not found)
      if ((error as any)?.status === 404) return false;
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Get user's comprehensive statistics
 */
export const useUserStatistics = (userId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: GAMIFICATION_QUERY_KEYS.statistics(userId),
    queryFn: async () => {
      const result = await gamificationClient.getUserStatistics(userId);
      if (result.ok) {
        return result.data;
      }
      throw new Error((result.error as any)?.message || 'Failed to fetch user statistics');
    },
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      if ((error as any)?.status === 404) return false;
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Get user's progress history over time
 */
export const useUserProgress = (
  userId: string,
  period: string = 'monthly',
  startDate?: string,
  endDate?: string,
  metrics: string = 'xp,level,achievements,activity',
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: GAMIFICATION_QUERY_KEYS.progress(userId, period),
    queryFn: async () => {
      const result = await gamificationClient.getUserProgressHistory(
        userId,
        period,
        startDate,
        endDate,
        metrics
      );
      if (result.ok) {
        return result.data;
      }
      throw new Error((result.error as any)?.message || 'Failed to fetch user progress');
    },
    enabled: enabled && !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Level and XP Hooks

/**
 * Get user's level information
 */
export const useUserLevelInfo = (userId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: GAMIFICATION_QUERY_KEYS.levelInfo(userId),
    queryFn: async () => {
      const result = await gamificationClient.getUserLevelInfo(userId);
      if (result.ok) {
        return result.data.data;
      }
      throw new Error((result.error as any)?.message || 'Failed to fetch level info');
    },
    enabled: enabled && !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: (failureCount, error) => {
      if ((error as any)?.status === 404) return false;
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Get user's XP summary
 */
export const useUserXPSummary = (userId: string, days: number = 30, enabled: boolean = true) => {
  return useQuery({
    queryKey: GAMIFICATION_QUERY_KEYS.xpSummary(userId, days),
    queryFn: async () => {
      const result = await gamificationClient.getUserXPSummary(userId, days);
      if (result.ok) {
        return result.data.data;
      }
      throw new Error((result.error as any)?.message || 'Failed to fetch XP summary');
    },
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Get level milestones and rewards
 */
export const useLevelMilestones = () => {
  return useQuery({
    queryKey: GAMIFICATION_QUERY_KEYS.milestones(),
    queryFn: async () => {
      const result = await gamificationClient.getLevelMilestones();
      if (result.ok) {
        return result.data.data;
      }
      throw new Error((result.error as any)?.message || 'Failed to fetch level milestones');
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - milestones don't change often
  });
};

/**
 * Get progression curve data
 */
export const useProgressionCurve = (maxLevel: number = 50) => {
  return useQuery({
    queryKey: GAMIFICATION_QUERY_KEYS.progressionCurve(maxLevel),
    queryFn: async () => {
      const result = await gamificationClient.getProgressionCurve(maxLevel);
      if (result.ok) {
        return result.data.data;
      }
      throw new Error((result.error as any)?.message || 'Failed to fetch progression curve');
    },
    staleTime: 60 * 60 * 1000, // 1 hour - curve data is static
  });
};

// Ranking and Comparison Hooks

/**
 * Get user's rankings across categories
 */
export const useUserRankings = (userId: string, categories: string = 'level,xp', enabled: boolean = true) => {
  return useQuery({
    queryKey: GAMIFICATION_QUERY_KEYS.rankings(userId, categories),
    queryFn: async () => {
      const result = await gamificationClient.getUserRankings(userId, categories);
      if (result.ok) {
        return result.data;
      }
      throw new Error((result.error as any)?.message || 'Failed to fetch user rankings');
    },
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Compare two users
 */
export const useUserComparison = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: UserComparisonRequest) => {
      const result = await gamificationClient.compareUsers(request);
      if (result.ok) {
        return result.data;
      }
      throw new Error((result.error as any)?.message || 'Failed to compare users');
    },
    onSuccess: (data, variables) => {
      // Cache the comparison result
      queryClient.setQueryData(
        ['gamification', 'comparison', variables.user1_id, variables.user2_id],
        data
      );
    },
  });
};

// Streak Hooks

/**
 * Get user's streak information
 */
export const useUserStreakInfo = (userId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: GAMIFICATION_QUERY_KEYS.streakInfo(userId),
    queryFn: async () => {
      const result = await gamificationClient.getUserStreakInformation(userId);
      if (result.ok) {
        return result.data;
      }
      throw new Error((result.error as any)?.message || 'Failed to fetch streak information');
    },
    enabled: enabled && !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Get streak leaderboard
 */
export const useStreakLeaderboard = (streakType: string = 'current', limit: number = 50) => {
  return useQuery({
    queryKey: GAMIFICATION_QUERY_KEYS.streakLeaderboard(streakType, limit),
    queryFn: async () => {
      const result = await gamificationClient.getStreakLeaderboard(streakType, limit);
      if (result.ok) {
        return result.data;
      }
      throw new Error((result.error as any)?.message || 'Failed to fetch streak leaderboard');
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Get global streak statistics
 */
export const useStreakStatistics = () => {
  return useQuery({
    queryKey: GAMIFICATION_QUERY_KEYS.streakStatistics(),
    queryFn: async () => {
      const result = await gamificationClient.getGlobalStreakStatistics();
      if (result.ok) {
        return result.data.data;
      }
      throw new Error((result.error as any)?.message || 'Failed to fetch streak statistics');
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Get streak milestones
 */
export const useStreakMilestones = () => {
  return useQuery({
    queryKey: GAMIFICATION_QUERY_KEYS.streakMilestones(),
    queryFn: async () => {
      const result = await gamificationClient.getStreakMilestones();
      if (result.ok) {
        return result.data.data;
      }
      throw new Error((result.error as any)?.message || 'Failed to fetch streak milestones');
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Progress Summary Hook

/**
 * Get comprehensive progress summary
 */
export const useProgressSummary = (userId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: GAMIFICATION_QUERY_KEYS.progressSummary(userId),
    queryFn: async () => {
      const result = await gamificationClient.getComprehensiveProgressSummary(userId);
      if (result.ok) {
        return result.data;
      }
      throw new Error((result.error as any)?.message || 'Failed to fetch progress summary');
    },
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Notification Hooks

/**
 * Get achievement notifications
 */
export const useAchievementNotifications = (limit: number = 10, since?: string) => {
  return useQuery({
    queryKey: GAMIFICATION_QUERY_KEYS.notifications('achievements', limit),
    queryFn: async () => {
      const result = await gamificationClient.getAchievementNotifications(limit, since);
      if (result.ok) {
        return result.data;
      }
      throw new Error((result.error as any)?.message || 'Failed to fetch achievement notifications');
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

/**
 * Get challenge notifications
 */
export const useChallengeNotifications = (limit: number = 10, notificationType?: string) => {
  return useQuery({
    queryKey: GAMIFICATION_QUERY_KEYS.notifications('challenges', limit),
    queryFn: async () => {
      const result = await gamificationClient.getChallengeNotifications(limit, notificationType);
      if (result.ok) {
        return result.data;
      }
      throw new Error((result.error as any)?.message || 'Failed to fetch challenge notifications');
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

/**
 * Get all gamification notifications
 */
export const useGamificationNotifications = (limit: number = 20, since?: string) => {
  return useQuery({
    queryKey: GAMIFICATION_QUERY_KEYS.notifications('all', limit),
    queryFn: async () => {
      const result = await gamificationClient.getAllGamificationNotifications(limit, since);
      if (result.ok) {
        return result.data;
      }
      throw new Error((result.error as any)?.message || 'Failed to fetch gamification notifications');
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

// Achievement Rarity Hooks

/**
 * Get achievement rarity
 */
export const useAchievementRarity = (achievementId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: GAMIFICATION_QUERY_KEYS.achievementRarity(achievementId),
    queryFn: async () => {
      const result = await gamificationClient.getAchievementRarity(achievementId);
      if (result.ok) {
        return result.data.data;
      }
      throw new Error((result.error as any)?.message || 'Failed to fetch achievement rarity');
    },
    enabled: enabled && !!achievementId,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
};

// Utility Hooks

/**
 * Recalculate user statistics
 */
export const useRecalculateStats = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const result = await gamificationClient.recalculateUserStats(userId);
      if (result.ok) {
        return result.data;
      }
      throw new Error((result.error as any)?.message || 'Failed to recalculate statistics');
    },
    onSuccess: (data, userId) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: GAMIFICATION_QUERY_KEYS.profile(userId) });
      queryClient.invalidateQueries({ queryKey: GAMIFICATION_QUERY_KEYS.statistics(userId) });
      queryClient.invalidateQueries({ queryKey: GAMIFICATION_QUERY_KEYS.levelInfo(userId) });
      queryClient.invalidateQueries({ queryKey: GAMIFICATION_QUERY_KEYS.progressSummary(userId) });
    },
  });
};

/**
 * Calculate level requirements
 */
export const useCalculateLevelRequirements = () => {
  return useMutation({
    mutationFn: async (level: number) => {
      const result = await gamificationClient.calculateLevelRequirements(level);
      if (result.ok) {
        return result.data.data;
      }
      throw new Error((result.error as any)?.message || 'Failed to calculate level requirements');
    },
  });
};

/**
 * Get level from XP
 */
export const useGetLevelFromXP = () => {
  return useMutation({
    mutationFn: async (xp: number) => {
      const result = await gamificationClient.getLevelFromXP(xp);
      if (result.ok) {
        return result.data.data;
      }
      throw new Error((result.error as any)?.message || 'Failed to get level from XP');
    },
  });
};