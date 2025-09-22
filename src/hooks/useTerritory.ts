/**
 * Territory-specific React Query hooks for data management.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GatewayAPI } from "@/lib/api";
import { queryKeys, invalidateQueries } from '@/lib/query';
import { useAuth } from '@/contexts/AuthContext';
import type { 
  Territory,
  UserTerritoryStatistics,
  GlobalTerritoryStatistics,
  TerritoryLeaderboard,
  TerritoryPreview,
  EnhancedTerritoryEligibilityValidation,
  TerritoryStatisticsResponse,
  TerritoryPreviewResponse,
  GeoPoint
} from '@/lib/api/types';

// Territory Data Hooks
export const useTerritory = (territoryId: string) => {
  return useQuery({
    queryKey: queryKeys.territory(territoryId),
    queryFn: async () => {
      const result = await GatewayAPI.getTerritory(territoryId);
      if (!result.ok) {
        throw result;
      }
      return result.data;
    },
    enabled: !!territoryId,
  });
};

export const useUserTerritories = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.userTerritories(userId),
    queryFn: async () => {
      const result = await GatewayAPI.getUserTerritories(userId);
      if (!result.ok) {
        throw result;
      }
      return result.data;
    },
    enabled: !!userId,
  });
};

export const useTerritoriesMap = (params?: Record<string, string | number | boolean>) => {
  return useQuery({
    queryKey: queryKeys.territoriesMap(params),
    queryFn: async () => {
      const result = await GatewayAPI.territoriesMap(params);
      if (!result.ok) {
        throw result;
      }
      return result.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });
};

export const useContestedTerritories = () => {
  return useQuery({
    queryKey: queryKeys.contestedTerritories(),
    queryFn: async () => {
      const result = await GatewayAPI.getContestedTerritories();
      if (!result.ok) {
        throw result;
      }
      return result.data;
    },
    refetchInterval: 15000, // Refetch every 15 seconds for contested territories
  });
};

export const useNearbyTerritories = (latitude: number, longitude: number, radius: number = 5000) => {
  return useQuery({
    queryKey: queryKeys.nearbyTerritories(latitude, longitude, radius),
    queryFn: async () => {
      const result = await GatewayAPI.getNearbyTerritories(latitude, longitude, radius);
      if (!result.ok) {
        throw result;
      }
      return result.data;
    },
    enabled: !!latitude && !!longitude,
  });
};

// Territory Preview Hooks
export const useTerritoryPreview = ({
  routeId,
  autoRefresh,
  refreshInterval,
}: {
  routeId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['territories', 'preview', routeId],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      const result = await GatewayAPI.getTerritoryPreview(routeId, user.id);
      if (!result.ok) {
        throw result;
      }
      return result.data;
    },
    enabled: !!routeId && !!user?.id,
    refetchInterval: autoRefresh ? refreshInterval ?? 5000 : false,
  });
};

export const useRealTimeTerritoryPreview = (coordinates: GeoPoint[]) => {
  return useQuery({
    queryKey: queryKeys.territoryPreview(coordinates),
    queryFn: async () => {
      const result = await GatewayAPI.getRealTimeTerritoryPreview(coordinates);
      if (!result.ok) {
        throw result;
      }
      return result.data;
    },
    enabled: coordinates.length > 0,
    staleTime: 1000, // Very short stale time for real-time updates
  });
};

export const useTerritoryPreviewWithValidation = (coordinates: GeoPoint[]) => {
  return useQuery({
    queryKey: [...queryKeys.territoryPreview(coordinates), 'validation'],
    queryFn: async () => {
      const result = await GatewayAPI.getTerritoryPreviewWithValidation(coordinates);
      if (!result.ok) {
        throw result;
      }
      return result.data;
    },
    enabled: coordinates.length > 0,
    staleTime: 1000,
  });
};

// Territory Statistics Hooks
export const useUserTerritoryStatistics = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.territoryStatistics(userId),
    queryFn: async () => {
      const result = await GatewayAPI.getUserTerritoryStatistics(userId);
      if (!result.ok) {
        throw result;
      }
      return result.data;
    },
    enabled: !!userId,
  });
};

export const useGlobalTerritoryStatistics = () => {
  return useQuery({
    queryKey: queryKeys.globalTerritoryStatistics(),
    queryFn: async () => {
      const result = await GatewayAPI.getGlobalTerritoryStatistics();
      if (!result.ok) {
        throw result;
      }
      return result.data;
    },
    refetchInterval: 60000, // Refetch every minute for global stats
  });
};

export const useTerritoryStatistics = (userId: string) => {
  return useQuery({
    queryKey: [...queryKeys.territoryStatistics(userId), 'enhanced'],
    queryFn: async () => {
      const result = await GatewayAPI.getTerritoryStatistics(userId);
      if (!result.ok) {
        throw result;
      }
      return result.data;
    },
    enabled: !!userId,
  });
};

// Territory Leaderboard Hooks
export const useTerritoryLeaderboard = (
  metric: string = "total_area",
  limit: number = 50,
  offset: number = 0
) => {
  return useQuery({
    queryKey: queryKeys.territoryLeaderboard(metric, limit, offset),
    queryFn: async () => {
      const result = await GatewayAPI.getTerritoryLeaderboard(metric, limit, offset);
      if (!result.ok) {
        throw result;
      }
      return result.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds for leaderboards
  });
};

export const useLeaderboardByArea = (limit: number = 50, offset: number = 0) => {
  return useTerritoryLeaderboard("total_area", limit, offset);
};

export const useLeaderboardByCount = (limit: number = 50, offset: number = 0) => {
  return useTerritoryLeaderboard("territory_count", limit, offset);
};

export const useLeaderboardByActivity = (limit: number = 50, offset: number = 0) => {
  return useTerritoryLeaderboard("recent_activity", limit, offset);
};

export const useLeaderboardByAverageArea = (limit: number = 50, offset: number = 0) => {
  return useTerritoryLeaderboard("average_area", limit, offset);
};

// Territory Validation Hooks
export const useRouteTerritoryEligibility = (routeId: string) => {
  return useQuery({
    queryKey: queryKeys.territoryValidation(routeId),
    queryFn: async () => {
      const result = await GatewayAPI.validateRouteTerritoryEligibility(routeId);
      if (!result.ok) {
        throw result;
      }
      return result.data;
    },
    enabled: !!routeId,
  });
};

// Territory Mutation Hooks
export const useClaimTerritory = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { 
      route_id: string; 
      boundary_coordinates: GeoPoint[]; 
      name?: string; 
      description?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const result = await GatewayAPI.claimTerritoryFromRoute(user.id, data);
      if (!result.ok) {
        throw result;
      }
      return result.data;
    },
    onSuccess: () => {
      if (user?.id) {
        invalidateQueries.territories(queryClient, user.id);
        invalidateQueries.territoryStatistics(queryClient, user.id);
        invalidateQueries.territoryLeaderboard(queryClient);
        invalidateQueries.userProfile(queryClient, user.id);
        invalidateQueries.leaderboard(queryClient);
      }
    },
  });
};

export const useValidateTerritoryClaimFromRoute = () => {
  return useMutation({
    mutationFn: async (data: {
      routeId: string;
      boundaryCoordinates: GeoPoint[];
    }) => {
      const result = await GatewayAPI.validateTerritoryClaimFromRoute(data.routeId, data.boundaryCoordinates);
      if (!result.ok) {
        throw result;
      }
      return result.data;
    },
  });
};

export const useCalculateTerritoryPreview = () => {
  return useMutation({
    mutationFn: async (coordinates: GeoPoint[]) => {
      const result = await GatewayAPI.calculateTerritoryPreview(coordinates);
      if (!result.ok) {
        throw result;
      }
      return result.data;
    },
  });
};

// Convenience hooks for common territory operations
export const useMyTerritories = () => {
  const { user } = useAuth();
  return useUserTerritories(user?.id || '');
};

export const useMyTerritoryStatistics = () => {
  const { user } = useAuth();
  return useUserTerritoryStatistics(user?.id || '');
};

export const useMyTerritoryStatisticsEnhanced = () => {
  const { user } = useAuth();
  return useTerritoryStatistics(user?.id || '');
};

// Combined hooks for complex operations
export const useTerritoryDashboard = (userId: string) => {
  const territories = useUserTerritories(userId);
  const statistics = useUserTerritoryStatistics(userId);
  const globalStats = useGlobalTerritoryStatistics();
  const leaderboard = useTerritoryLeaderboard();

  return {
    territories,
    statistics,
    globalStats,
    leaderboard,
    isLoading: territories.isLoading || statistics.isLoading || globalStats.isLoading || leaderboard.isLoading,
    error: territories.error || statistics.error || globalStats.error || leaderboard.error,
  };
};

export const useTerritoryLeaderboards = () => {
  const byArea = useLeaderboardByArea();
  const byCount = useLeaderboardByCount();
  const byActivity = useLeaderboardByActivity();
  const byAverageArea = useLeaderboardByAverageArea();

  return {
    byArea,
    byCount,
    byActivity,
    byAverageArea,
    isLoading: byArea.isLoading || byCount.isLoading || byActivity.isLoading || byAverageArea.isLoading,
    error: byArea.error || byCount.error || byActivity.error || byAverageArea.error,
  };
};