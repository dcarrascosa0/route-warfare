import React, { useEffect, useState, useMemo } from 'react';
import { Marker, Circle } from 'react-leaflet';
import L from 'leaflet';
import { cn } from '@/lib/utils';
import './AnimatedCurrentPosition.css';

// Props interface for the AnimatedCurrentPosition component
export interface AnimatedCurrentPositionProps {
  position: GeolocationPosition;
  previousPosition?: GeolocationPosition;
  accuracy: number;
  isTracking: boolean;
  animationDuration?: number;
  className?: string;
}

// GPS quality thresholds
const GPS_QUALITY = {
  EXCELLENT: 5,
  GOOD: 10,
  FAIR: 20,
  POOR: 50,
} as const;

// Animation configuration
const ANIMATION_CONFIG = {
  PULSE_DURATION: 2000,
  TRANSITION_DURATION: 500,
  ACCURACY_CIRCLE_MIN_OPACITY: 0.1,
  ACCURACY_CIRCLE_MAX_OPACITY: 0.3,
} as const;

/**
 * AnimatedCurrentPosition Component
 * 
 * Displays the user's current position with smooth animations, directional indicators,
 * and GPS accuracy visualization. Provides visual feedback for GPS signal quality
 * and tracking status.
 */
export default function AnimatedCurrentPosition({
  position,
  previousPosition,
  accuracy,
  isTracking,
  animationDuration = ANIMATION_CONFIG.TRANSITION_DURATION,
  className,
}: AnimatedCurrentPositionProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showPulse, setShowPulse] = useState(true);

  // Calculate GPS quality level
  const gpsQuality = useMemo(() => {
    if (accuracy <= GPS_QUALITY.EXCELLENT) return 'excellent';
    if (accuracy <= GPS_QUALITY.GOOD) return 'good';
    if (accuracy <= GPS_QUALITY.FAIR) return 'fair';
    return 'poor';
  }, [accuracy]);

  // Calculate movement bearing if previous position is available
  const bearing = useMemo(() => {
    if (!previousPosition || !position) return null;

    const lat1 = previousPosition.coords.latitude * Math.PI / 180;
    const lat2 = position.coords.latitude * Math.PI / 180;
    const deltaLon = (position.coords.longitude - previousPosition.coords.longitude) * Math.PI / 180;

    const x = Math.sin(deltaLon) * Math.cos(lat2);
    const y = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);

    const bearingRad = Math.atan2(x, y);
    const bearingDeg = (bearingRad * 180 / Math.PI + 360) % 360;

    return bearingDeg;
  }, [position, previousPosition]);

  // Calculate distance moved to determine if we should show directional indicator
  const hasSignificantMovement = useMemo(() => {
    if (!previousPosition || !position) return false;

    const distance = calculateDistance(
      previousPosition.coords.latitude,
      previousPosition.coords.longitude,
      position.coords.latitude,
      position.coords.longitude
    );

    // Show directional indicator if moved more than 5 meters
    return distance > 5;
  }, [position, previousPosition]);

  // Create custom marker icon with pulsing animation and directional indicator
  const createMarkerIcon = useMemo(() => {
    const size = isTracking ? 24 : 20;
    const pulseSize = size + 8;
    
    // Color based on GPS quality and tracking status
    const getMarkerColor = () => {
      if (!isTracking) return '#6b7280'; // gray-500
      
      switch (gpsQuality) {
        case 'excellent': return '#10b981'; // emerald-500
        case 'good': return '#3b82f6'; // blue-500
        case 'fair': return '#f59e0b'; // amber-500
        case 'poor': return '#ef4444'; // red-500
        default: return '#6b7280';
      }
    };

    const markerColor = getMarkerColor();
    const directionArrow = hasSignificantMovement && bearing !== null ? 
      `<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" 
             fill="white" 
             stroke="${markerColor}" 
             stroke-width="1" 
             transform="rotate(${bearing} 12 12)"/>` : '';

    const svgIcon = `
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          ${showPulse && isTracking ? `
            <style>
              .pulse-ring {
                animation: pulse ${ANIMATION_CONFIG.PULSE_DURATION}ms ease-out infinite;
              }
              @keyframes pulse {
                0% {
                  transform: scale(0.8);
                  opacity: 1;
                }
                100% {
                  transform: scale(2);
                  opacity: 0;
                }
              }
            </style>
          ` : ''}
        </defs>
        
        ${showPulse && isTracking ? `
          <circle 
            cx="12" 
            cy="12" 
            r="6" 
            fill="none" 
            stroke="${markerColor}" 
            stroke-width="2" 
            class="pulse-ring"
          />
        ` : ''}
        
        <circle 
          cx="12" 
          cy="12" 
          r="8" 
          fill="${markerColor}" 
          stroke="white" 
          stroke-width="2"
          filter="url(#glow)"
        />
        
        <circle 
          cx="12" 
          cy="12" 
          r="4" 
          fill="white"
        />
        
        ${directionArrow}
      </svg>
    `;

    return L.divIcon({
      html: svgIcon,
      className: cn(
        'animated-position-marker',
        isAnimating && 'transitioning',
        className
      ),
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }, [isTracking, gpsQuality, bearing, hasSignificantMovement, showPulse, isAnimating, className]);

  // Calculate accuracy circle properties
  const accuracyCircleProps = useMemo(() => {
    if (!position) return null;
    
    const opacity = Math.max(
      ANIMATION_CONFIG.ACCURACY_CIRCLE_MIN_OPACITY,
      Math.min(
        ANIMATION_CONFIG.ACCURACY_CIRCLE_MAX_OPACITY,
        1 - (accuracy / 100) // Better accuracy = more opaque
      )
    );

    const color = (() => {
      switch (gpsQuality) {
        case 'excellent': return '#10b981';
        case 'good': return '#3b82f6';
        case 'fair': return '#f59e0b';
        case 'poor': return '#ef4444';
        default: return '#6b7280';
      }
    })();

    return {
      center: [position.coords.latitude, position.coords.longitude] as [number, number],
      radius: accuracy,
      pathOptions: {
        color,
        fillColor: color,
        fillOpacity: opacity * 0.2,
        opacity: opacity,
        weight: 2,
        dashArray: gpsQuality === 'poor' ? '5, 5' : undefined,
      },
    };
  }, [position, accuracy, gpsQuality]);

  // Handle position changes with smooth transitions
  useEffect(() => {
    if (previousPosition && position) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, animationDuration);

      return () => clearTimeout(timer);
    }
  }, [position, previousPosition, animationDuration]);

  // Manage pulse animation visibility
  useEffect(() => {
    if (!isTracking) {
      setShowPulse(false);
      return;
    }

    setShowPulse(true);
    
    // Temporarily disable pulse during transitions for smoother animation
    if (isAnimating) {
      setShowPulse(false);
      const timer = setTimeout(() => {
        setShowPulse(true);
      }, animationDuration);

      return () => clearTimeout(timer);
    }
  }, [isTracking, isAnimating, animationDuration]);

  if (!position) {
    return null;
  }

  const currentLatLng: [number, number] = [
    position.coords.latitude,
    position.coords.longitude
  ];

  return (
    <>
      {/* GPS Accuracy Circle */}
      {accuracy > 0 && accuracyCircleProps && (
        <Circle
          center={accuracyCircleProps.center}
          radius={accuracyCircleProps.radius}
          pathOptions={accuracyCircleProps.pathOptions}
        />
      )}

      {/* Current Position Marker */}
      <Marker
        position={currentLatLng}
        icon={createMarkerIcon}
        zIndexOffset={1000} // Ensure marker appears above other elements
      />
    </>
  );
}

/**
 * Utility function to calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}