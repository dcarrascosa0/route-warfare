import { useState, useEffect, useCallback } from 'react';
import { GatewayAPI } from '@/lib/api';
import { useAuth } from './useAuth';

interface TerritoryEligibilityIndicators {
  has_minimum_points: boolean;
  is_approaching_closure: boolean;
  has_sufficient_area: boolean;
  gps_quality_acceptable: boolean;
  route_complexity_good: boolean;
}

interface ClosureGuidance {
  distance_to_start: number | null;
  recommended_direction: string | null;
  closure_feasible: boolean;
}

interface TerritoryPreview {
  route_id: string;
  area_km2: number;
  perimeter_km: number;
  is_valid: boolean;
  claiming_probability: number;
  boundary: Array<{
    latitude: number;
    longitude: number;
  }>;
  closure_distance_m: number | null;
  min_points_needed: number;
  gps_quality_issues: string[];
  territory_eligibility_indicators: TerritoryEligibilityIndicators;
  closure_guidance: ClosureGuidance;
  calculation_time_ms?: number;
}

interface UseTerritoryPreviewOptions {
  routeId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const useTerritoryPreview = (options: UseTerritoryPreviewOptions = {}) => {
  const { routeId, autoRefresh = false, refreshInterval = 10000 } = options;
  const { user } = useAuth();
  const [preview, setPreview] = useState<TerritoryPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchPreview = useCallback(async () => {
    if (!routeId || !user) {
      setPreview(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await GatewayAPI.getTerritoryPreview(routeId, user.id);
      
      if (response.ok && response.data) {
        setPreview(response.data as TerritoryPreview);
        setLastUpdated(new Date());
      } else {
        // Route might not be eligible for preview (not enough points, etc.)
        setPreview(null);
        if (response.status !== 404) {
          setError('Failed to fetch territory preview');
        }
      }
    } catch (err) {
      console.error('Error fetching territory preview:', err);
      setError('Failed to fetch territory preview');
      setPreview(null);
    } finally {
      setLoading(false);
    }
  }, [routeId, user]);

  // Initial fetch
  useEffect(() => {
    fetchPreview();
  }, [fetchPreview]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !routeId) return;

    const interval = setInterval(fetchPreview, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, routeId, refreshInterval, fetchPreview]);

  // Manual refresh
  const refresh = useCallback(() => {
    fetchPreview();
  }, [fetchPreview]);

  // Calculate enhanced preview status
  const previewStatus = preview ? (() => {
    const issues = Array.isArray(preview.gps_quality_issues) ? preview.gps_quality_issues : [];
    const indicators = preview.territory_eligibility_indicators || {
      has_minimum_points: false,
      is_approaching_closure: false,
      has_sufficient_area: false,
      gps_quality_acceptable: true,
      route_complexity_good: true,
    } as TerritoryEligibilityIndicators;
    const guidance = preview.closure_guidance || {
      distance_to_start: null,
      recommended_direction: null,
      closure_feasible: false,
    } as ClosureGuidance;

    return {
      canClaim: !!preview.is_valid,
      needsMorePoints: (preview.min_points_needed || 0) > 0,
      needsClosure: typeof preview.closure_distance_m === 'number' && preview.closure_distance_m > 50,
      hasGPSIssues: issues.length > 0,
      claimingProbability: preview.claiming_probability,
      estimatedArea: preview.area_km2,
      routeLength: preview.perimeter_km,

      // Enhanced status indicators
      eligibilityIndicators: indicators,
      closureGuidance: guidance,

      // Detailed status checks
      hasMinimumPoints: !!indicators.has_minimum_points,
      isApproachingClosure: !!indicators.is_approaching_closure,
      hasSufficientArea: !!indicators.has_sufficient_area,
      gpsQualityAcceptable: !!indicators.gps_quality_acceptable,
      routeComplexityGood: !!indicators.route_complexity_good,

      // Closure guidance
      distanceToStart: guidance.distance_to_start,
      recommendedDirection: guidance.recommended_direction,
      closureFeasible: !!guidance.closure_feasible,

      // Performance info
      calculationTime: preview.calculation_time_ms
    };
  })() : null;

  return {
    preview,
    previewStatus,
    loading,
    error,
    lastUpdated,
    refresh,
    hasPreview: preview !== null
  };
};

// Hook for real-time territory preview updates
export const useRealTimeTerritoryPreview = (routeId?: string) => {
  const basePreview = useTerritoryPreview({ 
    routeId, 
    autoRefresh: true, 
    refreshInterval: 15000 // Refresh every 15 seconds
  });

  const [realtimeUpdates, setRealtimeUpdates] = useState({
    coordinateCount: 0,
    lastCoordinateTime: null as Date | null,
    isNearClosure: false
  });

  // Update preview when new coordinates are added
  const updateFromCoordinate = useCallback((coordinate: any, totalCoordinates: number) => {
    setRealtimeUpdates(prev => ({
      ...prev,
      coordinateCount: totalCoordinates,
      lastCoordinateTime: new Date(),
      isNearClosure: false // Will be updated by next preview fetch
    }));

    // Trigger preview refresh after coordinate addition
    setTimeout(() => {
      basePreview.refresh();
    }, 1000);
  }, [basePreview.refresh]);

  // Check if route is approaching closure
  useEffect(() => {
    const closureDistance = basePreview.preview?.closure_distance_m;
    if (typeof closureDistance === 'number') {
      const isNear = closureDistance <= 100; // Within 100m
      setRealtimeUpdates(prev => ({
        ...prev,
        isNearClosure: isNear
      }));
    } else {
      setRealtimeUpdates(prev => ({
        ...prev,
        isNearClosure: false
      }));
    }
  }, [basePreview.preview?.closure_distance_m]);

  return {
    ...basePreview,
    realtimeUpdates,
    updateFromCoordinate,
    isApproachingClosure: realtimeUpdates.isNearClosure
  };
};