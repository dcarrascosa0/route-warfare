import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { TerritoryPreview } from '@/lib/api/types/territory-preview';
import './TerritoryPreview.css';

export interface TerritoryAreaDisplayProps {
  /** Territory preview data */
  preview: TerritoryPreview | null;
  /** Whether the display is loading */
  isLoading?: boolean;
  /** Position of the display */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Whether to show conflict indicators */
  showConflicts?: boolean;
  /** Connection status for real-time updates */
  connectionStatus?: {
    isConnected: boolean;
    error: string | null;
    lastUpdate: Date | null;
  };
  /** Custom CSS class */
  className?: string;
}

/**
 * TerritoryAreaDisplay component for showing territory area and status
 * as an overlay on the map during route tracking.
 */
export default function TerritoryAreaDisplay({
  preview,
  isLoading = false,
  position = 'top-left',
  showConflicts = true,
  connectionStatus,
  className,
}: TerritoryAreaDisplayProps) {
  // Format area for display
  const formattedArea = useMemo(() => {
    if (!preview?.area_square_meters) return null;

    const sqm = preview.area_square_meters;
    
    if (sqm >= 1000000) {
      return `${(sqm / 1000000).toFixed(2)} km²`;
    } else if (sqm >= 10000) {
      return `${(sqm / 10000).toFixed(2)} ha`;
    } else {
      return `${sqm.toFixed(0)} m²`;
    }
  }, [preview?.area_square_meters]);

  // Determine display status
  const status = useMemo(() => {
    if (!preview) return 'no-data';
    if (!preview.is_valid) return 'invalid';
    if (!preview.eligible_for_claiming) return 'not-eligible';
    if (preview.conflicts?.some(c => c.conflict_type === 'major' || c.conflict_type === 'complete')) {
      return 'major-conflicts';
    }
    if (preview.conflicts?.length > 0) return 'minor-conflicts';
    return 'valid';
  }, [preview]);

  // Get status text
  const statusText = useMemo(() => {
    switch (status) {
      case 'no-data':
        return 'No territory data';
      case 'invalid':
        return 'Invalid territory';
      case 'not-eligible':
        return 'Not eligible';
      case 'major-conflicts':
        return 'Major conflicts';
      case 'minor-conflicts':
        return 'Minor conflicts';
      case 'valid':
        return 'Valid territory';
      default:
        return 'Unknown status';
    }
  }, [status]);

  // Get conflict indicators
  const conflictIndicators = useMemo(() => {
    if (!showConflicts || !preview?.conflicts?.length) return null;

    const conflictTypes = preview.conflicts.reduce((acc, conflict) => {
      acc[conflict.conflict_type] = (acc[conflict.conflict_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(conflictTypes).map(([type, count]) => (
      <span
        key={type}
        className={cn('territory-conflict-indicator', type)}
        title={`${count} ${type} conflict${count > 1 ? 's' : ''}`}
      />
    ));
  }, [preview?.conflicts, showConflicts]);

  // Position classes
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  if (isLoading) {
    return (
      <div
        className={cn(
          'territory-area-display',
          'absolute z-[1000]',
          positionClasses[position],
          className
        )}
      >
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Calculating...</span>
        </div>
      </div>
    );
  }

  if (!preview || !formattedArea) {
    return null;
  }

  return (
    <div
      className={cn(
        'territory-area-display',
        'absolute z-[1000]',
        positionClasses[position],
        status === 'major-conflicts' && 'has-conflicts',
        status === 'not-eligible' && 'not-eligible',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <div className="flex flex-col">
          <div className="font-medium">{formattedArea}</div>
          <div className="text-xs opacity-80">{statusText}</div>
          {connectionStatus && (
            <div className="flex items-center gap-1 text-xs">
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  connectionStatus.isConnected ? 'bg-green-400' : 'bg-red-400'
                )}
              />
              <span className="opacity-60">
                {connectionStatus.isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
          )}
        </div>
        {conflictIndicators && (
          <div className="flex gap-1">
            {conflictIndicators}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Compact version of the territory area display for smaller spaces
 */
export function CompactTerritoryAreaDisplay({
  preview,
  isLoading = false,
  className,
}: {
  preview: TerritoryPreview | null;
  isLoading?: boolean;
  className?: string;
}) {
  const formattedArea = useMemo(() => {
    if (!preview?.area_square_meters) return null;

    const sqm = preview.area_square_meters;
    
    if (sqm >= 1000000) {
      return `${(sqm / 1000000).toFixed(1)}km²`;
    } else if (sqm >= 10000) {
      return `${(sqm / 10000).toFixed(1)}ha`;
    } else {
      return `${sqm.toFixed(0)}m²`;
    }
  }, [preview?.area_square_meters]);

  const hasConflicts = preview?.conflicts?.length > 0;

  if (isLoading) {
    return (
      <span className={cn('text-xs text-gray-400', className)}>
        Calculating...
      </span>
    );
  }

  if (!formattedArea) {
    return null;
  }

  return (
    <span
      className={cn(
        'text-xs font-medium',
        hasConflicts ? 'text-red-400' : 'text-blue-400',
        className
      )}
    >
      {formattedArea}
      {hasConflicts && (
        <span className="ml-1 text-red-500">⚠</span>
      )}
    </span>
  );
}