import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Route, 
  Clock, 
  Navigation, 
  Target, 
  MapPin, 
  TrendingUp,
  Activity
} from "lucide-react";
import { GatewayAPI } from "@/lib/api";
import { RouteProgressProps, RouteDetail } from "./types";

interface RouteStats {
  distance_meters: number | null;
  duration_seconds: number | null;
  coordinate_count: number | null;
  is_closed_loop: boolean;
  territory_area_km2: number | null;
  average_speed_kmh: number | null;
  max_speed_kmh: number | null;
}

export default function RouteProgress({ 
  route, 
  showDetails = true,
  className 
}: RouteProgressProps & { className?: string }) {
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [lastPosition, setLastPosition] = useState<GeolocationPosition | null>(null);
  const speedHistory = useRef<number[]>([]);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Track current speed using GPS with smoothing
  useEffect(() => {
    if (!navigator.geolocation || route.status !== 'active') return;
    
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (lastPosition) {
          const timeDiff = (position.timestamp - lastPosition.timestamp) / 1000; // seconds
          if (timeDiff > 0 && timeDiff < 30) { // Ignore if too much time has passed
            const distance = calculateDistance(
              lastPosition.coords.latitude,
              lastPosition.coords.longitude,
              position.coords.latitude,
              position.coords.longitude
            );
            const speedMps = distance / timeDiff; // meters per second
            const speedKmh = speedMps * 3.6; // convert to km/h
            
            // Smooth speed calculation using moving average
            speedHistory.current.push(speedKmh);
            if (speedHistory.current.length > 5) {
              speedHistory.current.shift(); // Keep only last 5 readings
            }
            
            const smoothedSpeed = speedHistory.current.reduce((sum, s) => sum + s, 0) / speedHistory.current.length;
            setCurrentSpeed(Math.max(0, smoothedSpeed)); // Ensure non-negative
          }
        }
        setLastPosition(position);
      },
      (error) => {
        console.warn('GPS error for speed tracking:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [lastPosition, route.status]);

  // Format distance
  const formatDistance = (meters: number | null): string => {
    if (!meters) return "0 m";
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(2)} km`;
  };

  // Format duration
  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return "0s";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  // Calculate progress for territory eligibility (simplified)
  const territoryProgress = route.stats.territory_eligibility_score || 0;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4" />
          Route Progress
          <Badge variant={route.status === 'active' ? 'default' : 'secondary'}>
            {route.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Route className="h-3 w-3" />
              Distance
            </div>
            <div className="font-medium">
              {formatDistance(route.stats.distance_meters)}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              Duration
            </div>
            <div className="font-medium">
              {formatDuration(route.stats.duration_seconds)}
            </div>
          </div>
        </div>

        {/* Current Speed (for active routes) */}
        {route.status === 'active' && (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              Current Speed
            </div>
            <div className="font-medium">
              {currentSpeed.toFixed(1)} km/h
            </div>
          </div>
        )}

        {/* Territory Eligibility Progress */}
        {showDetails && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Target className="h-3 w-3" />
                Territory Eligibility
              </span>
              <span className="font-medium">{Math.round(territoryProgress)}%</span>
            </div>
            <Progress value={territoryProgress} className="h-2" />
          </div>
        )}

        {/* Additional Stats */}
        {showDetails && (
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                Points
              </div>
              <div className="font-medium">
                {route.stats.coordinate_count || 0}
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Navigation className="h-3 w-3" />
                GPS Quality
              </div>
              <div className="font-medium">
                {route.stats.gps_quality_score ? `${Math.round(route.stats.gps_quality_score)}%` : 'N/A'}
              </div>
            </div>
          </div>
        )}

        {/* Closed Loop Indicator */}
        {route.stats.is_closed_loop && (
          <Badge variant="outline" className="w-full justify-center">
            Closed Loop Route
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}