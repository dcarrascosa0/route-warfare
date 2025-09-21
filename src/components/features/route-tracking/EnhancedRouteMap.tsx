import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { MapPin, Navigation, Target as TargetIcon, Maximize2, ZoomIn, ZoomOut, RotateCcw, Info, Shield, AlertTriangle, Share2, Download, ExternalLink } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, Polygon, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useResponsive } from "@/hooks/useResponsive";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Fix default Leaflet marker icons for Vite bundling
const DefaultIcon = L.icon({
    iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).toString(),
    iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).toString(),
    shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).toString(),
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon as any;

// Enhanced GPS coordinate interface
export interface GPSCoordinate {
    latitude: number;
    longitude: number;
    timestamp: string;
    accuracy?: number;
    altitude?: number;
    speed?: number;
    heading?: number;
}

// Route data interface
export interface RouteDetail {
    id: string;
    name?: string;
    description?: string;
    status: "active" | "completed" | "abandoned";
    created_at: string;
    updated_at: string;
    completed_at?: string;
    coordinates: GPSCoordinate[];
    stats: {
        distance_meters: number | null;
        duration_seconds?: number | null;
        coordinate_count: number | null;
        is_closed_loop: boolean;
        territory_area_km2?: number | null;
        gps_quality_score?: number;
        territory_eligibility_score?: number;
    };
    territory_claim_result?: {
        success: boolean;
        territory_id?: string;
        error_message?: string;
    };
}

interface EnhancedRouteMapProps {
    route: RouteDetail;
    showTerritoryPreview?: boolean;
    showGPSQuality?: boolean;
    showControls?: boolean;
    height?: string;
    className?: string;
    onTerritoryClick?: (territoryId: string) => void;
    onShareRoute?: () => void;
    onDownloadRoute?: () => void;
}

// Map control component that works inside MapContainer
const MapControlsInner: React.FC<{
    mapBounds: [[number, number], [number, number]] | null;
    onToggleFullscreen: () => void;
}> = ({ mapBounds, onToggleFullscreen }) => {
    const map = useMap();

    const handleZoomIn = () => map.zoomIn();
    const handleZoomOut = () => map.zoomOut();
    const handleReset = () => {
        if (mapBounds) {
            map.fitBounds(mapBounds, { padding: [20, 20] });
        }
    };

    return (
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onToggleFullscreen}>
                <Maximize2 className="w-4 h-4" />
            </Button>
        </div>
    );
};

// Component to auto-fit bounds when route changes
const AutoFitBounds: React.FC<{ bounds: [[number, number], [number, number]] | null }> = ({ bounds }) => {
    const map = useMap();

    useEffect(() => {
        if (bounds) {
            map.fitBounds(bounds, { padding: [20, 20] });
        }
    }, [bounds, map]);

    return null;
};

// Route statistics component
const RouteStats: React.FC<{ route: RouteDetail }> = ({ route }) => {
    const formatDistance = (meters: number | null) => {
        if (!meters) return "0 m";
        return meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${meters.toFixed(0)} m`;
    };

    const formatDuration = (seconds: number | null) => {
        if (!seconds) return "0s";
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
        if (minutes > 0) return `${minutes}m ${secs}s`;
        return `${secs}s`;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-blue-100 text-blue-800';
            case 'completed': return 'bg-green-100 text-green-800';
            case 'abandoned': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="absolute top-4 left-4 z-[1000] max-w-sm">
            <Card className="bg-background/95 backdrop-blur-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm">
                        <Navigation className="w-4 h-4" />
                        {route.name || `Route ${route.id.slice(0, 8)}`}
                        <Badge className={getStatusColor(route.status)} variant="secondary">
                            {route.status}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                            <span className="text-muted-foreground">Distance:</span>
                            <div className="font-medium">{formatDistance(route.stats.distance_meters)}</div>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Duration:</span>
                            <div className="font-medium">{formatDuration(route.stats.duration_seconds)}</div>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Points:</span>
                            <div className="font-medium">{route.stats.coordinate_count || 0}</div>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Loop:</span>
                            <div className="font-medium">{route.stats.is_closed_loop ? 'Yes' : 'No'}</div>
                        </div>
                    </div>
                    
                    {route.stats.territory_area_km2 && (
                        <div className="text-xs">
                            <span className="text-muted-foreground">Territory Area:</span>
                            <div className="font-medium">{route.stats.territory_area_km2.toFixed(2)} km²</div>
                        </div>
                    )}

                    {route.stats.gps_quality_score && (
                        <div className="text-xs">
                            <span className="text-muted-foreground">GPS Quality:</span>
                            <div className="font-medium">{route.stats.gps_quality_score}/100</div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

const EnhancedRouteMap: React.FC<EnhancedRouteMapProps> = ({
    route,
    showTerritoryPreview = true,
    showGPSQuality = true,
    showControls = true,
    height = "400px",
    className = "",
    onTerritoryClick,
    onShareRoute,
    onDownloadRoute
}) => {
    const { isMobile } = useResponsive();
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Calculate map bounds from coordinates
    const mapBounds = useMemo(() => {
        if (route.coordinates.length === 0) return null;
        
        const lats = route.coordinates.map(coord => coord.latitude);
        const lngs = route.coordinates.map(coord => coord.longitude);
        
        return [
            [Math.min(...lats), Math.min(...lngs)],
            [Math.max(...lats), Math.max(...lngs)]
        ] as [[number, number], [number, number]];
    }, [route.coordinates]);

    // Convert coordinates to Leaflet format
    const routePath = useMemo(() => {
        return route.coordinates.map(coord => [coord.latitude, coord.longitude] as [number, number]);
    }, [route.coordinates]);

    // Calculate center point
    const center = useMemo(() => {
        if (route.coordinates.length === 0) return [40.7128, -74.0060] as [number, number];
        
        const avgLat = route.coordinates.reduce((sum, coord) => sum + coord.latitude, 0) / route.coordinates.length;
        const avgLng = route.coordinates.reduce((sum, coord) => sum + coord.longitude, 0) / route.coordinates.length;
        
        return [avgLat, avgLng] as [number, number];
    }, [route.coordinates]);

    const handleToggleFullscreen = useCallback(() => {
        setIsFullscreen(!isFullscreen);
    }, [isFullscreen]);

    // Get route color based on status
    const getRouteColor = () => {
        switch (route.status) {
            case 'active': return '#3b82f6';
            case 'completed': return '#22c55e';
            case 'abandoned': return '#ef4444';
            default: return '#6b7280';
        }
    };

    // Get GPS quality color
    const getGPSQualityColor = (accuracy?: number) => {
        if (!accuracy) return '#6b7280';
        if (accuracy <= 5) return '#22c55e';
        if (accuracy <= 10) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50' : ''} ${className}`}>
            <MapContainer
                center={center}
                zoom={13}
                style={{ height: isFullscreen ? '100vh' : height, width: '100%' }}
                className="rounded-lg"
            >
                <AutoFitBounds bounds={mapBounds} />
                
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Route path */}
                {routePath.length > 1 && (
                    <Polyline
                        positions={routePath}
                        pathOptions={{
                            color: getRouteColor(),
                            weight: 4,
                            opacity: 0.8
                        }}
                    />
                )}

                {/* Start marker */}
                {route.coordinates.length > 0 && (
                    <Marker position={[route.coordinates[0].latitude, route.coordinates[0].longitude]}>
                        <Popup>
                            <div className="text-center">
                                <MapPin className="w-4 h-4 mx-auto mb-1 text-green-500" />
                                <p className="text-sm font-medium">Start Point</p>
                                <p className="text-xs text-muted-foreground">
                                    {new Date(route.coordinates[0].timestamp).toLocaleTimeString()}
                                </p>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {/* End marker (if completed) */}
                {route.status === 'completed' && route.coordinates.length > 1 && (
                    <Marker position={[
                        route.coordinates[route.coordinates.length - 1].latitude,
                        route.coordinates[route.coordinates.length - 1].longitude
                    ]}>
                        <Popup>
                            <div className="text-center">
                                <TargetIcon className="w-4 h-4 mx-auto mb-1 text-red-500" />
                                <p className="text-sm font-medium">End Point</p>
                                <p className="text-xs text-muted-foreground">
                                    {new Date(route.coordinates[route.coordinates.length - 1].timestamp).toLocaleTimeString()}
                                </p>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {/* GPS quality indicators */}
                {showGPSQuality && route.coordinates.map((coord, index) => (
                    coord.accuracy && coord.accuracy > 10 && (
                        <Circle
                            key={index}
                            center={[coord.latitude, coord.longitude]}
                            radius={coord.accuracy}
                            pathOptions={{
                                color: getGPSQualityColor(coord.accuracy),
                                fillColor: getGPSQualityColor(coord.accuracy),
                                fillOpacity: 0.1,
                                weight: 1
                            }}
                        />
                    )
                ))}

                {/* Territory preview polygon */}
                {showTerritoryPreview && route.stats.is_closed_loop && routePath.length > 2 && (
                    <Polygon
                        positions={routePath}
                        pathOptions={{
                            color: '#8b5cf6',
                            fillColor: '#8b5cf6',
                            fillOpacity: 0.2,
                            weight: 2,
                            dashArray: '5, 5'
                        }}
                    >
                        <Popup>
                            <div className="text-center">
                                <Shield className="w-4 h-4 mx-auto mb-1 text-purple-500" />
                                <p className="text-sm font-medium">Territory Preview</p>
                                {route.stats.territory_area_km2 && (
                                    <p className="text-xs text-muted-foreground">
                                        Area: {route.stats.territory_area_km2.toFixed(2)} km²
                                    </p>
                                )}
                                {onTerritoryClick && route.territory_claim_result?.territory_id && (
                                    <Button
                                        size="sm"
                                        className="mt-2"
                                        onClick={() => onTerritoryClick(route.territory_claim_result!.territory_id!)}
                                    >
                                        View Territory
                                    </Button>
                                )}
                            </div>
                        </Popup>
                    </Polygon>
                )}

                {/* Map controls inside the map */}
                {showControls && (
                    <MapControlsInner
                        mapBounds={mapBounds}
                        onToggleFullscreen={handleToggleFullscreen}
                    />
                )}
            </MapContainer>

            {/* Route statistics overlay */}
            <RouteStats route={route} />

            {/* Action buttons */}
            <div className="absolute bottom-4 right-4 z-[1000] flex gap-2">
                {onShareRoute && (
                    <Button variant="outline" size="sm" onClick={onShareRoute}>
                        <Share2 className="w-4 h-4" />
                    </Button>
                )}
                {onDownloadRoute && (
                    <Button variant="outline" size="sm" onClick={onDownloadRoute}>
                        <Download className="w-4 h-4" />
                    </Button>
                )}
            </div>

            {/* Territory claim result */}
            {route.territory_claim_result && (
                <div className="absolute bottom-4 left-4 z-[1000] max-w-sm">
                    <Card className={`bg-background/95 backdrop-blur-sm ${
                        route.territory_claim_result.success ? 'border-green-200' : 'border-red-200'
                    }`}>
                        <CardContent className="p-3">
                            <div className="flex items-center gap-2">
                                {route.territory_claim_result.success ? (
                                    <Shield className="w-4 h-4 text-green-500" />
                                ) : (
                                    <AlertTriangle className="w-4 h-4 text-red-500" />
                                )}
                                <span className="text-sm font-medium">
                                    {route.territory_claim_result.success ? 'Territory Claimed!' : 'Claim Failed'}
                                </span>
                            </div>
                            {route.territory_claim_result.error_message && (
                                <p className="text-xs text-red-600 mt-1">
                                    {route.territory_claim_result.error_message}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default EnhancedRouteMap;