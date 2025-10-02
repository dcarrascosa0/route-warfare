import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { GatewayAPI } from "@/lib/api";
import { queryKeys, invalidateQueries } from '@/lib/query';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";

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
export const useTerritoriesMap = (params?: { [key: string]: string | number | boolean }) => {
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

// Real-time territory preview for coordinates
export const useRealTimeTerritoryPreview = (coordinates: Array<{ longitude: number; latitude: number }>) => {
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

// Territory statistics hooks
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
    queryKey: queryKeys.territoryStatistics(userId),
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



// Territory validation hooks
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
    mutationFn: (routeId: string) => {
      if (!user?.id) throw new Error("User not authenticated");
      return GatewayAPI.completeRoute(routeId, user.id, {});
    },
    onSuccess: (_, routeId) => {
      toast.success("Route completed!");
      if (user?.id) {
        invalidateQueries.routes(queryClient, user.id);
        // Also invalidate user profile data as it contains stats
        invalidateQueries.userProfile(queryClient, user.id);
      }
      // Invalidate territories as completing a route might claim new ones
      invalidateQueries.territories(queryClient, user?.id);
    },
    onError: (error) => {
      toast.error(`Failed to complete route: ${error.message}`);
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

export const useValidateTerritoryClaimFromRoute = () => {
  return useMutation({
    mutationFn: async (data: {
      routeId: string;
      boundaryCoordinates: Array<{ longitude: number; latitude: number }>;
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
    mutationFn: async (coordinates: Array<{ longitude: number; latitude: number }>) => {
      const result = await GatewayAPI.calculateTerritoryPreview(coordinates);
      if (!result.ok) {
        throw result;
      }
      return result.data;
    },
  });
};