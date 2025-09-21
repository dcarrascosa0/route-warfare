import { useMutation, useQueryClient } from '@tanstack/react-query';
import { GatewayAPI } from '@/lib/api';
import { queryKeys, invalidateQueries } from '@/lib/query-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Optimistic route tracking mutations
export const useOptimisticStartRoute = () => {
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
    onMutate: async (variables) => {
      if (!user?.id) return;

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.activeRoute(user.id) });
      await queryClient.cancelQueries({ queryKey: queryKeys.routesForUser(user.id) });

      // Snapshot the previous values
      const previousActiveRoute = queryClient.getQueryData(queryKeys.activeRoute(user.id));
      const previousRoutes = queryClient.getQueryData(queryKeys.routesForUser(user.id));

      // Optimistically update active route
      const optimisticRoute = {
        id: `temp-${Date.now()}`,
        name: variables.name || 'New Route',
        description: variables.description,
        start_coordinate: variables.start_coordinate,
        status: 'active',
        user_id: user.id,
        coordinates: [],
        start_time: new Date().toISOString(),
        distance: 0,
        is_completed: false,
        is_closed: false,
      };

      queryClient.setQueryData(queryKeys.activeRoute(user.id), optimisticRoute);

      // Show optimistic feedback
      toast.success('Starting route...', { duration: 2000 });

      return { previousActiveRoute, previousRoutes, optimisticRoute };
    },
    onError: (err, variables, context) => {
      // Revert optimistic updates
      if (context && user?.id) {
        queryClient.setQueryData(queryKeys.activeRoute(user.id), context.previousActiveRoute);
        queryClient.setQueryData(queryKeys.routesForUser(user.id), context.previousRoutes);
      }
      
      toast.error('Failed to start route. Please try again.');
    },
    onSuccess: (data, variables, context) => {
      if (user?.id) {
        // Replace optimistic data with real data
        queryClient.setQueryData(queryKeys.activeRoute(user.id), data);
        invalidateQueries.routes(queryClient, user.id);
      }
      
      toast.success('Route started successfully!');
    },
  });
};

export const useOptimisticAddCoordinates = () => {
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
    onMutate: async (variables) => {
      if (!user?.id) return;

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.activeRoute(user.id) });
      await queryClient.cancelQueries({ queryKey: queryKeys.route(variables.routeId, user.id) });

      // Snapshot the previous values
      const previousActiveRoute = queryClient.getQueryData(queryKeys.activeRoute(user.id));
      const previousRoute = queryClient.getQueryData(queryKeys.route(variables.routeId, user.id));

      // Optimistically update route with new coordinates
      if (previousActiveRoute && typeof previousActiveRoute === 'object') {
        const route = previousActiveRoute as any;
        const updatedRoute = {
          ...route,
          coordinates: [...(route.coordinates || []), ...variables.coordinates],
          distance: route.distance + calculateDistance(variables.coordinates),
        };
        
        queryClient.setQueryData(queryKeys.activeRoute(user.id), updatedRoute);
        queryClient.setQueryData(queryKeys.route(variables.routeId, user.id), updatedRoute);
      }

      return { previousActiveRoute, previousRoute };
    },
    onError: (err, variables, context) => {
      // Revert optimistic updates
      if (context && user?.id) {
        queryClient.setQueryData(queryKeys.activeRoute(user.id), context.previousActiveRoute);
        queryClient.setQueryData(queryKeys.route(variables.routeId, user.id), context.previousRoute);
      }
    },
    onSuccess: (data, variables) => {
      if (user?.id) {
        // Update with real data from server
        queryClient.setQueryData(queryKeys.activeRoute(user.id), data);
        queryClient.setQueryData(queryKeys.route(variables.routeId, user.id), data);
      }
    },
  });
};

export const useOptimisticCompleteRoute = () => {
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
    onMutate: async (variables) => {
      if (!user?.id) return;

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.activeRoute(user.id) });
      await queryClient.cancelQueries({ queryKey: queryKeys.route(variables.routeId, user.id) });

      // Snapshot the previous values
      const previousActiveRoute = queryClient.getQueryData(queryKeys.activeRoute(user.id));
      const previousRoute = queryClient.getQueryData(queryKeys.route(variables.routeId, user.id));

      // Optimistically update route as completed
      if (previousActiveRoute && typeof previousActiveRoute === 'object') {
        const route = previousActiveRoute as any;
        const completedRoute = {
          ...route,
          status: 'completed',
          is_completed: true,
          end_time: new Date().toISOString(),
          end_coordinate: variables.completion.end_coordinate,
        };
        
        queryClient.setQueryData(queryKeys.route(variables.routeId, user.id), completedRoute);
      }

      // Clear active route
      queryClient.setQueryData(queryKeys.activeRoute(user.id), null);

      // Show optimistic feedback
      toast.success('Completing route...', { duration: 2000 });

      return { previousActiveRoute, previousRoute };
    },
    onError: (err, variables, context) => {
      // Revert optimistic updates
      if (context && user?.id) {
        queryClient.setQueryData(queryKeys.activeRoute(user.id), context.previousActiveRoute);
        queryClient.setQueryData(queryKeys.route(variables.routeId, user.id), context.previousRoute);
      }
      
      toast.error('Failed to complete route. Please try again.');
    },
    onSuccess: (data, variables) => {
      if (user?.id) {
        // Update with real data and invalidate related queries
        queryClient.setQueryData(queryKeys.route(variables.routeId, user.id), data);
        invalidateQueries.routes(queryClient, user.id);
        invalidateQueries.userProfile(queryClient, user.id);
        invalidateQueries.territories(queryClient, user.id);
      }
      
      toast.success('Route completed successfully!');
    },
  });
};

export const useOptimisticClaimTerritory = () => {
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
    onMutate: async (variables) => {
      if (!user?.id) return;

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.userTerritories(user.id) });
      await queryClient.cancelQueries({ queryKey: queryKeys.territoriesMap() });

      // Snapshot the previous values
      const previousUserTerritories = queryClient.getQueryData(queryKeys.userTerritories(user.id));
      const previousTerritoriesMap = queryClient.getQueryData(queryKeys.territoriesMap());

      // Create optimistic territory
      const optimisticTerritory = {
        id: `temp-${Date.now()}`,
        owner_id: user.id,
        owner_username: user.username,
        name: variables.name || 'New Territory',
        description: variables.description,
        boundary: {
          type: 'Polygon',
          coordinates: [variables.boundary_coordinates.map(coord => [coord.longitude, coord.latitude])],
        },
        area: calculatePolygonArea(variables.boundary_coordinates),
        status: 'claimed',
        claimed_at: new Date().toISOString(),
        route_id: variables.route_id,
      };

      // Optimistically update user territories
      if (previousUserTerritories && Array.isArray(previousUserTerritories)) {
        queryClient.setQueryData(
          queryKeys.userTerritories(user.id), 
          [...previousUserTerritories, optimisticTerritory]
        );
      }

      // Show optimistic feedback
      toast.success('Claiming territory...', { duration: 2000 });

      return { previousUserTerritories, previousTerritoriesMap, optimisticTerritory };
    },
    onError: (err, variables, context) => {
      // Revert optimistic updates
      if (context && user?.id) {
        queryClient.setQueryData(queryKeys.userTerritories(user.id), context.previousUserTerritories);
        queryClient.setQueryData(queryKeys.territoriesMap(), context.previousTerritoriesMap);
      }
      
      toast.error('Failed to claim territory. Please try again.');
    },
    onSuccess: (data, variables) => {
      if (user?.id) {
        // Invalidate all related queries to get fresh data
        invalidateQueries.territories(queryClient, user.id);
        invalidateQueries.userProfile(queryClient, user.id);
        invalidateQueries.leaderboard(queryClient);
      }
      
      toast.success('Territory claimed successfully!');
    },
  });
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
  // Simple polygon area calculation (approximate)
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