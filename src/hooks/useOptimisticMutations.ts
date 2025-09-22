import { useMutation, useQueryClient } from '@tanstack/react-query';
import { GatewayAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { queryKeys, invalidateQueries } from '@/lib/query/query-client';
import { RouteData } from '@/pages/Routes';

// Optimistic route tracking mutations
export const useOptimisticStartRoute = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (variables: { userId: string; name?: string; description?: string; start_coordinate?: any }) => GatewayAPI.startRoute(variables.userId, variables),
    onMutate: async (newRoute: { userId: string; name?: string; description?: string; start_coordinate?: any }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.activeRoute(newRoute.userId) });

      const previousActiveRoute = queryClient.getQueryData(queryKeys.activeRoute(newRoute.userId));
      const previousRoutes = queryClient.getQueryData(queryKeys.routesForUser(newRoute.userId));

      queryClient.setQueryData(queryKeys.activeRoute(newRoute.userId), (old: RouteData | undefined) => ({
        ...old,
        ...newRoute,
      }));
      return { previousActiveRoute, previousRoutes };
    },
    onError: (_error, _variables, context) => {
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
    onError: (_error, variables, context) => {
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
    onSettled: (data, _error, variables) => {
      invalidateQueries.activeRoute(queryClient, variables.routeId);
    },
  });
};

export const useOptimisticCompleteRoute = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (variables) => GatewayAPI.completeRoute(variables.routeId, user?.id, variables.payload),
    onMutate: async (routeCompletion: { routeId: string; payload: any }) => {
      if (!user?.id) return;

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.activeRoute(user.id) });
      await queryClient.cancelQueries({ queryKey: queryKeys.routesForUser(user.id) });

      const previousRoutes = queryClient.getQueryData(queryKeys.routesForUser(user.id));

      // Optimistically remove the active route
      const previousActiveRoute = queryClient.getQueryData(queryKeys.activeRoute(user.id));
      queryClient.setQueryData(queryKeys.activeRoute(user.id), null);
      
      // Optimistically add the completed route to the list
      const optimisticRoute = {
        ...(previousActiveRoute as object),
        id: `optimistic-${Date.now()}`,
        status: 'completed',
        name: routeCompletion.payload?.name || 'Unnamed Route',
      };

      if (previousRoutes) {
        queryClient.setQueryData(queryKeys.routesForUser(user.id), (old: RouteData[] | undefined) => [
          ...(old || []),
          optimisticRoute as RouteData,
        ]);
      }
      return { previousRoutes, previousActiveRoute };
    },
    onError: (_error, variables, context) => {
      // Revert optimistic updates
      if (context && user?.id) {
        queryClient.setQueryData(queryKeys.activeRoute(user.id), context.previousActiveRoute);
        queryClient.setQueryData(queryKeys.routesForUser(user.id), context.previousRoutes);
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
    onSettled: (data, _error, variables) => {
      invalidateQueries.routesForUser(queryClient, user?.id);
      invalidateQueries.activeRoute(queryClient, user?.id);
      invalidateQueries.userProfile(queryClient, user?.id);
      invalidateQueries.territories(queryClient, user?.id);
      invalidateQueries.leaderboard(queryClient);
    },
  });
};

export const useOptimisticClaimTerritory = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (variables) => GatewayAPI.claimTerritoryFromRoute(user?.id, variables),
    onMutate: async (claim: { route_id: string; boundary_coordinates: Array<{ longitude: number; latitude: number }>; name?: string; description?: string }) => {
      if (!user?.id) return;

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.userTerritories(user?.id) });
      await queryClient.cancelQueries({ queryKey: queryKeys.territoriesMap() });

      const previousTerritories = queryClient.getQueryData(queryKeys.userTerritories(user?.id));
      const previousTerritoriesMap = queryClient.getQueryData(queryKeys.territoriesMap());

      const optimisticTerritory = {
        id: `optimistic-territory-${Date.now()}`,
        name: claim.name,
        // ... other optimistic fields
      };

      queryClient.setQueryData(queryKeys.userTerritories(user?.id), (old: { id: string }[] | undefined) => [...(old || []), optimisticTerritory]);

      return { previousTerritories, previousTerritoriesMap };
    },
    onError: (_error, variables, context) => {
      // Revert optimistic updates
      if (context && user?.id) {
        queryClient.setQueryData(queryKeys.userTerritories(user.id), context.previousTerritories);
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
    onSettled: () => {
      invalidateQueries.territories(queryClient, user!.id);
      invalidateQueries.leaderboard(queryClient);
      invalidateQueries.userProfile(queryClient, user!.id);
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