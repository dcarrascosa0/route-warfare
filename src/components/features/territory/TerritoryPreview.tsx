import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Polygon, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { cn } from '@/lib/utils';
import type { TerritoryPreview as TerritoryPreviewType, TerritoryConflict } from '@/lib/api/types/territory-preview';
import type { Coordinate } from '@/lib/api/types/common';
import { useTerritoryWebSocket } from '@/hooks/useTerritoryWebSocket';

export interface TerritoryPreviewProps {
    /** Territory preview data from API */
    preview: TerritoryPreviewType | null;
    /** Whether the preview is currently loading */
    isLoading?: boolean;
    /** Whether to show the preview overlay */
    visible?: boolean;
    /** Animation configuration */
    animationConfig?: {
        enabled: boolean;
        duration: number;
        pulseSpeed: number;
    };
    /** Custom styling options */
    styling?: {
        fillColor?: string;
        borderColor?: string;
        fillOpacity?: number;
        borderOpacity?: number;
        borderWeight?: number;
        conflictColor?: string;
    };
    /** Callback when preview area is clicked */
    onPreviewClick?: (preview: TerritoryPreviewType) => void;
    /** Custom CSS class */
    className?: string;
}

// Default styling configuration
const DEFAULT_STYLING = {
    fillColor: '#3b82f6', // blue-500
    borderColor: '#1d4ed8', // blue-700
    fillOpacity: 0.2,
    borderOpacity: 0.8,
    borderWeight: 2,
    conflictColor: '#ef4444', // red-500
};

// Default animation configuration
const DEFAULT_ANIMATION = {
    enabled: true,
    duration: 1000,
    pulseSpeed: 2000,
};

/**
 * TerritoryPreview component for displaying real-time territory boundaries
 * on Leaflet maps during route tracking.
 */
export default function TerritoryPreview({
    preview,
    isLoading = false,
    visible = true,
    animationConfig = DEFAULT_ANIMATION,
    styling = DEFAULT_STYLING,
    onPreviewClick,
    className,
}: TerritoryPreviewProps) {
    const [isAnimating, setIsAnimating] = useState(false);
    const [pulsePhase, setPulsePhase] = useState(0);
    const [realtimePreview, setRealtimePreview] = useState<TerritoryPreviewType | null>(null);

    // Merge animation config with defaults
    const finalAnimation = useMemo(() => ({
        ...DEFAULT_ANIMATION,
        ...animationConfig,
    }), [animationConfig]);

    // WebSocket integration for real-time territory preview updates
    const handleTerritoryPreviewUpdate = useCallback((data: any) => {
        if (data.preview && data.preview.is_real_time) {
            setRealtimePreview(data.preview);
            // Trigger animation when new preview arrives
            if (finalAnimation.enabled) {
                setIsAnimating(true);
                setTimeout(() => setIsAnimating(false), finalAnimation.duration);
            }
        }
    }, [finalAnimation]);

    const { isConnected } = useTerritoryWebSocket({
        onTerritoryPreviewUpdate: handleTerritoryPreviewUpdate,
    });

    // Use real-time preview if available, otherwise use prop preview
    const activePreview = realtimePreview || preview;

    // Merge styling with defaults
    const finalStyling = useMemo(() => ({
        ...DEFAULT_STYLING,
        ...styling,
    }), [styling]);

    // Convert GeoJSON boundary to Leaflet coordinates
    const boundaryCoordinates = useMemo((): any | null => {
        if (!activePreview?.boundary_geojson || !activePreview.is_valid) {
            return null;
        }

        try {
            const geojson = activePreview.boundary_geojson;

            // Handle GeoJSON Polygon
            if (geojson.type === 'Polygon' && geojson.coordinates?.[0]) {
                return geojson.coordinates[0].map(([lng, lat]: [number, number]) => [lat, lng]);
            }

            // Handle Feature with Polygon geometry
            if (geojson.type === 'Feature' && geojson.geometry?.type === 'Polygon') {
                return geojson.geometry.coordinates[0].map(([lng, lat]: [number, number]) => [lat, lng]);
            }

            return null;
        } catch (error) {
            console.warn('Failed to parse territory boundary GeoJSON:', error);
            return null;
        }
    }, [activePreview?.boundary_geojson, activePreview?.is_valid]);

    // Calculate conflict styling
    const conflictStyling = useMemo(() => {
        if (!activePreview?.conflicts?.length) {
            return finalStyling;
        }

        const hasConflicts = activePreview.conflicts.length > 0;
        const hasMajorConflicts = activePreview.conflicts.some(c => c.conflict_type === 'major' || c.conflict_type === 'complete');

        if (hasMajorConflicts) {
            return {
                ...finalStyling,
                fillColor: finalStyling.conflictColor,
                borderColor: finalStyling.conflictColor,
                fillOpacity: 0.3,
                borderOpacity: 1,
            };
        }

        if (hasConflicts) {
            return {
                ...finalStyling,
                fillColor: '#f59e0b', // amber-500
                borderColor: '#d97706', // amber-600
                fillOpacity: 0.25,
                borderOpacity: 0.9,
            };
        }

        return finalStyling;
    }, [activePreview?.conflicts, finalStyling]);

    // Format area for display
    const formattedArea = useMemo(() => {
        if (!activePreview?.area_square_meters) return null;

        const sqm = activePreview.area_square_meters;

        if (sqm >= 1000000) {
            return `${(sqm / 1000000).toFixed(2)} km²`;
        } else if (sqm >= 10000) {
            return `${(sqm / 10000).toFixed(2)} ha`;
        } else {
            return `${sqm.toFixed(0)} m²`;
        }
    }, [activePreview?.area_square_meters]);

    // Generate tooltip content
    const tooltipContent = useMemo(() => {
        if (!activePreview) return null;

        const parts = [];

        if (formattedArea) {
            parts.push(`Area: ${formattedArea}`);
        }

        if (activePreview.conflicts?.length > 0) {
            parts.push(`Conflicts: ${activePreview.conflicts.length}`);
        }

        if (!activePreview.eligible_for_claiming) {
            parts.push('Not eligible for claiming');
        }

        if (activePreview.preview_type !== 'valid') {
            parts.push(`Status: ${activePreview.preview_type.replace('_', ' ')}`);
        }

        return parts.length > 0 ? parts.join('\n') : 'Territory Preview';
    }, [activePreview, formattedArea]);

    // Handle pulse animation
    useEffect(() => {
        if (!finalAnimation.enabled || !visible || !boundaryCoordinates) {
            return;
        }

        const interval = setInterval(() => {
            setPulsePhase(prev => (prev + 1) % 4);
        }, finalAnimation.pulseSpeed / 4);

        return () => clearInterval(interval);
    }, [finalAnimation.enabled, finalAnimation.pulseSpeed, visible, boundaryCoordinates]);

    // Handle preview click
    const handlePreviewClick = () => {
        if (activePreview && onPreviewClick) {
            onPreviewClick(activePreview);
        }
    };

    // Don't render if not visible or no valid boundary
    if (!visible || !boundaryCoordinates || !activePreview?.is_valid) {
        return null;
    }

    // Calculate animated opacity for pulse effect
    const animatedOpacity = finalAnimation.enabled
        ? conflictStyling.fillOpacity * (0.7 + 0.3 * Math.sin(pulsePhase * Math.PI / 2))
        : conflictStyling.fillOpacity;

    return (
        <Polygon
            positions={boundaryCoordinates}
            pathOptions={{
                fillColor: conflictStyling.fillColor,
                color: conflictStyling.borderColor,
                fillOpacity: animatedOpacity,
                opacity: conflictStyling.borderOpacity,
                weight: conflictStyling.borderWeight,
                dashArray: activePreview.conflicts?.length > 0 ? '10, 5' : undefined,
            }}
            eventHandlers={{
                click: handlePreviewClick,
            }}
            className={cn(
                'territory-preview-polygon',
                isLoading && 'territory-preview-loading',
                activePreview.conflicts?.length > 0 && 'territory-preview-conflicts',
                className
            )}
        >
            {tooltipContent && (
                <Tooltip
                    direction="top"
                    offset={[0, -10]}
                    opacity={0.9}
                    className="territory-preview-tooltip"
                >
                    <div className="text-sm">
                        <div className="font-medium mb-1">Territory Preview</div>
                        <div className="whitespace-pre-line text-xs">
                            {tooltipContent}
                        </div>
                    </div>
                </Tooltip>
            )}
        </Polygon>
    );
}

/**
 * Hook for managing territory preview state and animations
 */
export function useTerritoryPreview(options: {
    enabled?: boolean;
    animationSpeed?: number;
    conflictHighlighting?: boolean;
} = {}) {
    const [isVisible, setIsVisible] = useState(options.enabled ?? true);
    const [animationEnabled, setAnimationEnabled] = useState(true);

    const toggleVisibility = () => setIsVisible(prev => !prev);
    const toggleAnimation = () => setAnimationEnabled(prev => !prev);

    return {
        isVisible,
        animationEnabled,
        toggleVisibility,
        toggleAnimation,
        setIsVisible,
        setAnimationEnabled,
    };
}

/**
 * Utility function to calculate territory preview quality score
 */
export function calculatePreviewQuality(preview: TerritoryPreviewType | null): {
    score: number;
    quality: 'poor' | 'fair' | 'good' | 'excellent';
    issues: string[];
} {
    if (!preview) {
        return { score: 0, quality: 'poor', issues: ['No preview data'] };
    }

    let score = 0;
    const issues: string[] = [];

    // Base validity check
    if (preview.is_valid) {
        score += 40;
    } else {
        issues.push('Invalid territory boundary');
    }

    // Area size check
    if (preview.area_square_meters > 0) {
        score += 20;
        if (preview.area_square_meters < 100) {
            issues.push('Territory too small');
            score -= 10;
        } else if (preview.area_square_meters > 10000000) {
            issues.push('Territory very large');
            score -= 5;
        }
    }

    // Conflict analysis
    if (preview.conflicts?.length === 0) {
        score += 20;
    } else if (preview.conflicts?.length > 0) {
        const majorConflicts = preview.conflicts.filter(c =>
            c.conflict_type === 'major' || c.conflict_type === 'complete'
        ).length;

        if (majorConflicts > 0) {
            issues.push(`${majorConflicts} major conflicts`);
            score -= majorConflicts * 10;
        } else {
            issues.push(`${preview.conflicts.length} minor conflicts`);
            score -= preview.conflicts.length * 5;
        }
    }

    // Eligibility check
    if (preview.eligible_for_claiming) {
        score += 20;
    } else {
        issues.push('Not eligible for claiming');
    }

    // Normalize score
    score = Math.max(0, Math.min(100, score));

    // Determine quality level
    let quality: 'poor' | 'fair' | 'good' | 'excellent';
    if (score >= 80) quality = 'excellent';
    else if (score >= 60) quality = 'good';
    else if (score >= 40) quality = 'fair';
    else quality = 'poor';

    return { score, quality, issues };
}