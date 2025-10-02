/**
 * Gamification WebSocket hook for real-time gamification updates
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { WebSocketManager, createWebSocketManager } from '@/lib/websocket/websocket-manager';
import { getGamificationWsUrl, getGlobalGamificationWsUrl } from '@/lib/api/utils/websocket-utils';
import { useAuth, TokenManager } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { GAMIFICATION_QUERY_KEYS } from './useGamification';

export interface GamificationWebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastUpdate: Date | null;
}

export interface GamificationWebSocketCallbacks {
  onXPGained?: (data: any) => void;
  onLevelUp?: (data: any) => void;
  onAchievementUnlocked?: (data: any) => void;
  onChallengeCompleted?: (data: any) => void;
  onStreakUpdated?: (data: any) => void;
  onLeaderboardUpdate?: (data: any) => void;
  onSeasonalUpdate?: (data: any) => void;
}

export function useGamificationWebSocket(callbacks: GamificationWebSocketCallbacks = {}) {
  const { user } = useAuth();
  const token = TokenManager.getAccessToken();
  const queryClient = useQueryClient();
  const [state, setState] = useState<GamificationWebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    lastUpdate: null,
  });

  const wsManagerRef = useRef<WebSocketManager | null>(null);
  const callbacksRef = useRef(callbacks);

  // Update callbacks ref when callbacks change
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  const updateState = useCallback((updates: Partial<GamificationWebSocketState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const invalidateGamificationQueries = useCallback((userId: string) => {
    // Invalidate relevant queries when gamification data changes
    queryClient.invalidateQueries({ queryKey: GAMIFICATION_QUERY_KEYS.profile(userId) });
    queryClient.invalidateQueries({ queryKey: GAMIFICATION_QUERY_KEYS.statistics(userId) });
    queryClient.invalidateQueries({ queryKey: GAMIFICATION_QUERY_KEYS.levelInfo(userId) });
    queryClient.invalidateQueries({ queryKey: GAMIFICATION_QUERY_KEYS.streakInfo(userId) });
    queryClient.invalidateQueries({ queryKey: GAMIFICATION_QUERY_KEYS.progressSummary(userId) });
  }, [queryClient]);

  const connect = useCallback(() => {
    if (!user?.id || !token || wsManagerRef.current) return;

    try {
      updateState({ isConnecting: true, error: null });

      const wsUrl = getGamificationWsUrl(user.id, token);
      const manager = createWebSocketManager({
        url: wsUrl,
        token: token,
        userId: user.id,
      });

      // Set up event listeners
      manager.on('open', () => {
        updateState({ isConnected: true, isConnecting: false });
        
        // Subscribe to gamification events
        manager.subscribeTo([
          'xp_gained',
          'level_up',
          'achievement_unlocked',
          'challenge_completed',
          'streak_updated',
          'leaderboard_update',
          'seasonal_update'
        ]);
      });

      manager.on('close', () => {
        updateState({ isConnected: false, isConnecting: false });
      });

      manager.on('error', (error: any) => {
        updateState({ 
          error: error?.message || 'WebSocket connection error',
          isConnecting: false 
        });
      });

      // Gamification-specific event handlers
      manager.on('message', (message: any) => {
        updateState({ lastUpdate: new Date() });
        
        switch (message.type) {
          case 'xp_gained':
            callbacksRef.current.onXPGained?.(message.data);
            // Invalidate XP-related queries
            queryClient.invalidateQueries({ 
              queryKey: GAMIFICATION_QUERY_KEYS.xpSummary(user.id, 30) 
            });
            break;
            
          case 'level_up':
            callbacksRef.current.onLevelUp?.(message.data);
            // Invalidate level and profile queries
            invalidateGamificationQueries(user.id);
            break;
            
          case 'achievement_unlocked':
            callbacksRef.current.onAchievementUnlocked?.(message.data);
            // Invalidate achievement-related queries
            queryClient.invalidateQueries({ 
              queryKey: ['achievements', 'user', user.id] 
            });
            invalidateGamificationQueries(user.id);
            break;
            
          case 'challenge_completed':
            callbacksRef.current.onChallengeCompleted?.(message.data);
            // Invalidate challenge queries
            queryClient.invalidateQueries({ 
              queryKey: ['challenges', 'user', user.id] 
            });
            break;
            
          case 'streak_updated':
            callbacksRef.current.onStreakUpdated?.(message.data);
            // Invalidate streak queries
            queryClient.invalidateQueries({ 
              queryKey: GAMIFICATION_QUERY_KEYS.streakInfo(user.id) 
            });
            break;
            
          case 'leaderboard_update':
            callbacksRef.current.onLeaderboardUpdate?.(message.data);
            // Invalidate leaderboard queries
            queryClient.invalidateQueries({ 
              queryKey: ['leaderboard'] 
            });
            break;
            
          case 'seasonal_update':
            callbacksRef.current.onSeasonalUpdate?.(message.data);
            // Invalidate seasonal queries
            invalidateGamificationQueries(user.id);
            break;
        }
      });

      wsManagerRef.current = manager;
      manager.connect();

    } catch (error) {
      updateState({ 
        error: error instanceof Error ? error.message : 'Failed to connect',
        isConnecting: false 
      });
    }
  }, [user?.id, token, updateState, queryClient, invalidateGamificationQueries]);

  const disconnect = useCallback(() => {
    if (wsManagerRef.current) {
      wsManagerRef.current.disconnect();
      wsManagerRef.current = null;
    }
    updateState({ isConnected: false, isConnecting: false });
  }, [updateState]);

  // Auto-connect when user and token are available
  useEffect(() => {
    if (user?.id && token && !wsManagerRef.current) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [user?.id, token, connect, disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    manager: wsManagerRef.current,
  };
}

export function useGlobalGamificationWebSocket(
  callbacks: Pick<GamificationWebSocketCallbacks, 'onLeaderboardUpdate' | 'onSeasonalUpdate'> = {}
) {
  const token = TokenManager.getAccessToken();
  const queryClient = useQueryClient();
  const [state, setState] = useState<GamificationWebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    lastUpdate: null,
  });

  const wsManagerRef = useRef<WebSocketManager | null>(null);
  const callbacksRef = useRef(callbacks);

  // Update callbacks ref when callbacks change
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  const updateState = useCallback((updates: Partial<GamificationWebSocketState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const connect = useCallback(() => {
    if (!token || wsManagerRef.current) return;

    try {
      updateState({ isConnecting: true, error: null });

      const wsUrl = getGlobalGamificationWsUrl(token);
      const manager = createWebSocketManager({
        url: wsUrl,
        token: token,
        userId: 'global',
      });

      // Set up event listeners
      manager.on('open', () => {
        updateState({ isConnected: true, isConnecting: false });
        
        // Subscribe to global gamification events
        manager.subscribeTo([
          'global_leaderboard_updates',
          'seasonal_updates',
          'global_achievements'
        ]);
      });

      manager.on('close', () => {
        updateState({ isConnected: false, isConnecting: false });
      });

      manager.on('error', (error: any) => {
        updateState({ 
          error: error?.message || 'WebSocket connection error',
          isConnecting: false 
        });
      });

      // Global gamification event handlers
      manager.on('message', (message: any) => {
        updateState({ lastUpdate: new Date() });
        
        switch (message.type) {
          case 'global_leaderboard_updates':
          case 'leaderboard_update':
            callbacksRef.current.onLeaderboardUpdate?.(message.data);
            // Invalidate leaderboard queries
            queryClient.invalidateQueries({ 
              queryKey: ['leaderboard'] 
            });
            break;
            
          case 'seasonal_updates':
          case 'seasonal_update':
            callbacksRef.current.onSeasonalUpdate?.(message.data);
            // Invalidate seasonal queries
            queryClient.invalidateQueries({ 
              queryKey: ['seasons'] 
            });
            break;
        }
      });

      wsManagerRef.current = manager;
      manager.connect();

    } catch (error) {
      updateState({ 
        error: error instanceof Error ? error.message : 'Failed to connect',
        isConnecting: false 
      });
    }
  }, [token, updateState, queryClient]);

  const disconnect = useCallback(() => {
    if (wsManagerRef.current) {
      wsManagerRef.current.disconnect();
      wsManagerRef.current = null;
    }
    updateState({ isConnected: false, isConnecting: false });
  }, [updateState]);

  // Auto-connect when token is available
  useEffect(() => {
    if (token && !wsManagerRef.current) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [token, connect, disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    manager: wsManagerRef.current,
  };
}