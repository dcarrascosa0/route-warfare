import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Satellite, 
  SatelliteIcon, 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  CheckCircle,
  Clock
} from "lucide-react";
import { GPSStatusProps } from "./types";

interface GPSState {
  isSupported: boolean;
  permission: PermissionState | null;
  isActive: boolean;
  accuracy: number | null;
  lastUpdate: Date | null;
  error: string | null;
  signalStrength: 'excellent' | 'good' | 'fair' | 'poor' | 'none';
}

export default function GPSStatus({ 
  accuracy: propAccuracy, 
  isTracking: propIsTracking, 
  lastUpdate: propLastUpdate,
  className 
}: GPSStatusProps & { className?: string }) {
  const [gpsState, setGpsState] = useState<GPSState>({
    isSupported: false,
    permission: null,
    isActive: false,
    accuracy: null,
    lastUpdate: null,
    error: null,
    signalStrength: 'none'
  });

  const [watchId, setWatchId] = useState<number | null>(null);

  // Use props if provided, otherwise use internal state
  const accuracy = propAccuracy ?? gpsState.accuracy;
  const isActive = propIsTracking ?? gpsState.isActive;
  const lastUpdate = propLastUpdate ? new Date(propLastUpdate) : gpsState.lastUpdate;

  // Determine signal strength based on accuracy
  const getSignalStrength = (accuracy: number | null): GPSState['signalStrength'] => {
    if (!accuracy) return 'none';
    if (accuracy <= 5) return 'excellent';
    if (accuracy <= 10) return 'good';
    if (accuracy <= 20) return 'fair';
    if (accuracy <= 50) return 'poor';
    return 'none';
  };

  const signalStrength = getSignalStrength(accuracy);

  // Check GPS support and permission on mount
  useEffect(() => {
    const checkGPSSupport = async () => {
      const isSupported = 'geolocation' in navigator;
      
      let permission: PermissionState | null = null;
      if (isSupported && 'permissions' in navigator) {
        try {
          const result = await navigator.permissions.query({ name: 'geolocation' });
          permission = result.state;
        } catch (error) {
          console.warn('Could not check geolocation permission:', error);
        }
      }

      setGpsState(prev => ({
        ...prev,
        isSupported,
        permission
      }));
    };

    checkGPSSupport();
  }, []);

  // Start GPS monitoring when component mounts (only if no props provided)
  useEffect(() => {
    if (!gpsState.isSupported || propAccuracy !== undefined) return;

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000
    };

    const handleSuccess = (position: GeolocationPosition) => {
      const accuracy = position.coords.accuracy;
      const signalStrength = getSignalStrength(accuracy);
      
      setGpsState(prev => ({
        ...prev,
        isActive: true,
        accuracy,
        lastUpdate: new Date(),
        error: null,
        signalStrength
      }));
    };

    const handleError = (error: GeolocationPositionError) => {
      let errorMessage = 'Unknown GPS error';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'GPS permission denied';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'GPS position unavailable';
          break;
        case error.TIMEOUT:
          errorMessage = 'GPS timeout';
          break;
      }
      
      setGpsState(prev => ({
        ...prev,
        isActive: false,
        error: errorMessage,
        signalStrength: 'none'
      }));
    };

    const id = navigator.geolocation.watchPosition(handleSuccess, handleError, options);
    setWatchId(id);

    return () => {
      if (id) {
        navigator.geolocation.clearWatch(id);
      }
    };
  }, [gpsState.isSupported, propAccuracy]);

  // Get status color and icon
  const getStatusDisplay = () => {
    if (!gpsState.isSupported) {
      return {
        color: 'destructive' as const,
        icon: <AlertTriangle className="h-4 w-4" />,
        text: 'Not Supported'
      };
    }

    if (gpsState.error) {
      return {
        color: 'destructive' as const,
        icon: <AlertTriangle className="h-4 w-4" />,
        text: 'Error'
      };
    }

    if (!isActive) {
      return {
        color: 'secondary' as const,
        icon: <WifiOff className="h-4 w-4" />,
        text: 'Inactive'
      };
    }

    switch (signalStrength) {
      case 'excellent':
        return {
          color: 'default' as const,
          icon: <Wifi className="h-4 w-4" />,
          text: 'Excellent'
        };
      case 'good':
        return {
          color: 'default' as const,
          icon: <Wifi className="h-4 w-4" />,
          text: 'Good'
        };
      case 'fair':
        return {
          color: 'secondary' as const,
          icon: <Wifi className="h-4 w-4" />,
          text: 'Fair'
        };
      case 'poor':
        return {
          color: 'destructive' as const,
          icon: <WifiOff className="h-4 w-4" />,
          text: 'Poor'
        };
      default:
        return {
          color: 'secondary' as const,
          icon: <WifiOff className="h-4 w-4" />,
          text: 'No Signal'
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Satellite className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">GPS Status</span>
          </div>
          <Badge variant={statusDisplay.color} className="flex items-center gap-1">
            {statusDisplay.icon}
            {statusDisplay.text}
          </Badge>
        </div>

        {accuracy && (
          <div className="mt-2 text-sm text-muted-foreground">
            Accuracy: ±{accuracy.toFixed(1)}m
          </div>
        )}

        {lastUpdate && (
          <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Last update: {lastUpdate.toLocaleTimeString()}
          </div>
        )}

        {gpsState.error && (
          <Alert variant="destructive" className="mt-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{gpsState.error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}