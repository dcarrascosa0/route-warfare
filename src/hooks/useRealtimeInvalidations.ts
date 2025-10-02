import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocketManager } from '@/hooks/useWebSocketManager';
import { useAuth } from '@/contexts/AuthContext';
import { queryKeys, invalidateQueries } from '@/lib/query';

/**
 * Centralizes WebSocket → React Query invalidations for app-wide consistency.
 */
export function useRealtimeInvalidations() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const { onMessage } = useWebSocketManager({ autoConnect: true });

  useEffect(() => {
    const subs: Array<() => void | undefined> = [];

    // Routes
    subs.push(onMessage('route_completed', () => {
      if (userId) {
        invalidateQueries.routes(queryClient, userId);
        invalidateQueries.activeRoute(queryClient, userId);
        invalidateQueries.userProfile(queryClient, userId);
      }
    }));

    subs.push(onMessage('route_deleted', () => {
      if (userId) {
        invalidateQueries.routes(queryClient, userId);
        invalidateQueries.activeRoute(queryClient, userId);
      }
    }));

    subs.push(onMessage('route_stats_updated', () => {
      if (userId) {
        invalidateQueries.activeRoute(queryClient, userId);
      }
    }));

    // Territories
    subs.push(onMessage('territory_claimed', () => {
      if (userId) {
        invalidateQueries.territories(queryClient, userId);
        invalidateQueries.territoryStatistics(queryClient, userId);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.territoriesMap() });
    }));

    subs.push(onMessage('territory_map_update', () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.territoriesMap() });
      if (userId) {
        invalidateQueries.territories(queryClient, userId);
      }
    }));

    // Leaderboard
    subs.push(onMessage('leaderboard_updated', () => {
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['total-players'] });
    }));

    return () => { subs.forEach(off => off?.()); };
  }, [onMessage, queryClient, userId]);
}


