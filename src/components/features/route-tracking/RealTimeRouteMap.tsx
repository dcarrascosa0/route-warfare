import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup } from 'react-leaflet';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Maximize2, Minimize2, Target, Activity, MapPin, Gauge, Clock, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import MapPanes from './components/MapPanes';
import MapResizeFix from './components/MapResizeFix';
import { calculateBounds, calculateCenter } from './utils/mapUtils';
import type { RouteDetail } from '@/lib/api/types/routes';
import type { Coordinate } from '@/lib/api/types/common';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTerritoryPreview } from '@/hooks/useApiQueries';

interface RealTimeRouteMapProps {
    activeRoute: RouteDetail;
    currentLocation: GeolocationPosition | null;
    isTracking: boolean;
    elapsedMs: number;
    className?: string;
    height?: string;
}

interface RouteStats {
    distance: number;
    duration: number;
    currentSpeed: number;
    averageSpeed: number;
    coordinateCount: number;
    gpsAccuracy: number;
    isClosedLoop: boolean;
}

// Futuristic dark tile layer with orange highlights
const FUTURISTIC_TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

export default function RealTimeRouteMap({
    activeRoute,
    currentLocation,
    isTracking,
    elapsedMs,
    className = '',
    height = '400px'
}: RealTimeRouteMapProps) {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [mapInstance, setMapInstance] = useState<any>(null);

    // Fetch real-time territory preview
    const { data: territoryPreview } = useTerritoryPreview({
        routeId: activeRoute.id,
        autoRefresh: true,
        refreshInterval: 5000, // Refresh every 5 seconds
    });

    // Calculate real-time statistics
    const stats = useMemo((): RouteStats => {
        const coordinates = activeRoute.coordinates;
        
        if (coordinates.length < 1) { // Changed from < 2 to < 1 to allow stats with one point
            return {
                distance: 0,
                duration: elapsedMs,
                currentSpeed: currentLocation?.coords.speed ? currentLocation.coords.speed * 3.6 : 0,
                averageSpeed: 0,
                coordinateCount: coordinates.length,
                gpsAccuracy: currentLocation?.coords.accuracy || 0,
                isClosedLoop: false
            };
        }

        // Calculate total distance
        let totalDistance = 0;
        for (let i = 1; i < coordinates.length; i++) {
            totalDistance += calculateDistance(
                coordinates[i - 1].latitude,
                coordinates[i - 1].longitude,
                coordinates[i].latitude,
                coordinates[i].longitude
            );
        }

        // Use elapsedMs for duration if tracking, otherwise calculate from timestamps
        const duration = isTracking ? elapsedMs : 
            (coordinates.length > 1 ?
            new Date(coordinates[coordinates.length - 1].timestamp).getTime() - new Date(coordinates[0].timestamp).getTime()
            : 0);

        // Calculate average speed
        const averageSpeed = duration > 0 ? (totalDistance / (duration / 1000)) * 3.6 : 0;

        // Check for closed loop (within 50 meters)
        const isClosedLoop = coordinates.length >= 4 && 
            calculateDistance(
                coordinates[0].latitude,
                coordinates[0].longitude,
                coordinates[coordinates.length - 1].latitude,
                coordinates[coordinates.length - 1].longitude
            ) < 50;

        return {
            distance: totalDistance,
            duration,
            currentSpeed: currentLocation?.coords.speed ? currentLocation.coords.speed * 3.6 : 0,
            averageSpeed,
            coordinateCount: coordinates.length,
            gpsAccuracy: currentLocation?.coords.accuracy || 0,
            isClosedLoop
        };
    }, [activeRoute.coordinates, currentLocation, elapsedMs, isTracking]);

    // Calculate map bounds and center
    const mapView = useMemo(() => {
        const coordinates = activeRoute.coordinates;
        
        if (coordinates.length > 0) {
            const center = calculateCenter(coordinates, 'active');
            const bounds = calculateBounds(coordinates);
            return { center, bounds };
        } else if (currentLocation) {
            const center: [number, number] = [
                currentLocation.coords.latitude,
                currentLocation.coords.longitude
            ];
            const pad = 0.001;
            const bounds = L.latLngBounds(
                [center[0] - pad, center[1] - pad],
                [center[0] + pad, center[1] + pad]
            );
            return { center, bounds };
        }
        
        return { center: null, bounds: null };
    }, [activeRoute.coordinates, currentLocation]);

    // Format utilities
    const formatDistance = (meters: number) => {
        return meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${meters.toFixed(0)} m`;
    };

    const formatDuration = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        }
        return `${minutes}m ${seconds % 60}s`;
    };

    const formatSpeed = (kmh: number) => `${kmh.toFixed(1)} km/h`;

    // Handle fullscreen toggle
    const handleFullscreenToggle = useCallback(() => {
        setIsFullscreen(prev => !prev);
        setTimeout(() => {
            if (mapInstance) {
                mapInstance.invalidateSize();
            }
        }, 100);
    }, [mapInstance]);

    // Auto-fit map to route bounds
    const handleAutoFit = useCallback(() => {
        if (mapInstance && mapView.bounds) {
            mapInstance.fitBounds(mapView.bounds, { padding: [20, 20] });
        }
    }, [mapInstance, mapView.bounds]);

    // Container styles for fullscreen
    const containerStyles = useMemo(() => {
        if (isFullscreen) {
            return {
                position: 'fixed' as const,
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 50,
                height: '100vh',
                width: '100vw',
            };
        }
        return { height, width: '100%' };
    }, [isFullscreen, height]);

    // Convert coordinates to polyline path
    const routePath = useMemo(() => {
        return activeRoute.coordinates.map(coord => [coord.latitude, coord.longitude] as [number, number]);
    }, [activeRoute.coordinates]);

    if (!mapView.center || !mapView.bounds) {
        return (
            <div className={cn("flex items-center justify-center bg-muted rounded-lg", className)} style={containerStyles}>
                <div className="text-center">
                    <Activity className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
                    <p className="text-muted-foreground">
                        {isTracking && activeRoute.coordinates.length === 0
                            ? "Getting GPS signal..."
                            : "No GPS data available"
                        }
                    </p>
                    {isTracking && (
                        <p className="text-xs text-muted-foreground mt-2">
                            Make sure location permissions are enabled
                        </p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Real-time Statistics Panel */}
            <Card className="bg-gradient-to-r from-primary/10 to-orange-500/10 border-primary/20">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Activity className={cn(
                                "w-5 h-5", 
                                isTracking ? "text-green-500 animate-pulse" : "text-muted-foreground"
                            )} />
                            <h3 className="font-semibold">Live Route Tracking</h3>
                            <Badge variant={isTracking ? "default" : "secondary"}>
                                {isTracking ? "Active" : "Paused"}
                            </Badge>
                        </div>
                        {stats.isClosedLoop && (
                            <Badge className="bg-orange-500/20 text-orange-700 border-orange-500/30">
                                <Target className="w-3 h-3 mr-1" />
                                Territory Eligible
                            </Badge>
                        )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
                                {formatDistance(stats.distance)}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                                <MapPin className="w-3 h-3" />
                                Distance
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
                                {formatDuration(stats.duration)}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                                <Clock className="w-3 h-3" />
                                Duration
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
                                {formatSpeed(stats.currentSpeed)}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                                <Gauge className="w-3 h-3" />
                                Current Speed
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
                                {stats.coordinateCount}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                GPS Points
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border/50 flex justify-between text-sm">
                        <span>Avg Speed: {formatSpeed(stats.averageSpeed)}</span>
                        <span>GPS Accuracy: ±{stats.gpsAccuracy.toFixed(1)}m</span>
                    </div>
                </CardContent>
            </Card>

            {/* Enhanced Map */}
            <div
                className={cn(
                    "relative rounded-lg overflow-hidden border border-primary/20",
                    "bg-gradient-to-br from-background via-background/95 to-primary/5",
                    isFullscreen && "rounded-none border-none",
                    className
                )}
                style={containerStyles}
            >
                <MapContainer
                    center={mapView.center}
                    bounds={mapView.bounds}
                    className="w-full h-full"
                    zoomControl={false}
                    whenCreated={setMapInstance}
                >
                    <MapPanes />
                    <MapResizeFix />

                    <TileLayer
                        url={FUTURISTIC_TILE_URL}
                        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                        className="grayscale contrast-125 brightness-90"
                    />

                    {/* Route path with futuristic styling */}
                    {routePath.length > 1 && (
                        <>
                            {/* Glowing base line */}
                            <Polyline
                                positions={routePath}
                                pathOptions={{
                                    color: '#ff6b35',
                                    weight: 6,
                                    opacity: 0.3,
                                }}
                            />
                            {/* Main route line */}
                            <Polyline
                                positions={routePath}
                                pathOptions={{
                                    color: '#ff6b35',
                                    weight: 3,
                                    opacity: 0.9,
                                    lineCap: 'round',
                                    lineJoin: 'round'
                                }}
                            />
                        </>
                    )}

                    {/* Territory Preview Polygon */}
                    {territoryPreview && (territoryPreview as any).boundary && (
                        <Polyline
                            positions={(territoryPreview as any).boundary.map((p: any) => [p.latitude, p.longitude])}
                            pathOptions={{
                                color: '#f59e0b', // A distinct color for the preview
                                weight: 3,
                                opacity: 0.7,
                                dashArray: '5, 10'
                            }}
                        />
                    )}

                    {/* Start marker */}
                    {activeRoute.coordinates.length > 0 && (
                        <CircleMarker
                            center={[activeRoute.coordinates[0].latitude, activeRoute.coordinates[0].longitude]}
                            pathOptions={{
                                color: '#10b981',
                                fillColor: '#10b981',
                                fillOpacity: 0.8,
                                weight: 2
                            }}
                            radius={8}
                        >
                            <Popup>
                                <div className="text-sm font-medium">
                                    🚩 Route Start
                                    <br />
                                    {new Date(activeRoute.coordinates[0].timestamp).toLocaleString()}
                                </div>
                            </Popup>
                        </CircleMarker>
                    )}

                    {/* Current position marker */}
                    {currentLocation && (
                        <>
                            {/* Accuracy circle */}
                            <CircleMarker
                                center={[currentLocation.coords.latitude, currentLocation.coords.longitude]}
                                pathOptions={{
                                    color: '#ff6b35',
                                    fillColor: '#ff6b35',
                                    fillOpacity: 0.1,
                                    weight: 1
                                }}
                                radius={Math.max(currentLocation.coords.accuracy || 5, 5)}
                            />
                            {/* Current position pulse marker */}
                            <CircleMarker
                                center={[currentLocation.coords.latitude, currentLocation.coords.longitude]}
                                pathOptions={{
                                    color: '#ff6b35',
                                    fillColor: '#ff6b35',
                                    fillOpacity: 0.9,
                                    weight: 3,
                                    className: 'animate-ping'
                                }}
                                radius={10}
                            >
                                <Popup>
                                    <div className="text-sm font-medium">
                                        📍 Current Location
                                        <br />
                                        Speed: {formatSpeed(stats.currentSpeed)}
                                        <br />
                                        Accuracy: ±{stats.gpsAccuracy.toFixed(1)}m
                                    </div>
                                </Popup>
                            </CircleMarker>
                        </>
                    )}

                    {/* GPS points along the route */}
                    {activeRoute.coordinates.map((coord, index) => (
                        index % 10 === 0 && ( // Show every 10th point to avoid clutter
                            <CircleMarker
                                key={index}
                                center={[coord.latitude, coord.longitude]}
                                pathOptions={{
                                    color: '#3b82f6',
                                    fillColor: '#3b82f6',
                                    fillOpacity: 0.6,
                                    weight: 1
                                }}
                                radius={3}
                            />
                        )
                    ))}
                </MapContainer>

                {/* Map Controls */}
                <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleAutoFit}
                        className="bg-background/80 backdrop-blur-sm"
                        title="Fit to Route"
                    >
                        <Target className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleFullscreenToggle}
                        className="bg-background/80 backdrop-blur-sm"
                        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                    >
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </Button>
                </div>

                {/* Futuristic overlay effects */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-orange-500/5" />
                    <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2 text-sm">
                            <div className={cn(
                                "w-2 h-2 rounded-full",
                                isTracking ? "bg-green-500 animate-pulse" : "bg-red-500"
                            )} />
                            <span className="font-medium">
                                {isTracking ? "Live Tracking" : "Tracking Paused"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Utility function to calculate distance between coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
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