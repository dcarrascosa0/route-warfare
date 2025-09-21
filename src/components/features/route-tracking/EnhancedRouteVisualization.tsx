import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Route, 
  Clock, 
  Navigation, 
  Target, 
  MapPin, 
  TrendingUp,
  Activity,
  Zap,
  Gauge,
  BarChart3,
  Mountain,
  Compass
} from "lucide-react";

interface GPSCoordinate {
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number;
  speed?: number;
  altitude?: number;
  heading?: number;
}

interface EnhancedRouteVisualizationProps {
  coordinates: GPSCoordinate[];
  currentLocation?: GeolocationPosition | null;
  elapsedMs: number;
  isTracking: boolean;
  className?: string;
  showDetailedStats?: boolean;
  showElevationProfile?: boolean;
  showSpeedProfile?: boolean;
}

export default function EnhancedRouteVisualization({ 
  coordinates, 
  currentLocation, 
  elapsedMs, 
  isTracking,
  className = "",
  showDetailedStats = true,
  showElevationProfile = false,
  showSpeedProfile = false
}: EnhancedRouteVisualizationProps) {
  
  // Calculate comprehensive route statistics
  const routeStats = useMemo(() => {
    if (coordinates.length < 2) {
      return {
        totalDistance: 0,
        averageSpeed: 0,
        maxSpeed: 0,
        currentSpeed: 0,
        elevationGain: 0,
        elevationLoss: 0,
        routeEfficiency: 0,
        averageAccuracy: 0,
        coordinateCount: coordinates.length,
        isClosedLoop: false,
        straightLineDistance: 0,
        tortuosity: 0,
        averageHeading: 0,
        headingChanges: 0
      };
    }

    let totalDistance = 0;
    let maxSpeed = 0;
    let elevationGain = 0;
    let elevationLoss = 0;
    let accuracySum = 0;
    let accuracyCount = 0;
    let headingSum = 0;
    let headingCount = 0;
    let headingChanges = 0;
    let lastHeading: number | undefined;

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

      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;

      totalDistance += distance;

      // Track max speed
      if (curr.speed && curr.speed > maxSpeed) {
        maxSpeed = curr.speed;
      }

      // Track accuracy
      if (curr.accuracy) {
        accuracySum += curr.accuracy;
        accuracyCount++;
      }

      // Track elevation
      if (curr.altitude !== undefined && curr.altitude !== null) {
        if (curr.altitude < minElevation) minElevation = curr.altitude;
        if (curr.altitude > maxElevation) maxElevation = curr.altitude;
        
        if (prev.altitude !== undefined && prev.altitude !== null) {
          const elevationDiff = curr.altitude - prev.altitude;
          if (elevationDiff > 0) {
            elevationGain += elevationDiff;
          } else {
            elevationLoss += Math.abs(elevationDiff);
          }
        }
      }

      // Track heading changes
      if (curr.heading !== undefined && curr.heading !== null) {
        headingSum += curr.heading;
        headingCount++;
        
        if (lastHeading !== undefined) {
          let headingDiff = Math.abs(curr.heading - lastHeading);
          if (headingDiff > 180) headingDiff = 360 - headingDiff;
          if (headingDiff > 30) { // Significant heading change
            headingChanges++;
          }
        }
        lastHeading = curr.heading;
      }
    }

    // Calculate straight-line distance (start to end)
    const start = coordinates[0];
    const end = coordinates[coordinates.length - 1];
    const φ1 = start.latitude * Math.PI / 180;
    const φ2 = end.latitude * Math.PI / 180;
    const Δφ = (end.latitude - start.latitude) * Math.PI / 180;
    const Δλ = (end.longitude - start.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const straightLineDistance = 6371e3 * c;

    // Calculate route efficiency (straight line / actual distance)
    const routeEfficiency = totalDistance > 0 ? (straightLineDistance / totalDistance) * 100 : 0;

    // Calculate tortuosity (how winding the route is)
    const tortuosity = totalDistance > 0 ? totalDistance / straightLineDistance : 1;

    // Calculate duration and speeds
    const startTime = new Date(coordinates[0].timestamp).getTime();
    const endTime = new Date(coordinates[coordinates.length - 1].timestamp).getTime();
    const duration = (endTime - startTime) / 1000; // in seconds

    const averageSpeed = duration > 0 ? (totalDistance / duration) * 3.6 : 0; // km/h
    const currentSpeed = currentLocation?.coords.speed ? currentLocation.coords.speed * 3.6 : 0;

    // Check if closed loop
    const isClosedLoop = straightLineDistance < 100; // within 100 meters

    return {
      totalDistance,
      averageSpeed,
      maxSpeed: maxSpeed * 3.6, // convert m/s to km/h
      currentSpeed,
      elevationGain,
      elevationLoss,
      routeEfficiency,
      averageAccuracy: accuracyCount > 0 ? accuracySum / accuracyCount : 0,
      coordinateCount: coordinates.length,
      isClosedLoop,
      straightLineDistance,
      tortuosity,
      averageHeading: headingCount > 0 ? headingSum / headingCount : 0,
      headingChanges,
      duration
    };
  }, [coordinates, currentLocation]);

  // Format functions
  const formatDistance = (meters: number) => {
    return meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${meters.toFixed(0)} m`;
  };

  const formatSpeed = (kmh: number) => {
    return `${kmh.toFixed(1)} km/h`;
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const formatElevation = (meters: number) => {
    return `${meters.toFixed(0)}m`;
  };

  const formatHeading = (degrees: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return `${degrees.toFixed(0)}° ${directions[index]}`;
  };

  // Get route quality assessment
  const getRouteQuality = () => {
    let score = 0;
    let factors = [];

    // GPS accuracy factor
    if (routeStats.averageAccuracy <= 5) {
      score += 25;
      factors.push("Excellent GPS accuracy");
    } else if (routeStats.averageAccuracy <= 10) {
      score += 20;
      factors.push("Good GPS accuracy");
    } else if (routeStats.averageAccuracy <= 20) {
      score += 15;
      factors.push("Fair GPS accuracy");
    } else {
      score += 5;
      factors.push("Poor GPS accuracy");
    }

    // Coordinate density factor
    const pointsPerKm = routeStats.totalDistance > 0 ? (routeStats.coordinateCount / (routeStats.totalDistance / 1000)) : 0;
    if (pointsPerKm >= 100) {
      score += 25;
      factors.push("High coordinate density");
    } else if (pointsPerKm >= 50) {
      score += 20;
      factors.push("Good coordinate density");
    } else if (pointsPerKm >= 20) {
      score += 15;
      factors.push("Fair coordinate density");
    } else {
      score += 5;
      factors.push("Low coordinate density");
    }

    // Route length factor
    if (routeStats.totalDistance >= 1000) {
      score += 25;
      factors.push("Good route length");
    } else if (routeStats.totalDistance >= 500) {
      score += 20;
      factors.push("Moderate route length");
    } else {
      score += 10;
      factors.push("Short route");
    }

    // Closed loop bonus
    if (routeStats.isClosedLoop) {
      score += 25;
      factors.push("Closed loop (territory eligible)");
    }

    return { score, factors };
  };

  const routeQuality = getRouteQuality();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Statistics Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Route className="w-5 h-5" />
              Route Visualization
              <Badge variant={isTracking ? "default" : "secondary"}>
                {isTracking ? "Live" : "Static"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={routeStats.isClosedLoop ? "default" : "outline"}>
                {routeStats.isClosedLoop ? "Closed Loop" : "Open Path"}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Primary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {formatDistance(routeStats.totalDistance)}
              </div>
              <div className="text-sm text-muted-foreground">Distance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {formatTime(elapsedMs)}
              </div>
              <div className="text-sm text-muted-foreground">Duration</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {formatSpeed(routeStats.currentSpeed)}
              </div>
              <div className="text-sm text-muted-foreground">Current Speed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {routeStats.coordinateCount}
              </div>
              <div className="text-sm text-muted-foreground">GPS Points</div>
            </div>
          </div>

          {/* Secondary Stats */}
          {showDetailedStats && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-blue-500" />
                <div>
                  <div className="font-medium">{formatSpeed(routeStats.averageSpeed)}</div>
                  <div className="text-muted-foreground">Avg Speed</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-green-500" />
                <div>
                  <div className="font-medium">{formatSpeed(routeStats.maxSpeed)}</div>
                  <div className="text-muted-foreground">Max Speed</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-500" />
                <div>
                  <div className="font-medium">{routeStats.routeEfficiency.toFixed(1)}%</div>
                  <div className="text-muted-foreground">Efficiency</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-500" />
                <div>
                  <div className="font-medium">±{routeStats.averageAccuracy.toFixed(1)}m</div>
                  <div className="text-muted-foreground">GPS Accuracy</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-red-500" />
                <div>
                  <div className="font-medium">{routeStats.tortuosity.toFixed(2)}</div>
                  <div className="text-muted-foreground">Tortuosity</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-indigo-500" />
                <div>
                  <div className="font-medium">{formatHeading(routeStats.averageHeading)}</div>
                  <div className="text-muted-foreground">Avg Heading</div>
                </div>
              </div>
            </div>
          )}

          {/* Elevation Stats */}
          {(routeStats.elevationGain > 0 || routeStats.elevationLoss > 0) && (
            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Mountain className="w-4 h-4 text-green-600" />
                  <div>
                    <div className="font-medium">{formatElevation(routeStats.elevationGain)}</div>
                    <div className="text-muted-foreground">Elevation Gain</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Mountain className="w-4 h-4 text-red-600 rotate-180" />
                  <div>
                    <div className="font-medium">{formatElevation(routeStats.elevationLoss)}</div>
                    <div className="text-muted-foreground">Elevation Loss</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Route Quality Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Route Quality Assessment
            <Badge 
              variant={routeQuality.score >= 80 ? "default" : routeQuality.score >= 60 ? "secondary" : "destructive"}
            >
              {routeQuality.score}/100
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={routeQuality.score} className="h-2" />
          
          <div className="space-y-2">
            {routeQuality.factors.map((factor, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>{factor}</span>
              </div>
            ))}
          </div>

          {routeStats.isClosedLoop && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-800">
                <Target className="w-4 h-4" />
                <span className="font-medium">Territory Eligible</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                This route forms a closed loop and can be used to claim territory.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      {showDetailedStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium mb-2">Route Characteristics</div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Straight-line distance:</span>
                    <span>{formatDistance(routeStats.straightLineDistance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Route efficiency:</span>
                    <span>{routeStats.routeEfficiency.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Heading changes:</span>
                    <span>{routeStats.headingChanges}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="font-medium mb-2">Data Quality</div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Points per km:</span>
                    <span>
                      {routeStats.totalDistance > 0 
                        ? (routeStats.coordinateCount / (routeStats.totalDistance / 1000)).toFixed(0)
                        : '0'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg GPS accuracy:</span>
                    <span>±{routeStats.averageAccuracy.toFixed(1)}m</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Data completeness:</span>
                    <span>
                      {coordinates.filter(c => c.speed !== undefined).length > 0 ? 'Speed ✓' : 'Speed ✗'} {' '}
                      {coordinates.filter(c => c.altitude !== undefined).length > 0 ? 'Altitude ✓' : 'Altitude ✗'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}