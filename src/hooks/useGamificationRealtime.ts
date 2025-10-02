/**
 * Comprehensive gamification hook with real-time updates
 */

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  useGamificationProfile, 
  useUserStatistics, 
  useUserLevelInfo, 
  useUserXPSummary,
  useUserStreakInfo,
  useProgressSummary
} from './useGamification';
import { useGamificationWebSocket } from './useGamificationWebSocket';
import { useUserAchievements } from './useAchievements';

export interface GamificationRealtimeState {
  // Data loading states
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  
  // WebSocket connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  
  // Real-time event tracking
  recentXPGains: Array<{
    amount: number;
    source: string;
    timestamp: Date;
  }>;
  recentAchievements: Array<{
    id: string;
    name: string;
    tier: string;
    timestamp: Date;
  }>;
  recentLevelUps: Array<{
    newLevel: number;
    timestamp: Date;
  }>;
}

export interface GamificationRealtimeData {
  profile: any;
  statistics: any;
  levelInfo: any;
  xpSummary: any;
  streakInfo: any;
  progressSummary: any;
  achievements: any;
}

export interface UseGamificationRealtimeOptions {
  enableWebSocket?: boolean;
  xpSummaryDays?: number;
  maxRecentEvents?: number;
}

export function useGamificationRealtime(
  userId?: string,
  options: UseGamificationRealtimeOptions = {}
) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  const {
    enableWebSocket = true,
    xpSummaryDays = 30,
    maxRecentEvents = 10
  } = options;

  // State for real-time events
  const [state, setState] = useState<GamificationRealtimeState>({
    isLoading: false,
    isError: false,
    error: null,
    isConnected: false,
    isConnecting: false,
    connectionError: null,
    recentXPGains: [],
    recentAchievements: [],
    recentLevelUps: [],
  });

  // Data queries
  const profileQuery = useGamificationProfile(targetUserId!, !!targetUserId);
  const statisticsQuery = useUserStatistics(targetUserId!, !!targetUserId);
  const levelInfoQuery = useUserLevelInfo(targetUserId!, !!targetUserId);
  const xpSummaryQuery = useUserXPSummary(targetUserId!, xpSummaryDays, !!targetUserId);
  const streakInfoQuery = useUserStreakInfo(targetUserId!, !!targetUserId);
  const progressSummaryQuery = useProgressSummary(targetUserId!, !!targetUserId);
  const achievementsQuery = useUserAchievements(targetUserId!);

  // Real-time event handlers
  const handleXPGained = useCallback((data: any) => {
    setState(prev => ({
      ...prev,
      recentXPGains: [
        {
          amount: data.xp_gained || 0,
          source: data.source || 'unknown',
          timestamp: new Date(),
        },
        ...prev.recentXPGains.slice(0, maxRecentEvents - 1)
      ]
    }));
  }, [maxRecentEvents]);

  const handleLevelUp = useCallback((data: any) => {
    setState(prev => ({
      ...prev,
      recentLevelUps: [
        {
          newLevel: data.new_level || 0,
          timestamp: new Date(),
        },
        ...prev.recentLevelUps.slice(0, maxRecentEvents - 1)
      ]
    }));
  }, [maxRecentEvents]);

  const handleAchievementUnlocked = useCallback((data: any) => {
    setState(prev => ({
      ...prev,
      recentAchievements: [
        {
          id: data.achievement_id || '',
          name: data.achievement_name || 'Unknown Achievement',
          tier: data.tier || 'bronze',
          timestamp: new Date(),
        },
        ...prev.recentAchievements.slice(0, maxRecentEvents - 1)
      ]
    }));
  }, [maxRecentEvents]);

  // WebSocket connection
  const websocketState = useGamificationWebSocket(
    enableWebSocket && !!targetUserId ? {
      onXPGained: handleXPGained,
      onLevelUp: handleLevelUp,
      onAchievementUnlocked: handleAchievementUnlocked,
      onStreakUpdated: (data) => {
        // Streak updates are handled by query invalidation in the WebSocket hook
      },
    } : {}
  );

  // Update connection state
  useEffect(() => {
    setState(prev => ({
      ...prev,
      isConnected: websocketState.isConnected,
      isConnecting: websocketState.isConnecting,
      connectionError: websocketState.error,
    }));
  }, [websocketState.isConnected, websocketState.isConnecting, websocketState.error]);

  // Update loading and error states
  useEffect(() => {
    const queries = [
      profileQuery,
      statisticsQuery,
      levelInfoQuery,
      xpSummaryQuery,
      streakInfoQuery,
      progressSummaryQuery,
      achievementsQuery
    ];

    const isLoading = queries.some(q => q.isLoading);
    const isError = queries.some(q => q.isError);
    const errors = queries
      .filter(q => q.error)
      .map(q => (q.error as Error)?.message)
      .filter(Boolean);

    setState(prev => ({
      ...prev,
      isLoading,
      isError,
      error: errors.length > 0 ? errors.join('; ') : null,
    }));
  }, [
    profileQuery.isLoading, profileQuery.isError, profileQuery.error,
    statisticsQuery.isLoading, statisticsQuery.isError, statisticsQuery.error,
    levelInfoQuery.isLoading, levelInfoQuery.isError, levelInfoQuery.error,
    xpSummaryQuery.isLoading, xpSummaryQuery.isError, xpSummaryQuery.error,
    streakInfoQuery.isLoading, streakInfoQuery.isError, streakInfoQuery.error,
    progressSummaryQuery.isLoading, progressSummaryQuery.isError, progressSummaryQuery.error,
    achievementsQuery.isLoading, achievementsQuery.isError, achievementsQuery.error,
  ]);

  // Retry function for failed queries
  const retry = useCallback(() => {
    profileQuery.refetch();
    statisticsQuery.refetch();
    levelInfoQuery.refetch();
    xpSummaryQuery.refetch();
    streakInfoQuery.refetch();
    progressSummaryQuery.refetch();
    achievementsQuery.refetch();
  }, [
    profileQuery.refetch,
    statisticsQuery.refetch,
    levelInfoQuery.refetch,
    xpSummaryQuery.refetch,
    streakInfoQuery.refetch,
    progressSummaryQuery.refetch,
    achievementsQuery.refetch,
  ]);

  // Clear recent events
  const clearRecentEvents = useCallback(() => {
    setState(prev => ({
      ...prev,
      recentXPGains: [],
      recentAchievements: [],
      recentLevelUps: [],
    }));
  }, []);

  // Aggregate data
  const data: GamificationRealtimeData = {
    profile: profileQuery.data,
    statistics: statisticsQuery.data,
    levelInfo: levelInfoQuery.data,
    xpSummary: xpSummaryQuery.data,
    streakInfo: streakInfoQuery.data,
    progressSummary: progressSummaryQuery.data,
    achievements: achievementsQuery.data,
  };

  return {
    // Data
    data,
    
    // State
    ...state,
    
    // Actions
    retry,
    clearRecentEvents,
    
    // WebSocket controls
    connectWebSocket: websocketState.connect,
    disconnectWebSocket: websocketState.disconnect,
    
    // Individual query states for granular loading states
    queries: {
      profile: {
        isLoading: profileQuery.isLoading,
        isError: profileQuery.isError,
        error: profileQuery.error,
      },
      statistics: {
        isLoading: statisticsQuery.isLoading,
        isError: statisticsQuery.isError,
        error: statisticsQuery.error,
      },
      levelInfo: {
        isLoading: levelInfoQuery.isLoading,
        isError: levelInfoQuery.isError,
        error: levelInfoQuery.error,
      },
      xpSummary: {
        isLoading: xpSummaryQuery.isLoading,
        isError: xpSummaryQuery.isError,
        error: xpSummaryQuery.error,
      },
      streakInfo: {
        isLoading: streakInfoQuery.isLoading,
        isError: streakInfoQuery.isError,
        error: streakInfoQuery.error,
      },
      progressSummary: {
        isLoading: progressSummaryQuery.isLoading,
        isError: progressSummaryQuery.isError,
        error: progressSummaryQuery.error,
      },
      achievements: {
        isLoading: achievementsQuery.isLoading,
        isError: achievementsQuery.isError,
        error: achievementsQuery.error,
      },
    },
  };
}

/**
 * Hook for gamification notifications with real-time updates
 */
export function useGamificationNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'xp' | 'level' | 'achievement' | 'streak' | 'challenge';
    title: string;
    message: string;
    timestamp: Date;
    data?: any;
  }>>([]);

  const websocketState = useGamificationWebSocket({
    onXPGained: (data) => {
      setNotifications(prev => [
        {
          id: `xp-${Date.now()}`,
          type: 'xp',
          title: 'XP Gained!',
          message: `+${data.xp_gained} XP from ${data.source}`,
          timestamp: new Date(),
          data,
        },
        ...prev.slice(0, 49) // Keep last 50 notifications
      ]);
    },
    onLevelUp: (data) => {
      setNotifications(prev => [
        {
          id: `level-${Date.now()}`,
          type: 'level',
          title: 'Level Up!',
          message: `Congratulations! You reached level ${data.new_level}`,
          timestamp: new Date(),
          data,
        },
        ...prev.slice(0, 49)
      ]);
    },
    onAchievementUnlocked: (data) => {
      setNotifications(prev => [
        {
          id: `achievement-${Date.now()}`,
          type: 'achievement',
          title: 'Achievement Unlocked!',
          message: `${data.achievement_name} (${data.tier})`,
          timestamp: new Date(),
          data,
        },
        ...prev.slice(0, 49)
      ]);
    },
    onStreakUpdated: (data) => {
      if (data.streak_milestone) {
        setNotifications(prev => [
          {
            id: `streak-${Date.now()}`,
            type: 'streak',
            title: 'Streak Milestone!',
            message: `${data.current_streak} day streak achieved!`,
            timestamp: new Date(),
            data,
          },
          ...prev.slice(0, 49)
        ]);
      }
    },
    onChallengeCompleted: (data) => {
      setNotifications(prev => [
        {
          id: `challenge-${Date.now()}`,
          type: 'challenge',
          title: 'Challenge Complete!',
          message: `${data.challenge_name} completed!`,
          timestamp: new Date(),
          data,
        },
        ...prev.slice(0, 49)
      ]);
    },
  });

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return {
    notifications,
    clearNotifications,
    removeNotification,
    isConnected: websocketState.isConnected,
    connectionError: websocketState.error,
  };
}