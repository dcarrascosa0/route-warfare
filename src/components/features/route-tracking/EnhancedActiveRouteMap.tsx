import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapControls } from '@/components/common/MapControls';
import { Maximize2, Minimize2, RotateCcw, ZoomIn, ZoomOut, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import MapPanes from './components/MapPanes';
import MapResizeFix from './components/MapResizeFix';
import AnimatedCurrentPosition from './components/AnimatedCurrentPosition';
import AnimatedRoutePolyline from './components/AnimatedRoutePolyline';
import TerritoryPreview from '../territory/TerritoryPreview';
import TerritoryAreaDisplay from '../territory/TerritoryAreaDisplay';
import { calculateBounds, calculateCenter, TILE_DARK_WITH_LABELS } from './utils/mapUtils';
import { useTerritoryPreviewManager } from '@/hooks/useTerritoryPreview';
import { useTerritoryContext } from '@/contexts/TerritoryContext';
import type { RouteDetail } from '@/lib/api/types/routes';
import type { Coordinate } from '@/lib/api/types/common';
import L from 'leaflet'; // no named type imports
import 'leaflet/dist/leaflet.css';
import '../territory/TerritoryPreview.css';

type LeafletMap = ReturnType<typeof L.map>;
type LeafletBounds = ReturnType<typeof L.latLngBounds>;

// Enhanced GPS Coordinate interface with additional fields for enhanced experience
export interface EnhancedGPSCoordinate extends Coordinate {
    distanceFromStart?: number;
    segmentDistance?: number;
    qualityScore?: number;
    interpolated?: boolean;
}

// Map view state interface
export interface MapViewState {
    center: [number, number];
    zoom: number;
    bounds: LeafletBounds | null;
    isFullscreen: boolean;
    followMode: boolean;
    selectedLayers: string[];
    animationsEnabled: boolean;
}

// Animation configuration interface
export interface AnimationConfig {
    routeGrowthSpeed: number;
    markerTransitionDuration: number;
    statsUpdateDuration: number;
    pulseAnimationSpeed: number;
    enableReducedMotion: boolean;
}

// Route statistics interface
export interface RouteStats {
    distance: number;
    duration: number;
    currentSpeed: number;
    averageSpeed: number;
    maxSpeed: number;
    coordinateCount: number;
    isClosedLoop: boolean;
    gpsAccuracy: number;
    territoryArea?: number;
}

// Enhanced Active Route Map Props
export interface EnhancedActiveRouteMapProps {
    userId: string;
    activeRoute: RouteDetail;
    currentLocation: GeolocationPosition | null;
    onRouteUpdate?: (coordinates: Coordinate[]) => void;
    onComplete?: () => void;
    onPause?: () => void;
    onResume?: () => void;
    className?: string;
    height?: string;
    fullscreenEnabled?: boolean;
    territoryPreviewEnabled?: boolean;
    onTerritoryPreviewClick?: (preview: any) => void;
}

// Default animation configuration
const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
    routeGrowthSpeed: 300,
    markerTransitionDuration: 500,
    statsUpdateDuration: 300,
    pulseAnimationSpeed: 2000,
    enableReducedMotion: false,
};

// Default map view state
const DEFAULT_MAP_VIEW: Omit<MapViewState, 'center' | 'bounds'> = {
    zoom: 16,
    isFullscreen: false,
    followMode: true,
    selectedLayers: ['base'],
    animationsEnabled: true,
};

export default function EnhancedActiveRouteMap({
    userId,
    activeRoute,
    currentLocation,
    onRouteUpdate,
    onComplete,
    onPause,
    onResume,
    className = '',
    height = '400px',
    fullscreenEnabled = true,
    territoryPreviewEnabled = true,
    onTerritoryPreviewClick,
}: EnhancedActiveRouteMapProps) {
    // Map view state management
    const [mapViewState, setMapViewState] = useState<MapViewState>(() => {
        const coordinates = activeRoute.coordinates;
        let center: [number, number] = [0, 0];
        let bounds: LeafletBounds | null = null;

        if (coordinates.length > 0) {
            const calculatedCenter = calculateCenter(coordinates, activeRoute.status);
            const calculatedBounds = calculateBounds(coordinates);
            if (calculatedCenter) center = calculatedCenter;
            if (calculatedBounds) bounds = calculatedBounds;
        } else if (currentLocation) {
            center = [currentLocation.coords.latitude, currentLocation.coords.longitude];
            const pad = 0.005;
            bounds = L.latLngBounds(
                [center[0] - pad, center[1] - pad],
                [center[0] + pad, center[1] + pad]
            );
        }

        return {
            ...DEFAULT_MAP_VIEW,
            center,
            bounds,
        };
    });

    // Animation configuration state
    const [animationConfig] = useState<AnimationConfig>(DEFAULT_ANIMATION_CONFIG);

    // Map instance reference
    const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);

    // Fullscreen state management
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Previous location for smooth transitions
    const [previousLocation, setPreviousLocation] = useState<GeolocationPosition | null>(null);

    // Territory preview state
    const [territoryPreviewVisible, setTerritoryPreviewVisible] = useState(territoryPreviewEnabled);

    // Enhanced coordinates with additional metadata
    const enhancedCoordinates = useMemo((): EnhancedGPSCoordinate[] => {
        return activeRoute.coordinates.map((coord, index) => {
            // Calculate distance from start
            let distanceFromStart = 0;
            let segmentDistance = 0;

            if (index > 0) {
                const prevCoord = activeRoute.coordinates[index - 1];
                segmentDistance = calculateDistance(
                    prevCoord.latitude,
                    prevCoord.longitude,
                    coord.latitude,
                    coord.longitude
                );

                // Sum up all previous segments
                for (let i = 1; i <= index; i++) {
                    const prev = activeRoute.coordinates[i - 1];
                    const curr = activeRoute.coordinates[i];
                    distanceFromStart += calculateDistance(
                        prev.latitude,
                        prev.longitude,
                        curr.latitude,
                        curr.longitude
                    );
                }
            }

            // Calculate GPS quality score based on accuracy
            const qualityScore = coord.accuracy ? Math.max(0, 100 - coord.accuracy) : 50;

            return {
                ...coord,
                distanceFromStart,
                segmentDistance,
                qualityScore,
                interpolated: false,
            };
        });
    }, [activeRoute.coordinates]);

    // Territory context for real-time updates
    const territoryContext = useTerritoryContext();

    // Territory preview data management
    const territoryPreview = useTerritoryPreviewManager(
        activeRoute.id,
        userId,
        enhancedCoordinates,
        {
            enableRealTime: territoryPreviewEnabled && territoryPreviewVisible,
            enableRoutePreview: territoryPreviewEnabled,
            realTimeDebounce: 2000, // 2 second debounce for real-time updates (increased to prevent server overload)
            refetchInterval: 30000, // 30 second refresh for route preview
        }
    );

    // Calculate route statistics
    const routeStats = useMemo((): RouteStats => {
        const coordinates = enhancedCoordinates;

        if (coordinates.length < 2) {
            return {
                distance: 0,
                duration: 0,
                currentSpeed: 0,
                averageSpeed: 0,
                maxSpeed: 0,
                coordinateCount: coordinates.length,
                isClosedLoop: false,
                gpsAccuracy: currentLocation?.coords.accuracy || 0,
            };
        }

        const distance = coordinates[coordinates.length - 1]?.distanceFromStart || 0;

        // Calculate duration from first to last coordinate
        const startTime = new Date(coordinates[0].timestamp).getTime();
        const endTime = new Date(coordinates[coordinates.length - 1].timestamp).getTime();
        const duration = endTime - startTime;

        // Calculate speeds
        const speeds = coordinates
            .filter(coord => coord.speed !== null && coord.speed !== undefined)
            .map(coord => (coord.speed || 0) * 3.6); // convert m/s to km/h

        const currentSpeed = currentLocation?.coords.speed ? currentLocation.coords.speed * 3.6 : 0;
        const averageSpeed = duration > 0 ? (distance / (duration / 1000)) * 3.6 : 0;
        const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;

        // Check if route forms a closed loop
        const isClosedLoop = coordinates.length >= 4 &&
            calculateDistance(
                coordinates[0].latitude,
                coordinates[0].longitude,
                coordinates[coordinates.length - 1].latitude,
                coordinates[coordinates.length - 1].longitude
            ) < 100; // Within 100 meters (increased threshold for better detection)

        return {
            distance,
            duration,
            currentSpeed,
            averageSpeed,
            maxSpeed,
            coordinateCount: coordinates.length,
            isClosedLoop,
            gpsAccuracy: currentLocation?.coords.accuracy || 0,
            territoryArea: territoryPreview.preview?.area_square_meters || 0,
        };
    }, [enhancedCoordinates, currentLocation]);

    // Handle fullscreen toggle
    const handleFullscreenToggle = useCallback(() => {
        if (!fullscreenEnabled) return;

        setIsFullscreen(prev => {
            const newFullscreen = !prev;
            setMapViewState(prevState => ({
                ...prevState,
                isFullscreen: newFullscreen,
            }));

            // Trigger map resize after fullscreen change
            setTimeout(() => {
                if (mapInstance) {
                    mapInstance.invalidateSize();
                }
            }, 100);

            return newFullscreen;
        });
    }, [fullscreenEnabled, mapInstance]);

    // Handle zoom controls
    const handleZoomIn = useCallback(() => {
        if (mapInstance) {
            mapInstance.zoomIn();
        }
    }, [mapInstance]);

    const handleZoomOut = useCallback(() => {
        if (mapInstance) {
            mapInstance.zoomOut();
        }
    }, [mapInstance]);

    // Handle auto-fit to route bounds
    const handleAutoFit = useCallback(() => {
        if (mapInstance && mapViewState.bounds) {
            mapInstance.fitBounds(mapViewState.bounds, { padding: [20, 20] });
        }
    }, [mapInstance, mapViewState.bounds]);

    // Handle territory preview toggle
    const handleTerritoryPreviewToggle = useCallback(() => {
        setTerritoryPreviewVisible(prev => !prev);
    }, []);

    // Handle territory preview click
    const handleTerritoryPreviewClick = useCallback((preview: any) => {
        if (onTerritoryPreviewClick) {
            onTerritoryPreviewClick(preview);
        }
    }, [onTerritoryPreviewClick]);

    // Update map view when route coordinates change
    useEffect(() => {
        const coordinates = activeRoute.coordinates;

        if (coordinates.length > 0) {
            const center = calculateCenter(coordinates, activeRoute.status);
            const bounds = calculateBounds(coordinates);

            if (center && bounds) {
                setMapViewState(prevState => ({
                    ...prevState,
                    center,
                    bounds,
                }));
            }
        } else if (currentLocation) {
            const center: [number, number] = [
                currentLocation.coords.latitude,
                currentLocation.coords.longitude
            ];
            const pad = 0.005;
            const bounds = L.latLngBounds(
                [center[0] - pad, center[1] - pad],
                [center[0] + pad, center[1] + pad]
            );

            setMapViewState(prevState => ({
                ...prevState,
                center,
                bounds,
            }));
        }
    }, [activeRoute.coordinates, currentLocation]);

    // Handle map instance creation
    const handleMapCreated = useCallback((map: LeafletMap) => {
        setMapInstance(map);
    }, []);

    // Track location changes for smooth transitions
    useEffect(() => {
        if (currentLocation) {
            setPreviousLocation(prev => {
                // Only update if location has actually changed significantly
                if (!prev) return currentLocation;

                const distance = calculateDistance(
                    prev.coords.latitude,
                    prev.coords.longitude,
                    currentLocation.coords.latitude,
                    currentLocation.coords.longitude
                );

                // Update previous location if moved more than 1 meter
                return distance > 1 ? prev : currentLocation;
            });
        }
    }, [currentLocation]);

    // Update territory preview when coordinates change significantly
    useEffect(() => {
        if (territoryPreviewEnabled && territoryPreviewVisible && enhancedCoordinates.length >= 3) {
            // Check if route is now a closed loop for immediate update
            const isClosedLoop = routeStats.isClosedLoop;
            
            if (isClosedLoop) {
                // Immediate update for closed loops
                territoryPreview.updateRealTimePreview(true);
            } else {
                // Debounce the update to avoid excessive API calls for open routes
                const timeoutId = setTimeout(() => {
                    territoryPreview.updateRealTimePreview();
                }, 2000);

                return () => clearTimeout(timeoutId);
            }
        }
    }, [enhancedCoordinates.length, routeStats.isClosedLoop, territoryPreviewEnabled, territoryPreviewVisible, territoryPreview]);

    // Refresh territory preview when territory updates are received via WebSocket
    useEffect(() => {
        if (territoryPreviewEnabled && territoryContext.lastUpdate) {
            // Refresh the route-based preview when territories change
            territoryPreview.refreshRoutePreview();
        }
    }, [territoryContext.lastUpdate, territoryPreviewEnabled, territoryPreview]);

    // Render map controls
    const renderMapControls = () => (
        <MapControls
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onFit={handleAutoFit}
            onRecenter={handleAutoFit}
            onToggleLayer={handleTerritoryPreviewToggle}
            fullscreenEnabled={fullscreenEnabled}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleFullscreenToggle}
        />
    );

    // Calculate container styles
    const containerStyles = useMemo(() => {
        if (isFullscreen) {
            return {
                position: 'fixed' as const,
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 9999,
                height: '100vh',
                width: '100vw',
            };
        }

        return {
            height,
            width: '100%',
        };
    }, [isFullscreen, height]);

    if (!mapViewState.center || !mapViewState.bounds) {
        return (
            <div
                className={cn(
                    "flex items-center justify-center bg-gray-100 rounded-lg",
                    className
                )}
                style={containerStyles}
            >
                <p className="text-gray-500">Loading map...</p>
            </div>
        );
    }

    return (
        <div
            className={cn(
                "relative rounded-lg overflow-hidden",
                isFullscreen && "rounded-none",
                className
            )}
            style={containerStyles}
        >
            <MapContainer
                center={mapViewState.center}
                bounds={mapViewState.bounds}
                className="w-full h-full"
                zoomControl={false}
                whenCreated={handleMapCreated}
            >
                <MapPanes />
                <MapResizeFix />

                <TileLayer
                    url={TILE_DARK_WITH_LABELS}
                    attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                    pane="base"
                />

                {/* Animated Route Path */}
                {enhancedCoordinates.length > 1 && (
                    <AnimatedRoutePolyline
                        coordinates={enhancedCoordinates}
                        status={activeRoute.status}
                        isClosedLoop={routeStats.isClosedLoop}
                        animationSpeed={animationConfig.routeGrowthSpeed}
                        className="route-polyline"
                    />
                )}

                {/* Animated Current Position Marker */}
                {currentLocation && (
                    <AnimatedCurrentPosition
                        position={currentLocation}
                        previousPosition={previousLocation}
                        accuracy={currentLocation.coords.accuracy || 0}
                        isTracking={activeRoute.status === 'active'}
                        animationDuration={animationConfig.markerTransitionDuration}
                    />
                )}

                {/* Territory Preview Overlay */}
                {territoryPreviewEnabled && territoryPreviewVisible && territoryPreview.preview && (
                    <TerritoryPreview
                        preview={territoryPreview.preview}
                        isLoading={territoryPreview.isLoading}
                        visible={territoryPreviewVisible}
                        animationConfig={{
                            enabled: animationConfig.enableReducedMotion ? false : mapViewState.animationsEnabled,
                            duration: animationConfig.statsUpdateDuration,
                            pulseSpeed: animationConfig.pulseAnimationSpeed,
                        }}
                        onPreviewClick={handleTerritoryPreviewClick}
                    />
                )}

                {/* TODO: Add additional route visualization components here in future tasks */}
                {/* - RouteMarkers */}
                {/* - GPSAccuracyIndicator */}
            </MapContainer>

            {/* Map Controls */}
            {renderMapControls()}

            {/* Territory Area Display */}
            {territoryPreviewEnabled && territoryPreviewVisible && (
                <TerritoryAreaDisplay
                    preview={territoryPreview.preview}
                    isLoading={territoryPreview.isLoading}
                    position="top-left"
                    showConflicts={true}
                    connectionStatus={{
                        isConnected: territoryContext.isConnected,
                        error: territoryContext.connectionError,
                        lastUpdate: territoryContext.lastUpdate,
                    }}
                />
            )}

            {/* TODO: Add floating components here in future tasks */}
            {/* - FloatingStatsPanel */}
            {/* - InteractivePopups */}
            {/* - MapLayerControls */}
        </div>
    );
}

// Utility function to calculate distance between two coordinates
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