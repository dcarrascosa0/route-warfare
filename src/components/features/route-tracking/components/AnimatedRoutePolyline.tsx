import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { cn } from '@/lib/utils';
import type { Coordinate } from '@/lib/api/types/common';
import './AnimatedRoutePolyline.css';

// Props interface for the AnimatedRoutePolyline component
export interface AnimatedRoutePolylineProps {
  coordinates: Coordinate[];
  status: 'active' | 'completed' | 'cancelled';
  isClosedLoop: boolean;
  animationSpeed?: number;
  gradientColors?: string[];
  className?: string;
  onPathComplete?: () => void;
}

// Animation configuration
const ANIMATION_CONFIG = {
  DEFAULT_SPEED: 300, // milliseconds per coordinate
  GROWTH_DELAY: 50, // delay between coordinate additions
  CLOSED_LOOP_PULSE_DURATION: 3000,
  PERFORMANCE_THRESHOLD: 500, // coordinates count for performance optimization
  SAMPLING_RATE: 0.3, // keep 30% of coordinates when optimizing
} as const;

// Route styling configuration
const ROUTE_STYLES = {
  active: {
    weight: 4,
    opacity: 0.8,
    lineCap: 'round' as const,
    lineJoin: 'round' as const,
  },
  completed: {
    weight: 3,
    opacity: 0.6,
    lineCap: 'round' as const,
    lineJoin: 'round' as const,
  },
  cancelled: {
    weight: 2,
    opacity: 0.4,
    lineCap: 'round' as const,
    lineJoin: 'round' as const,
    dashArray: '5, 10',
  },
} as const;

// Default gradient colors
const DEFAULT_GRADIENT_COLORS = {
  active: ['#3b82f6', '#10b981'], // blue to emerald
  completed: ['#6b7280', '#374151'], // gray gradient
  cancelled: ['#ef4444', '#dc2626'], // red gradient
} as const;

/**
 * AnimatedRoutePolyline Component
 * 
 * Renders the route path with dynamic styling, gradient coloring, and smooth growth animations.
 * Provides special styling for closed loops and optimizes performance for long routes.
 */
export default function AnimatedRoutePolyline({
  coordinates,
  status,
  isClosedLoop,
  animationSpeed = ANIMATION_CONFIG.DEFAULT_SPEED,
  gradientColors,
  className,
  onPathComplete,
}: AnimatedRoutePolylineProps) {
  const map = useMap();
  const [visibleCoordinates, setVisibleCoordinates] = useState<Coordinate[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showClosedLoopPulse, setShowClosedLoopPulse] = useState(false);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousCoordinatesLengthRef = useRef(0);

  // Optimize coordinates for performance if needed
  const optimizedCoordinates = useMemo(() => {
    if (coordinates.length <= ANIMATION_CONFIG.PERFORMANCE_THRESHOLD) {
      return coordinates;
    }

    // Sample coordinates to improve performance while maintaining route shape
    const samplingInterval = Math.ceil(1 / ANIMATION_CONFIG.SAMPLING_RATE);
    const sampled: Coordinate[] = [];
    
    // Always include first coordinate
    if (coordinates.length > 0) {
      sampled.push(coordinates[0]);
    }

    // Sample intermediate coordinates
    for (let i = samplingInterval; i < coordinates.length - 1; i += samplingInterval) {
      sampled.push(coordinates[i]);
    }

    // Always include last coordinate
    if (coordinates.length > 1) {
      sampled.push(coordinates[coordinates.length - 1]);
    }

    return sampled;
  }, [coordinates]);

  // Get gradient colors based on status
  const routeGradientColors = useMemo(() => {
    if (gradientColors) return gradientColors;
    return DEFAULT_GRADIENT_COLORS[status] || DEFAULT_GRADIENT_COLORS.active;
  }, [gradientColors, status]);

  // Create gradient polyline segments for smooth color transition
  const gradientSegments = useMemo(() => {
    if (visibleCoordinates.length < 2) return [];

    const segments: Array<{
      coordinates: [number, number][];
      color: string;
      pathOptions: L.PolylineOptions;
    }> = [];

    const totalSegments = visibleCoordinates.length - 1;
    const [startColor, endColor] = routeGradientColors;

    for (let i = 0; i < totalSegments; i++) {
      const progress = totalSegments > 1 ? i / (totalSegments - 1) : 0;
      
      // Interpolate color between start and end
      const color = interpolateColor(startColor, endColor, progress);
      
      // Create segment coordinates
      const segmentCoords: [number, number][] = [
        [visibleCoordinates[i].latitude, visibleCoordinates[i].longitude],
        [visibleCoordinates[i + 1].latitude, visibleCoordinates[i + 1].longitude],
      ];

      // Create path options with special styling for closed loops
      const baseStyle = ROUTE_STYLES[status];
      const pathOptions: L.PolylineOptions = {
        ...baseStyle,
        color,
        className: cn(
          'animated-route-segment',
          isClosedLoop && 'closed-loop',
          showClosedLoopPulse && isClosedLoop && 'pulsing',
          className
        ),
      };

      // Add special styling for closed loop segments
      if (isClosedLoop && status === 'active') {
        pathOptions.weight = (baseStyle.weight || 4) + 1;
        pathOptions.opacity = (baseStyle.opacity || 0.8) + 0.1;
      }

      segments.push({
        coordinates: segmentCoords,
        color,
        pathOptions,
      });
    }

    return segments;
  }, [visibleCoordinates, routeGradientColors, status, isClosedLoop, showClosedLoopPulse, className]);

  // Handle coordinate animation when new coordinates are added
  useEffect(() => {
    const currentLength = optimizedCoordinates.length;
    const previousLength = previousCoordinatesLengthRef.current;

    // Only animate if coordinates were added (not removed or replaced) and status is active
    if (currentLength > previousLength && status === 'active' && previousLength > 0) {
      setIsAnimating(true);

      // Clear any existing animation
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }

      // Animate coordinate addition
      const animateCoordinates = (startIndex: number) => {
        if (startIndex >= currentLength) {
          setIsAnimating(false);
          onPathComplete?.();
          return;
        }

        setVisibleCoordinates(optimizedCoordinates.slice(0, startIndex + 1));

        animationTimeoutRef.current = setTimeout(() => {
          animateCoordinates(startIndex + 1);
        }, ANIMATION_CONFIG.GROWTH_DELAY);
      };

      // Start animation from where we left off
      animateCoordinates(Math.max(previousLength, 1));
    } else {
      // No animation needed, show all coordinates immediately
      setVisibleCoordinates(optimizedCoordinates);
      setIsAnimating(false);
    }

    previousCoordinatesLengthRef.current = currentLength;

    // Cleanup timeout on unmount or coordinate change
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [optimizedCoordinates, status, onPathComplete]);

  // Handle closed loop pulse animation
  useEffect(() => {
    if (isClosedLoop && status === 'active' && !isAnimating) {
      setShowClosedLoopPulse(true);

      const pulseInterval = setInterval(() => {
        setShowClosedLoopPulse(prev => !prev);
      }, ANIMATION_CONFIG.CLOSED_LOOP_PULSE_DURATION);

      return () => clearInterval(pulseInterval);
    } else {
      setShowClosedLoopPulse(false);
    }
  }, [isClosedLoop, status, isAnimating]);

  // Auto-fit map bounds when route is completed or significantly changed
  useEffect(() => {
    if (status === 'completed' && visibleCoordinates.length > 1) {
      const bounds = L.latLngBounds(
        visibleCoordinates.map(coord => [coord.latitude, coord.longitude])
      );
      
      // Add padding and fit bounds
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [status, visibleCoordinates, map]);

  // Don't render if no coordinates
  if (visibleCoordinates.length < 2) {
    return null;
  }

  return (
    <>
      {gradientSegments.map((segment, index) => (
        <Polyline
          key={`route-segment-${index}`}
          positions={segment.coordinates}
          pathOptions={segment.pathOptions}
        />
      ))}
    </>
  );
}

/**
 * Interpolate between two hex colors
 */
function interpolateColor(color1: string, color2: string, factor: number): string {
  // Remove # if present
  const c1 = color1.replace('#', '');
  const c2 = color2.replace('#', '');

  // Parse hex colors
  const r1 = parseInt(c1.substring(0, 2), 16);
  const g1 = parseInt(c1.substring(2, 4), 16);
  const b1 = parseInt(c1.substring(4, 6), 16);

  const r2 = parseInt(c2.substring(0, 2), 16);
  const g2 = parseInt(c2.substring(2, 4), 16);
  const b2 = parseInt(c2.substring(4, 6), 16);

  // Interpolate
  const r = Math.round(r1 + (r2 - r1) * factor);
  const g = Math.round(g1 + (g2 - g1) * factor);
  const b = Math.round(b1 + (b2 - b1) * factor);

  // Convert back to hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}