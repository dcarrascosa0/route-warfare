import { useState, useCallback } from 'react';
import { GatewayAPI } from '@/lib/api';

export interface TerritoryClaimResult {
  success: boolean;
  territory_id?: string;
  area_sqm: number;
  conflicts_resolved: number;
  ownership_transfers: string[];
  error_message?: string;
}

export interface TerritoryClaimState {
  isProcessing: boolean;
  result: TerritoryClaimResult | null;
  error: string | null;
}

export interface UseTerritoryclaimingProps {
  userId?: string;
  onClaimSuccess?: (result: TerritoryClaimResult) => void;
  onClaimError?: (error: string) => void;
}

export default function useTerritoryClaiming({
  userId,
  onClaimSuccess,
  onClaimError
}: UseTerritoryclaimingProps = {}) {
  const [claimState, setClaimState] = useState<TerritoryClaimState>({
    isProcessing: false,
    result: null,
    error: null
  });

  const claimTerritory = useCallback(async (
    routeId: string,
    boundaryCoordinates: Array<{ longitude: number; latitude: number }>,
    options?: { name?: string; description?: string }
  ) => {
    if (!userId) {
      const error = 'User ID is required for territory claiming';
      setClaimState(prev => ({ ...prev, error }));
      onClaimError?.(error);
      return null;
    }

    setClaimState(prev => ({ 
      ...prev, 
      isProcessing: true, 
      error: null, 
      result: null 
    }));

    try {
      const response = await GatewayAPI.claimTerritoryFromRoute(userId, {
        route_id: routeId,
        boundary_coordinates: boundaryCoordinates,
        name: options?.name,
        description: options?.description,
      });
      
      if (response.ok && response.data) {
        const result = response.data as TerritoryClaimResult;
        setClaimState(prev => ({ 
          ...prev, 
          isProcessing: false, 
          result,
          error: null 
        }));
        onClaimSuccess?.(result);
        return result;
      } else {
        const errorMessage = typeof (response as any).error === 'string'
          ? (response as any).error
          : (typeof (response as any).error?.message === 'string'
              ? (response as any).error.message
              : 'Failed to claim territory');
        setClaimState(prev => ({ 
          ...prev, 
          isProcessing: false, 
          error: errorMessage 
        }));
        onClaimError?.(errorMessage);
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setClaimState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        error: errorMessage 
      }));
      onClaimError?.(errorMessage);
      return null;
    }
  }, [userId, onClaimSuccess, onClaimError]);

  const checkEligibility = useCallback((
    distance: number,
    isClosedLoop: boolean,
    gpsQuality: number,
    coordinateCount: number
  ): { eligible: boolean; reasons: string[] } => {
    const reasons: string[] = [];
    let eligible = true;

    // Minimum distance requirement (500m)
    if (distance < 500) {
      eligible = false;
      reasons.push(`Route too short (${Math.round(distance)}m, minimum 500m required)`);
    }

    // Closed loop requirement
    if (!isClosedLoop) {
      eligible = false;
      reasons.push('Route must form a closed loop');
    }

    // GPS quality requirement (minimum 60%)
    if (gpsQuality < 60) {
      eligible = false;
      reasons.push(`GPS quality too low (${Math.round(gpsQuality)}%, minimum 60% required)`);
    }

    // Minimum coordinate count (20 points)
    if (coordinateCount < 20) {
      eligible = false;
      reasons.push(`Not enough GPS points (${coordinateCount}, minimum 20 required)`);
    }

    if (eligible) {
      reasons.push('Route meets all territory claiming requirements');
    }

    return { eligible, reasons };
  }, []);

  const resetClaimState = useCallback(() => {
    setClaimState({
      isProcessing: false,
      result: null,
      error: null
    });
  }, []);

  return {
    claimState,
    claimTerritory,
    checkEligibility,
    resetClaimState
  };
}