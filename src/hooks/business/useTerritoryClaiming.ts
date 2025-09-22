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
  const [state, setState] = useState<TerritoryClaimState>({
    isProcessing: false,
    result: null,
    error: null,
  });

  const claimWithRoute = useCallback(async (routeId: string) => {
    if (!userId) {
      const errorMsg = 'User ID is not available. Cannot claim territory.';
      setState({ isProcessing: false, result: null, error: errorMsg });
      onClaimError?.(errorMsg);
      return;
    }

    setState({ isProcessing: true, result: null, error: null });

    try {
      const response = await GatewayAPI.claimTerritoryFromRoute({
        route_id: routeId,
        user_id: userId,
        name: `Territory from route ${routeId.substring(0, 8)}`,
      });

      if (response.ok && response.data) {
        const result: TerritoryClaimResult = response.data;
        setState({ isProcessing: false, result, error: null });
        onClaimSuccess?.(result);
      } else {
        const errorMsg = response.error || 'Failed to claim territory.';
        setState({ isProcessing: false, result: null, error: errorMsg });
        onClaimError?.(errorMsg);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred.';
      setState({ isProcessing: false, result: null, error: errorMsg });
      onClaimError?.(errorMsg);
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
    setState({
      isProcessing: false,
      result: null,
      error: null
    });
  }, []);

  return { ...state, claimWithRoute };
}