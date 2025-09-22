import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Badge } from "../../ui/badge";
import { Switch } from "../../ui/switch";
import { Alert, AlertDescription } from "../../ui/alert";
import { Navigation, Play, Square, Pause, MapPin, Info, AlertTriangle } from "lucide-react";
import OfflineModeSwitcher from './OfflineModeSwitcher';

interface SimulatedPosition {
  coords: {
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number;
    speed: number | null;
    heading: number | null;
    altitudeAccuracy: number | null;
  };
  timestamp: number;
}

interface GPSSimulatorProps {
  onSimulationToggle?: (enabled: boolean) => void;
  className?: string;
}

const ROUTE_PATTERNS = {
  square: {
    name: "Square Loop",
    description: "Simple 200m x 200m square",
    points: [] as Array<{ lat: number; lng: number }>
  },
  circle: {
    name: "Circular Route", 
    description: "Circular path with 150m radius",
    points: [] as Array<{ lat: number; lng: number }>
  },
  figure8: {
    name: "Figure 8",
    description: "Figure-8 pattern for complex territory",
    points: [] as Array<{ lat: number; lng: number }>
  },
  random_walk: {
    name: "Random Walk",
    description: "Random movement pattern",
    points: [] as Array<{ lat: number; lng: number }>
  }
};

export default function GPSSimulator({ onSimulationToggle, className = "" }: GPSSimulatorProps) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<SimulatedPosition | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<keyof typeof ROUTE_PATTERNS>('square');
  const [speed, setSpeed] = useState(5); // km/h
  const [accuracy, setAccuracy] = useState(5); // meters
  const [updateInterval, setUpdateInterval] = useState(1000); // ms
  const [startLat, setStartLat] = useState(37.7749);
  const [startLng, setStartLng] = useState(-122.4194);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const positionIndexRef = useRef(0);
  const routePointsRef = useRef<Array<{ lat: number; lng: number }>>([]);
  const LS_KEY = 'gpssim:start';

  // Initialize start position from last known GPS, simulator cache, or navigator geolocation
  useEffect(() => {
    try {
      const last = localStorage.getItem('gps:last');
      if (last) {
        const { lat, lng } = JSON.parse(last);
        if (typeof lat === 'number' && typeof lng === 'number') {
          setStartLat(lat);
          setStartLng(lng);
          return;
        }
      }
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const { lat, lng } = JSON.parse(saved);
        if (typeof lat === 'number' && typeof lng === 'number') {
          setStartLat(lat);
          setStartLng(lng);
          return;
        }
      }
    } catch {}

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setStartLat(pos.coords.latitude);
          setStartLng(pos.coords.longitude);
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 5000 }
      );
    }
  }, []);

  // Persist start position
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ lat: startLat, lng: startLng }));
    } catch {}
  }, [startLat, startLng]);

  // If we receive a real GPS position before simulation starts, use it as the start center
  useEffect(() => {
    const handler = (e: Event) => {
      if (isSimulating) return;
      const detail: any = (e as CustomEvent).detail;
      if (!detail) return;
      setStartLat(detail.coords.latitude);
      setStartLng(detail.coords.longitude);
    };
    window.addEventListener('gps:position', handler as unknown as EventListener);
    return () => window.removeEventListener('gps:position', handler as unknown as EventListener);
  }, [isSimulating]);

  const useCurrentLocation = useCallback(() => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStartLat(pos.coords.latitude);
        setStartLng(pos.coords.longitude);
      },
      () => {}
    );
  }, []);

  const generateRoutePoints = (pattern: keyof typeof ROUTE_PATTERNS, centerLat: number, centerLng: number) => {
    const points: Array<{ lat: number; lng: number }> = [];
    const earthRadius = 6371000; // meters
    
    switch (pattern) {
      case 'square':
        const sideLength = 200; // meters
        const latOffset = (sideLength / earthRadius) * (180 / Math.PI);
        const lngOffset = (sideLength / earthRadius) * (180 / Math.PI) / Math.cos(centerLat * Math.PI / 180);
        
        points.push(
          { lat: centerLat - latOffset/2, lng: centerLng - lngOffset/2 },
          { lat: centerLat + latOffset/2, lng: centerLng - lngOffset/2 },
          { lat: centerLat + latOffset/2, lng: centerLng + lngOffset/2 },
          { lat: centerLat - latOffset/2, lng: centerLng + lngOffset/2 },
          { lat: centerLat - latOffset/2, lng: centerLng - lngOffset/2 } // Close the loop
        );
        break;
        
      case 'circle':
        const radius = 150; // meters
        const numPoints = 20;
        for (let i = 0; i <= numPoints; i++) {
          const angle = (i / numPoints) * 2 * Math.PI;
          const latOffset = (radius * Math.cos(angle) / earthRadius) * (180 / Math.PI);
          const lngOffset = (radius * Math.sin(angle) / earthRadius) * (180 / Math.PI) / Math.cos(centerLat * Math.PI / 180);
          points.push({
            lat: centerLat + latOffset,
            lng: centerLng + lngOffset
          });
        }
        break;
        
      case 'figure8':
        const fig8Radius = 100;
        const numPointsPerLoop = 15;
        
        // First loop
        for (let i = 0; i <= numPointsPerLoop; i++) {
          const angle = (i / numPointsPerLoop) * 2 * Math.PI;
          const latOffset = (fig8Radius * Math.cos(angle) / earthRadius) * (180 / Math.PI);
          const lngOffset = (fig8Radius * Math.sin(angle) / earthRadius) * (180 / Math.PI) / Math.cos(centerLat * Math.PI / 180);
          points.push({
            lat: centerLat + latOffset,
            lng: centerLng - fig8Radius/earthRadius * (180 / Math.PI) / Math.cos(centerLat * Math.PI / 180) + lngOffset
          });
        }
        
        // Second loop
        for (let i = 0; i <= numPointsPerLoop; i++) {
          const angle = (i / numPointsPerLoop) * 2 * Math.PI;
          const latOffset = (fig8Radius * Math.cos(angle) / earthRadius) * (180 / Math.PI);
          const lngOffset = (fig8Radius * Math.sin(angle) / earthRadius) * (180 / Math.PI) / Math.cos(centerLat * Math.PI / 180);
          points.push({
            lat: centerLat + latOffset,
            lng: centerLng + fig8Radius/earthRadius * (180 / Math.PI) / Math.cos(centerLat * Math.PI / 180) + lngOffset
          });
        }
        break;
        
      case 'random_walk':
        let currentLat = centerLat;
        let currentLng = centerLng;
        points.push({ lat: currentLat, lng: currentLng });
        
        for (let i = 0; i < 50; i++) {
          const stepSize = 50; // meters
          const randomAngle = Math.random() * 2 * Math.PI;
          const latStep = (stepSize * Math.cos(randomAngle) / earthRadius) * (180 / Math.PI);
          const lngStep = (stepSize * Math.sin(randomAngle) / earthRadius) * (180 / Math.PI) / Math.cos(currentLat * Math.PI / 180);
          
          currentLat += latStep;
          currentLng += lngStep;
          points.push({ lat: currentLat, lng: currentLng });
        }
        break;
    }
    
    return points;
  };

  const beginSimulationAt = (centerLat: number, centerLng: number) => {
    // Generate route points around the provided center
    routePointsRef.current = generateRoutePoints(selectedPattern, centerLat, centerLng);
    positionIndexRef.current = 0;

    setIsSimulating(true);
    onSimulationToggle?.(true);
    try {
      window.dispatchEvent(new CustomEvent('gps:sim:toggle', { detail: { enabled: true } }));
    } catch {}

    intervalRef.current = setInterval(() => {
      const points = routePointsRef.current;
      if (points.length === 0) return;

      const currentIndex = positionIndexRef.current;
      const point = points[currentIndex];

      // Add some random noise to simulate GPS inaccuracy
      const latNoise = (Math.random() - 0.5) * (accuracy / 111000); // Convert meters to degrees
      const lngNoise = (Math.random() - 0.5) * (accuracy / 111000);

      const simulatedPosition: SimulatedPosition = {
        coords: {
          latitude: point.lat + latNoise,
          longitude: point.lng + lngNoise,
          altitude: 100 + Math.random() * 50,
          accuracy: accuracy + Math.random() * 5,
          speed: (speed * 1000) / 3600, // Convert km/h to m/s
          heading: Math.random() * 360,
          altitudeAccuracy: 10
        },
        timestamp: Date.now()
      };

      setCurrentPosition(simulatedPosition);
      try {
        window.dispatchEvent(new CustomEvent('gps:position', { detail: simulatedPosition }));
      } catch {}

      // Move to next point
      positionIndexRef.current = (currentIndex + 1) % points.length;
    }, updateInterval);
  };

  const startSimulation = () => {
    if (isSimulating) return;

    // Try to anchor to the user's current geolocation when available; otherwise use last known/saved start
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setStartLat(lat);
          setStartLng(lng);
          try { localStorage.setItem(LS_KEY, JSON.stringify({ lat, lng })); } catch {}
          beginSimulationAt(lat, lng);
        },
        () => {
          // Fallback to last known stored position or current state
          try {
            const last = localStorage.getItem('gps:last');
            if (last) {
              const { lat, lng } = JSON.parse(last);
              if (typeof lat === 'number' && typeof lng === 'number') {
                setStartLat(lat);
                setStartLng(lng);
                beginSimulationAt(lat, lng);
                return;
              }
            }
          } catch {}
          beginSimulationAt(startLat, startLng);
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 5000 }
      );
    } else {
      beginSimulationAt(startLat, startLng);
    }
  };

  const stopSimulation = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsSimulating(false);
    setCurrentPosition(null);
    onSimulationToggle?.(false);
    try {
      window.dispatchEvent(new CustomEvent('gps:sim:toggle', { detail: { enabled: false } }));
    } catch {}
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            GPS Simulator
            {isSimulating && <Badge variant="secondary">Active</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This tool simulates GPS coordinates for testing route tracking and territory claiming features.
              Only use in development mode.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-lat">Start Latitude</Label>
              <Input
                id="start-lat"
                type="number"
                step="0.000001"
                value={startLat}
                onChange={(e) => setStartLat(parseFloat(e.target.value))}
                disabled={isSimulating}
              />
            </div>
            <div>
              <Label htmlFor="start-lng">Start Longitude</Label>
              <Input
                id="start-lng"
                type="number"
                step="0.000001"
                value={startLng}
                onChange={(e) => setStartLng(parseFloat(e.target.value))}
                disabled={isSimulating}
              />
            </div>
            <div className="col-span-2">
              <Button variant="outline" type="button" onClick={useCurrentLocation} disabled={isSimulating}>
                Use Current Location
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="pattern">Route Pattern</Label>
            <Select value={selectedPattern} onValueChange={(value: keyof typeof ROUTE_PATTERNS) => setSelectedPattern(value)} disabled={isSimulating}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ROUTE_PATTERNS).map(([key, pattern]) => (
                  <SelectItem key={key} value={key}>
                    <div>
                      <div className="font-medium">{pattern.name}</div>
                      <div className="text-sm text-muted-foreground">{pattern.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="speed">Speed (km/h)</Label>
              <Input
                id="speed"
                type="number"
                min="1"
                max="50"
                value={speed}
                onChange={(e) => setSpeed(parseInt(e.target.value))}
                disabled={isSimulating}
              />
            </div>
            <div>
              <Label htmlFor="accuracy">Accuracy (m)</Label>
              <Input
                id="accuracy"
                type="number"
                min="1"
                max="50"
                value={accuracy}
                onChange={(e) => setAccuracy(parseInt(e.target.value))}
                disabled={isSimulating}
              />
            </div>
            <div>
              <Label htmlFor="interval">Update Interval (ms)</Label>
              <Input
                id="interval"
                type="number"
                min="100"
                max="5000"
                step="100"
                value={updateInterval}
                onChange={(e) => setUpdateInterval(parseInt(e.target.value))}
                disabled={isSimulating}
              />
            </div>
          </div>

          <div className="flex gap-2">
            {!isSimulating ? (
              <Button onClick={startSimulation} className="flex-1">
                <Play className="h-4 w-4 mr-2" />
                Start Simulation
              </Button>
            ) : (
              <Button onClick={stopSimulation} variant="destructive" className="flex-1">
                <Square className="h-4 w-4 mr-2" />
                Stop Simulation
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {currentPosition && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Current Simulated Position
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium">Latitude</div>
                <div className="font-mono">{currentPosition.coords.latitude.toFixed(6)}</div>
              </div>
              <div>
                <div className="font-medium">Longitude</div>
                <div className="font-mono">{currentPosition.coords.longitude.toFixed(6)}</div>
              </div>
              <div>
                <div className="font-medium">Accuracy</div>
                <div>{currentPosition.coords.accuracy.toFixed(1)}m</div>
              </div>
              <div>
                <div className="font-medium">Speed</div>
                <div>{currentPosition.coords.speed ? (currentPosition.coords.speed * 3.6).toFixed(1) : 0} km/h</div>
              </div>
              <div>
                <div className="font-medium">Heading</div>
                <div>{currentPosition.coords.heading?.toFixed(0)}°</div>
              </div>
              <div>
                <div className="font-medium">Timestamp</div>
                <div>{new Date(currentPosition.timestamp).toLocaleTimeString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      <OfflineModeSwitcher />
    </div>
  );
}