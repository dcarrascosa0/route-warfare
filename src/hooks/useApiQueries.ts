import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GatewayAPI } from '@/lib/api';
import { queryKeys, invalidateQueries } from '@/lib/query';
import { useAuth } from '@/contexts/AuthContext';

// Auth queries
export const useMe = () => {
  return useQuery({
    queryKey: queryKeys.me(),
    queryFn: async () => {
      const result = await GatewayAPI.me();
      if (!result.ok) {
        throw result;
      }
      return result.data;
    },
    enabled: true,
  });
};

// User queries
export const useUserProfile = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.userProfile(userId),
    queryFn: async () => {
      const result = await GatewayAPI.userProfile(userId);
      if (!result.ok) {
        throw result;
      }
      return result.data;
    },
    enabled: !!userId,
  });
};

export const useUserStatistics = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.userStatistics(userId),
    queryFn: async () => {
      const result = await GatewayAPI.userStatistics(userId);
      if (!result.ok) {
        throw result;
      }
      return result.data;
    },
    enabled: !!userId,
  });
};

export const useUserStatisticsComparison = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.userStatisticsComparison(userId),
    queryFn: async () => {
      const result = await GatewayAPI.userStatisticsComparison(userId);
      if (!result.ok) {
        throw result;
      }
      return result.data;
    },
    enabled: !!userId,
  });
};

export const useUserStatisticsHistory = (userId: string, period: string = '30d') => {
  return useQuery({
    queryKey: queryKeys.userStatisticsHistory(userId, period),
    queryFn: async () => {
      const result = await GatewayAPI.userStatisticsHistory(userId, period);
      if (!result.ok) {
        throw result;
      }
      return result.data;
    },
    enabled: !!userId,
  });
};

export const useUserAchievements = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.userAchievements(userId),
    queryFn: async () => {
      const result = await GatewayAPI.userAchievements(userId);
      if (!result.ok) {
        throw result;
      }
      return result.data;
    },
    enabled: !!userId,
  });
};

export const useAchievementProgress = (userId: string, achievementId: string) => {
  return useQuery({
    queryKey: queryKeys.achievementProgress(userId, achievementId),
    queryFn: async () => {
      const result = await GatewayAPI.achievementProgress(userId, achievementId);
      if (!result.ok) {
        throw result;
      }
      return result.data;
    },
    enabled: !!userId && !!achievementId,
  });
};

// Route queries
export const useRoutesForUser = (userId: string, limit: number = 20) => {
  return useQuery({
    queryKey: queryKeys.routesForUser(userId, limit),
    queryFn: async () => {
      const result = await GatewayAPI.routesForUser(userId, limit);
      if (!result.ok) {
        throw result;
      }
      return result.data;
    },
    enabled: !!userId,
  });
};

export const useActiveRoute = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.activeRoute(userId),
    queryFn: async () => {
      const result = await GatewayAPI.getActiveRoute(userId);
      if (!result.ok) {
        throw result;
      }
      return result.data;
    },
    enabled: !!userId,
    refetchInterval: 5000, // Refetch every 5 seconds for active routes
  });
};

export const useRoute = (routeId: string, userId: string) => {
  return useQuery({
    queryKey: queryKeys.route(routeId, userId),
    queryFn: async () => {
      const result = await GatewayAPI.getRoute(routeId, userId);
      if (!result.ok) {
        throw result;
      }
      return result.data;
    },
    enabled: !!routeId && !!userId,
  });
};

export const useRouteStatistics = (routeId: string, userId: string) => {
  return useQuery({
    queryKey: queryKeys.routeStatistics(routeId, userId),
    queryFn: async () => {
      const result = await GatewayAPI.getRouteStatistics(routeId, userId);
      if (!result.ok) {
        throw result;
      }
      return result.data;
    },
    enabled: !!routeId && !!userId,
  });
};

// Territory queries
export const useTerritoriesMap = (params?: Record<string, any>) => {
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

// Leaderboard queries
export const useLeaderboard = (
  category: string = 'territory',
  period: string = 'ALL_TIME',
  start: number = 0,
  limit: number = 50
) => {
  return useQuery({
    queryKey: queryKeys.leaderboard(category, period, start, limit),
    queryFn: async () => {
      const result = await GatewayAPI.getLeaderboard(category, period, start, limit);
      if (!result.ok) {
        throw result;
      }
      return result.data;
    },
    refetchInterval: 60000, // Refetch every minute for leaderboards
  });
};

export const useLeaderboardStats = (category: string) => {
  return useQuery({
    queryKey: queryKeys.leaderboardStats(category),
    queryFn: async () => {
      const result = await GatewayAPI.leaderboardStats(category);
      if (!result.ok) {
        throw result;
      }
      return result.data;
    },
  });
};

// Route mutations
export const useStartRoute = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { name?: string; description?: string; start_coordinate?: any }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const result = await GatewayAPI.startRoute(user.id, data);
      if (!result.ok) {
        throw result;
      }
      return result.data;
    },
    onSuccess: () => {
      if (user?.id) {
        invalidateQueries.routes(queryClient, user.id);
      }
    },
  });
};

export const useAddCoordinates = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { 
      routeId: string; 
      coordinates: Array<{
        latitude: number;
        longitude: number;
        altitude?: number | null;
        accuracy?: number | null;
        speed?: number | null;
        bearing?: number | null;
        timestamp: string;
      }>;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const result = await GatewayAPI.addCoordinates(data.routeId, user.id, data.coordinates);
      if (!result.ok) {
        throw result;
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      if (user?.id) {
        // Invalidate active route to get updated coordinates
        queryClient.invalidateQueries({ queryKey: queryKeys.activeRoute(user.id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.route(variables.routeId, user.id) });
      }
    },
  });
};

export const useCompleteRoute = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { 
      routeId: string; 
      completion: { end_coordinate?: any; force_completion?: boolean };
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const result = await GatewayAPI.completeRoute(data.routeId, user.id, data.completion);
      if (!result.ok) {
        throw result;
      }
      return result.data;
    },
    onSuccess: () => {
      if (user?.id) {
        invalidateQueries.routes(queryClient, user.id);
        invalidateQueries.userProfile(queryClient, user.id);
      }
    },
  });
};

export const useDeleteRoute = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (routeId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const result = await GatewayAPI.deleteRoute(routeId, user.id);
      if (!result.ok) {
        throw result;
      }
      return result.data;
    },
    onSuccess: () => {
      if (user?.id) {
        invalidateQueries.routes(queryClient, user.id);
      }
    },
  });
};

// Territory mutations
export const useClaimTerritory = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { 
      route_id: string; 
      boundary_coordinates: Array<{ longitude: number; latitude: number }>; 
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
        invalidateQueries.userProfile(queryClient, user.id);
        invalidateQueries.leaderboard(queryClient);
      }
    },
  });
};