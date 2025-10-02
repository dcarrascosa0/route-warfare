import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Route,
  MapPin,
  Target,
  Clock,
  Ruler,
  Activity,
  Gauge,
  Calendar,
  User,
  Navigation,
  Layers,
  Maximize,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Award,
  TrendingUp,
  Info,
  Shield,

  Share2,
  Download,
  Minimize
} from "lucide-react";
import { RouteInfo } from "@/types/api";
import { MapContainer, TileLayer, Polyline, Marker, Popup, Polygon, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../territory/TerritoryMap.css";
import { useResponsive } from "@/hooks/useResponsive";

// Fix default Leaflet marker icons for Vite bundling
const DefaultIcon = L.icon({
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).toString(),
  iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).toString(),
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).toString(),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon as any;

interface GPSCoordinate {
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
}

interface RouteMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  route: RouteInfo | null;
  coordinates: GPSCoordinate[];
  showTerritoryPreview?: boolean;
  showGPSQuality?: boolean;
  showStatistics?: boolean;
  onClaimTerritory?: () => void;
  onShareRoute?: () => void;
  onDownloadRoute?: () => void;
}

// Map event handler component
const MapEventHandler: React.FC<{
  coordinates: GPSCoordinate[];
  onMapReady: (map: any) => void;
}> = ({ coordinates, onMapReady }) => {
  const map = useMap();

  useEffect(() => {
    onMapReady(map);

    // Auto-fit bounds when coordinates change
    if (coordinates.length > 0) {
      const bounds = L.latLngBounds(
        coordinates.map(coord => [coord.latitude, coord.longitude] as [number, number])
      );
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [map, coordinates, onMapReady]);

  return null;
};

const RouteMapModal: React.FC<RouteMapModalProps> = ({
  isOpen,
  onClose,
  route,
  coordinates,
  showTerritoryPreview = true,
  showGPSQuality = true,
  showStatistics = true,
  onClaimTerritory,
  onShareRoute,
  onDownloadRoute
}) => {
  const { isMobile } = useResponsive();
  const mapRef = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Calculate route statistics
  const routeStats = useMemo(() => {
    if (!isOpen || !route || coordinates.length < 2) {
      return {
        totalDistance: 0,
        duration: 0,
        averageSpeed: 0,
        maxSpeed: 0,
        elevationGain: 0,
        isClosedLoop: false
      };
    }

    let totalDistance = 0;
    let maxSpeed = 0;
    let elevationGain = 0;
    let minElevation = Infinity;
    let maxElevation = -Infinity;

    for (let i = 1; i < coordinates.length; i++) {
      const prev = coordinates[i - 1];
      const curr = coordinates[i];

      // Calculate distance using Haversine formula
      const R = 6371e3; // Earth's radius in meters
      const φ1 = prev.latitude * Math.PI / 180;
      const φ2 = curr.latitude * Math.PI / 180;
      const Δφ = (curr.latitude - prev.latitude) * Math.PI / 180;
      const Δλ = (curr.longitude - prev.longitude) * Math.PI / 180;

      const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      totalDistance += distance;

      // Track max speed
      if (curr.speed && curr.speed > maxSpeed) {
        maxSpeed = curr.speed;
      }

      // Track elevation
      if (curr.altitude !== undefined && curr.altitude !== null) {
        if (curr.altitude < minElevation) minElevation = curr.altitude;
        if (curr.altitude > maxElevation) maxElevation = curr.altitude;
      }
    }

    if (minElevation !== Infinity && maxElevation !== -Infinity) {
      elevationGain = maxElevation - minElevation;
    }

    // Calculate duration
    const startTime = new Date(coordinates[0].timestamp).getTime();
    const endTime = new Date(coordinates[coordinates.length - 1].timestamp).getTime();
    const duration = (endTime - startTime) / 1000; // in seconds

    // Calculate average speed
    const averageSpeed = duration > 0 ? (totalDistance / duration) * 3.6 : 0; // km/h

    // Check if closed loop (start and end points are close)
    const start = coordinates[0];
    const end = coordinates[coordinates.length - 1];
    const closingDistance = Math.sqrt(
      Math.pow(end.latitude - start.latitude, 2) +
      Math.pow(end.longitude - start.longitude, 2)
    ) * 111320; // rough conversion to meters
    const isClosedLoop = closingDistance < 100; // within 100 meters

    return {
      totalDistance,
      duration,
      averageSpeed,
      maxSpeed: maxSpeed * 3.6, // convert m/s to km/h
      elevationGain,
      isClosedLoop
    };
  }, [coordinates, isOpen, route]);

  // Convert coordinates to Leaflet format
  const routePath = useMemo(() => {
    return coordinates.map(coord => [coord.latitude, coord.longitude] as [number, number]);
  }, [coordinates]);

  // Calculate center point
  const center = useMemo(() => {
    if (coordinates.length === 0) return [40.7128, -74.0060] as [number, number];

    const avgLat = coordinates.reduce((sum, coord) => sum + coord.latitude, 0) / coordinates.length;
    const avgLng = coordinates.reduce((sum, coord) => sum + coord.longitude, 0) / coordinates.length;

    return [avgLat, avgLng] as [number, number];
  }, [coordinates]);

  // Map control handlers
  const handleMapReady = useCallback((map: any) => {
    mapRef.current = map;
  }, []);

  // Do not render when modal is closed or route data is not provided
  if (!isOpen || !route) {
    return null;
  }

  // Format functions
  const formatDistance = (meters: number) => {
    return meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${meters.toFixed(0)} m`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const formatSpeed = (kmh: number) => {
    return `${kmh.toFixed(1)} km/h`;
  };

  // Get route status info
  const getRouteStatusInfo = () => {
    if (route.is_closed && routeStats.isClosedLoop) {
      return {
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        label: 'Closed Loop - Territory Eligible'
      };
    } else if (route.is_closed) {
      return {
        icon: CheckCircle,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        label: 'Route Completed'
      };
    } else {
      return {
        icon: Activity,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        label: 'Route Active'
      };
    }
  };

  const statusInfo = getRouteStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-6xl ${isFullscreen ? 'h-[90vh]' : 'h-[80vh]'} p-0 flex flex-col`}>
        {/* Header overlay */}
        <div className="absolute top-4 left-4 right-4 z-[1000] flex items-center justify-between">
          <div className="flex items-center gap-2 bg-background/95 backdrop-blur-sm rounded-lg px-3 py-2">
            <Route className="w-5 h-5" />
            <span className="font-semibold">{route.name || `Route ${route.id.slice(0, 8)}`}</span>
            <Badge className={statusInfo.bgColor} variant="secondary">
              <StatusIcon className={`w-3 h-3 mr-1 ${statusInfo.color}`} />
              {statusInfo.label}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="bg-background/95 backdrop-blur-sm"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div className="flex-1 relative h-full">
          {/* Map */}
          <MapContainer
            center={center}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            className="h-full w-full rw-map territory-map-container"
            zoomControl={false}
            attributionControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              className="tw-road-tint"
            />

            <MapEventHandler coordinates={coordinates} onMapReady={handleMapReady} />

            {/* Route path */}
            {routePath.length > 1 && (
              <Polyline
                positions={routePath}
                pathOptions={{
                  color: '#f97316', // Orange like territory theme
                  weight: 4,
                  opacity: 0.8,
                  className: 'route-completion-line'
                }}
              />
            )}

            {/* Start marker */}
            {coordinates.length > 0 && (
              <Marker position={[coordinates[0].latitude, coordinates[0].longitude]}>
                <Popup>
                  <div className="text-center">
                    <MapPin className="w-4 h-4 mx-auto mb-1 text-green-500" />
                    <p className="text-sm font-medium">Start Point</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(coordinates[0].timestamp).toLocaleString()}
                    </p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* End marker */}
            {coordinates.length > 1 && route.is_closed && (
              <Marker position={[
                coordinates[coordinates.length - 1].latitude,
                coordinates[coordinates.length - 1].longitude
              ]}>
                <Popup>
                  <div className="text-center">
                    <Target className="w-4 h-4 mx-auto mb-1 text-red-500" />
                    <p className="text-sm font-medium">End Point</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(coordinates[coordinates.length - 1].timestamp).toLocaleString()}
                    </p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Territory preview polygon */}
            {showTerritoryPreview && routeStats.isClosedLoop && routePath.length > 2 && (
              <Polygon
                positions={routePath}
                pathOptions={{
                  color: '#f97316',
                  fillColor: '#f97316',
                  fillOpacity: 0.2,
                  weight: 2,
                  opacity: 1,
                  className: 'territory-polygon territory-owned'
                }}
              >
                <Popup>
                  <div className="text-center">
                    <Shield className="w-4 h-4 mx-auto mb-1 text-purple-500" />
                    <p className="text-sm font-medium">Territory Preview</p>
                    <p className="text-xs text-muted-foreground">
                      Estimated area: {((routeStats.totalDistance / 1000) * 0.1).toFixed(2)} km²
                    </p>
                    {onClaimTerritory && (
                      <Button size="sm" className="mt-2" onClick={onClaimTerritory}>
                        Claim Territory
                      </Button>
                    )}
                  </div>
                </Popup>
              </Polygon>
            )}
          </MapContainer>



          {/* Route statistics */}
          {showStatistics && (
            <div className="absolute top-20 left-4 z-[1000] max-w-sm">
              <Card className="bg-background/95 backdrop-blur-sm">
                <CardContent className="p-3">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <Ruler className="w-3 h-3 text-blue-500" />
                      <div>
                        <div className="font-medium">{formatDistance(routeStats.totalDistance)}</div>
                        <div className="text-muted-foreground">Distance</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-green-500" />
                      <div>
                        <div className="font-medium">{formatDuration(routeStats.duration)}</div>
                        <div className="text-muted-foreground">Duration</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Gauge className="w-3 h-3 text-orange-500" />
                      <div>
                        <div className="font-medium">{formatSpeed(routeStats.averageSpeed)}</div>
                        <div className="text-muted-foreground">Avg Speed</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-3 h-3 text-purple-500" />
                      <div>
                        <div className="font-medium">{formatSpeed(routeStats.maxSpeed)}</div>
                        <div className="text-muted-foreground">Max Speed</div>
                      </div>
                    </div>
                  </div>

                  {routeStats.elevationGain > 0 && (
                    <div className="mt-2 pt-2 border-t">
                      <div className="flex items-center gap-2 text-xs">
                        <Activity className="w-3 h-3 text-red-500" />
                        <div>
                          <div className="font-medium">{routeStats.elevationGain.toFixed(0)}m</div>
                          <div className="text-muted-foreground">Elevation Gain</div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Action buttons */}
          <div className="absolute bottom-4 right-4 z-[1000] flex gap-2">
            {onShareRoute && (
              <Button variant="outline" size="sm" onClick={onShareRoute}>
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>
            )}
            {onDownloadRoute && (
              <Button variant="outline" size="sm" onClick={onDownloadRoute}>
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
            )}
            {onClaimTerritory && routeStats.isClosedLoop && (
              <Button size="sm" onClick={onClaimTerritory}>
                <Shield className="w-4 h-4 mr-1" />
                Claim Territory
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RouteMapModal;