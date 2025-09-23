import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { GatewayAPI } from '@/lib/api';
import type { TerritoryPreview, RealTimeTerritoryPreviewRequest } from '@/lib/api/types/territory-preview';
import type { Coordinate } from '@/lib/api/types/common';

/**
 * Hook for managing territory preview data from route coordinates
 */
export function useTerritoryPreview(routeId: string, userId: string, options?: {
  enabled?: boolean;
  refetchInterval?: number;
}) {
  const { enabled = true, refetchInterval } = options || {};

  return useQuery({
    queryKey: ['territory-preview', routeId, userId],
    queryFn: async () => {
      const response = await GatewayAPI.getTerritoryPreview(routeId, userId);
      if (!response.ok) {
        throw new Error(response.error as string || 'Failed to fetch territory preview');
      }
      return response.data;
    },
    enabled: enabled && !!routeId && !!userId,
    refetchInterval,
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
  });
}

/**
 * Hook for real-time territory preview calculation from coordinates
 */
export function useRealTimeTerritoryPreview(options?: {
  enabled?: boolean;
  debounceMs?: number;
}) {
  const { enabled = true, debounceMs = 1000 } = options || {};
  const queryClient = useQueryClient();
  const [isCalculating, setIsCalculating] = useState(false);

  const mutation = useMutation({
    mutationFn: async (coordinates: Coordinate[]) => {
      // Convert coordinates to the expected format
      const geoPoints = coordinates.map(coord => ({
        longitude: coord.longitude,
        latitude: coord.latitude,
      }));

      const response = await GatewayAPI.getRealTimeTerritoryPreview(geoPoints);
      if (!response.ok) {
        throw new Error(response.error as string || 'Failed to calculate territory preview');
      }
      return response.data;
    },
    onSuccess: (data, coordinates) => {
      // Cache the result for potential reuse
      const cacheKey = ['real-time-territory-preview', coordinates.length];
      queryClient.setQueryData(cacheKey, data);
    },
  });

  const calculatePreview = useCallback(
    (coordinates: Coordinate[], immediate = false) => {
      if (!enabled || coordinates.length < 3 || isCalculating) {
        return;
      }
      
      setIsCalculating(true);
      
      if (immediate) {
        // Immediate calculation for closed loops
        mutation.mutate(coordinates);
      } else {
        // Debounced calculation for open routes
        mutation.mutate(coordinates);
      }
      
      // Reset calculating flag after a delay
      setTimeout(() => setIsCalculating(false), 1000);
    },
    [enabled, mutation, isCalculating]
  );

  return {
    calculatePreview,
    preview: mutation.data,
    isLoading: mutation.isPending,
    error: mutation.error,
    isError: mutation.isError,
    reset: mutation.reset,
  };
}

/**
 * Hook for managing territory preview state and calculations
 */
export function useTerritoryPreviewManager(
  routeId: string,
  userId: string,
  coordinates: Coordinate[],
  options?: {
    enableRealTime?: boolean;
    enableRoutePreview?: boolean;
    realTimeDebounce?: number;
    refetchInterval?: number;
  }
) {
  const {
    enableRealTime = true,
    enableRoutePreview = true,
    realTimeDebounce = 1000,
    refetchInterval = 30000,
  } = options || {};

  // Route-based territory preview
  const routePreview = useTerritoryPreview(routeId, userId, {
    enabled: enableRoutePreview,
    refetchInterval,
  });

  // Real-time territory preview
  const realTimePreview = useRealTimeTerritoryPreview({
    enabled: enableRealTime,
    debounceMs: realTimeDebounce,
  });

  // Determine which preview to use
  const activePreview = useMemo(() => {
    // Prefer real-time preview if available and recent
    if (realTimePreview.preview && !realTimePreview.isLoading) {
      return {
        data: realTimePreview.preview,
        isLoading: false,
        error: realTimePreview.error,
        source: 'real-time' as const,
      };
    }

    // Fall back to route preview
    if (routePreview.data) {
      return {
        data: routePreview.data,
        isLoading: routePreview.isLoading,
        error: routePreview.error,
        source: 'route' as const,
      };
    }

    // Loading state
    return {
      data: null,
      isLoading: routePreview.isLoading || realTimePreview.isLoading,
      error: routePreview.error || realTimePreview.error,
      source: 'none' as const,
    };
  }, [
    realTimePreview.preview,
    realTimePreview.isLoading,
    realTimePreview.error,
    routePreview.data,
    routePreview.isLoading,
    routePreview.error,
  ]);

  // Auto-calculate real-time preview when coordinates change
  const updateRealTimePreview = useCallback((immediate = false) => {
    if (enableRealTime && coordinates.length >= 3) {
      realTimePreview.calculatePreview(coordinates, immediate);
    }
  }, [enableRealTime, coordinates, realTimePreview]);

  return {
    // Active preview data
    preview: activePreview.data,
    isLoading: activePreview.isLoading,
    error: activePreview.error,
    source: activePreview.source,

    // Individual preview sources
    routePreview: {
      data: routePreview.data,
      isLoading: routePreview.isLoading,
      error: routePreview.error,
      refetch: routePreview.refetch,
    },
    realTimePreview: {
      data: realTimePreview.preview,
      isLoading: realTimePreview.isLoading,
      error: realTimePreview.error,
      calculate: realTimePreview.calculatePreview,
      reset: realTimePreview.reset,
    },

    // Actions
    updateRealTimePreview,
    refreshRoutePreview: routePreview.refetch,
  };
}

/**
 * Hook for territory preview statistics and quality metrics
 */
export function useTerritoryPreviewStats(preview: TerritoryPreview | null) {
  return useMemo(() => {
    if (!preview) {
      return {
        hasData: false,
        isValid: false,
        area: 0,
        formattedArea: 'No data',
        conflicts: 0,
        majorConflicts: 0,
        eligible: false,
        quality: 'unknown' as const,
        qualityScore: 0,
      };
    }

    const area = preview.area_square_meters || 0;
    const conflicts = preview.conflicts?.length || 0;
    const majorConflicts = preview.conflicts?.filter(
      c => c.conflict_type === 'major' || c.conflict_type === 'complete'
    ).length || 0;

    // Format area
    let formattedArea: string;
    if (area >= 1000000) {
      formattedArea = `${(area / 1000000).toFixed(2)} km²`;
    } else if (area >= 10000) {
      formattedArea = `${(area / 10000).toFixed(2)} ha`;
    } else {
      formattedArea = `${area.toFixed(0)} m²`;
    }

    // Calculate quality score
    let qualityScore = 0;
    if (preview.is_valid) qualityScore += 40;
    if (preview.eligible_for_claiming) qualityScore += 30;
    if (area > 100) qualityScore += 20;
    if (conflicts === 0) qualityScore += 10;
    qualityScore = Math.max(0, qualityScore - majorConflicts * 20 - conflicts * 5);

    // Determine quality level
    let quality: 'poor' | 'fair' | 'good' | 'excellent';
    if (qualityScore >= 80) quality = 'excellent';
    else if (qualityScore >= 60) quality = 'good';
    else if (qualityScore >= 40) quality = 'fair';
    else quality = 'poor';

    return {
      hasData: true,
      isValid: preview.is_valid,
      area,
      formattedArea,
      conflicts,
      majorConflicts,
      eligible: preview.eligible_for_claiming,
      quality,
      qualityScore,
    };
  }, [preview]);
}