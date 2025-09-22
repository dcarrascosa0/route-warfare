import { useMutation, useQueryClient } from '@tanstack/react-query';
import { GatewayAPI } from '@/lib/api';
import { queryKeys, invalidateQueries } from '@/lib/query';
import { useAuth } from '@/contexts/AuthContext';
import { useOfflineSync } from './useOfflineSync';
import { toast } from 'sonner';

// Offline-aware route mutations
export const useOfflineAwareStartRoute = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isOnline, addOfflineOperation } = useOfflineSync();

  return useMutation({
    mutationFn: async (data: { name?: string; description?: string; start_coordinate?: any }) => {
      if (!user?.id) throw new Error('User not authenticated');

      if (!isOnline) {
        // Queue for offline sync
        addOfflineOperation({
          type: 'START_ROUTE',
          data,
          userId: user.id,
        });
        
        // Return optimistic data
        return {
          id: `offline-${Date.now()}`,
          name: data.name || 'New Route',
          description: data.description,
          start_coordinate: data.start_coordinate,
          status: 'active',
          user_id: user.id,
          coordinates: [],
          start_time: new Date().toISOString(),
          distance: 0,
          is_completed: false,
          is_closed: false,
          offline: true,
        };
      }
      
      const result = await GatewayAPI.startRoute(user.id, data);
      if (!result.ok) {
        throw result;
      }
      return result.data;
    },
    onSuccess: (data) => {
      if (user?.id) {
        queryClient.setQueryData(queryKeys.activeRoute(user.id), data);
        invalidateQueries.routes(queryClient, user.id);
      }
      
      if (isOnline) {
        toast.success('Route started successfully!');
      } else {
        toast.info('Route queued - will sync when online');
      }
    },
    onError: (error) => {
      toast.error('Failed to start route. Please try again.');
    },
  });
};

export const useOfflineAwareAddCoordinates = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isOnline, addOfflineOperation } = useOfflineSync();

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

      if (!isOnline) {
        // Queue for offline sync
        addOfflineOperation({
          type: 'ADD_COORDINATES',
          data,
          userId: user.id,
        });
        
        // Update local cache optimistically
        const currentRoute = queryClient.getQueryData(queryKeys.activeRoute(user.id));
        if (currentRoute && typeof currentRoute === 'object') {
          const route = currentRoute as any;
          const updatedRoute = {
            ...route,
            coordinates: [...(route.coordinates || []), ...data.coordinates],
            distance: route.distance + calculateDistance(data.coordinates),
            offline_pending: true,
          };
          
          queryClient.setQueryData(queryKeys.activeRoute(user.id), updatedRoute);
        }
        
        return { success: true, offline: true };
      }
      
      const result = await GatewayAPI.addCoordinates(data.routeId, user.id, data.coordinates);
      if (!result.ok) {
        throw result;
      }
      return result.data;
    },
    onSuccess: (data, variables) => {
      if (user?.id && isOnline) {
        // Update with real data from server
        queryClient.invalidateQueries({ queryKey: queryKeys.activeRoute(user.id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.route(variables.routeId, user.id) });
      }
    },
    onError: (error) => {
      if (isOnline) {
        toast.error('Failed to update route coordinates');
      }
    },
  });
};

export const useOfflineAwareCompleteRoute = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isOnline, addOfflineOperation } = useOfflineSync();
  const { smartInvalidateAfterRouteComplete } = useDataInvalidationStrategies();

  return useMutation({
    mutationFn: async (data: { 
      routeId: string; 
      completion: { end_coordinate?: any; force_completion?: boolean };
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      if (!isOnline) {
        // Queue for offline sync
        addOfflineOperation({
          type: 'COMPLETE_ROUTE',
          data,
          userId: user.id,
        });
        
        // Update local cache optimistically
        const currentRoute = queryClient.getQueryData(queryKeys.activeRoute(user.id));
        if (currentRoute && typeof currentRoute === 'object') {
          const route = currentRoute as any;
          const completedRoute = {
            ...route,
            status: 'completed',
            is_completed: true,
            end_time: new Date().toISOString(),
            end_coordinate: data.completion.end_coordinate,
            offline_pending: true,
          };
          
          queryClient.setQueryData(queryKeys.route(data.routeId, user.id), completedRoute);
        }
        
        // Clear active route
        queryClient.setQueryData(queryKeys.activeRoute(user.id), null);
        
        return { success: true, offline: true };
      }
      
      const result = await GatewayAPI.completeRoute(data.routeId, user.id, data.completion);
      if (!result.ok) {
        throw result;
      }
      return result.data;
    },
    onSuccess: () => {
      smartInvalidateAfterRouteComplete();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to complete route. Your route is saved offline.");
    },
  });
};

export const useOfflineAwareClaimTerritory = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isOnline, addOfflineOperation } = useOfflineSync();
  const { smartInvalidateAfterTerritoryChange } = useDataInvalidationStrategies();

  return useMutation({
    mutationFn: async (data: { 
      route_id: string; 
      boundary_coordinates: Array<{ longitude: number; latitude: number }>; 
      name?: string; 
      description?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      if (!isOnline) {
        // Queue for offline sync
        addOfflineOperation({
          type: 'CLAIM_TERRITORY',
          data,
          userId: user.id,
        });
        
        // Create optimistic territory for local cache
        const optimisticTerritory = {
          id: `offline-${Date.now()}`,
          owner_id: user.id,
          owner_username: user.username,
          name: data.name || 'New Territory',
          description: data.description,
          boundary: {
            type: 'Polygon',
            coordinates: [data.boundary_coordinates.map(coord => [coord.longitude, coord.latitude])],
          },
          area: calculatePolygonArea(data.boundary_coordinates),
          status: 'claimed',
          claimed_at: new Date().toISOString(),
          route_id: data.route_id,
          offline_pending: true,
        };

        // Update local cache
        const currentTerritories = queryClient.getQueryData(queryKeys.userTerritories(user.id));
        if (Array.isArray(currentTerritories)) {
          queryClient.setQueryData(
            queryKeys.userTerritories(user.id), 
            [...currentTerritories, optimisticTerritory]
          );
        }
        
        return { success: true, offline: true, territory: optimisticTerritory };
      }
      
      const result = await GatewayAPI.claimTerritoryFromRoute(user.id, data);
      if (!result.ok) {
        throw result;
      }
      return result.data;
    },
    onSuccess: () => {
      smartInvalidateAfterTerritoryChange();
      toast.success("Territory claimed successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to claim territory. Please try again later.");
    },
    onSettled: () => {
      // Invalidate relevant queries regardless of outcome
      invalidateQueries.territories(queryClient, user.id);
      invalidateQueries.userProfile(queryClient, user.id);
      invalidateQueries.leaderboard(queryClient);
    },
  });
};

// Data invalidation strategies for real-time consistency
export const useDataInvalidationStrategies = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const invalidateUserData = () => {
    if (user?.id) {
      invalidateQueries.userProfile(queryClient, user.id);
    }
  };

  const invalidateRouteData = () => {
    if (user?.id) {
      invalidateQueries.routes(queryClient, user.id);
    }
  };

  const invalidateTerritoryData = () => {
    if (user?.id) {
      invalidateQueries.territories(queryClient, user.id);
    }
  };

  const invalidateLeaderboardData = () => {
    invalidateQueries.leaderboard(queryClient);
  };

  const invalidateAllData = () => {
    invalidateQueries.all(queryClient);
  };

  // Smart invalidation based on data relationships
  const smartInvalidateAfterRouteComplete = () => {
    invalidateRouteData();
    invalidateUserData();
    // Don't invalidate territories immediately as they might not be affected
    // Territory invalidation will happen if territory is actually claimed
  };

  const smartInvalidateAfterTerritoryChange = () => {
    invalidateTerritoryData();
    invalidateUserData();
    invalidateLeaderboardData();
  };

  return {
    invalidateUserData,
    invalidateRouteData,
    invalidateTerritoryData,
    invalidateLeaderboardData,
    invalidateAllData,
    smartInvalidateAfterRouteComplete,
    smartInvalidateAfterTerritoryChange,
  };
};

// Helper functions
function calculateDistance(coordinates: Array<{ latitude: number; longitude: number }>): number {
  if (coordinates.length < 2) return 0;
  
  let totalDistance = 0;
  for (let i = 1; i < coordinates.length; i++) {
    const prev = coordinates[i - 1];
    const curr = coordinates[i];
    totalDistance += haversineDistance(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
  }
  
  return totalDistance;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

function calculatePolygonArea(coordinates: Array<{ longitude: number; latitude: number }>): number {
  if (coordinates.length < 3) return 0;
  
  let area = 0;
  const n = coordinates.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += coordinates[i].longitude * coordinates[j].latitude;
    area -= coordinates[j].longitude * coordinates[i].latitude;
  }
  
  return Math.abs(area) / 2 * 111320 * 111320; // Rough conversion to square meters
}