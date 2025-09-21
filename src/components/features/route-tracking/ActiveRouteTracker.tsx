import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Navigation, Clock, Route, Target, StopCircle, Play, Pause, AlertTriangle, Trophy, CheckCircle, Activity, Gauge } from "lucide-react";
import { GatewayAPI } from "@/lib/api";
import RouteMap from "./RouteMap";
import { validateCoordinate, isClosedLoop, calculateTotalDistance } from "@/lib/gps/coordinate-validation";

interface GPSCoordinate {
    latitude: number;
    longitude: number;
    timestamp: string;
    accuracy?: number;
    altitude?: number | null;
    speed?: number | null;
    bearing?: number | null;
}

interface ActiveRouteData {
    id: string;
    name?: string;
    description?: string;
    status: "active";
    start_time: string;
    created_at: string;
    updated_at: string;
    stats: {
        distance_meters: number | null;
        duration_seconds?: number | null;
        coordinate_count: number | null;
        is_closed_loop: boolean;
        territory_area_km2?: number | null;
    };
    coordinates: GPSCoordinate[];
}

interface ActiveRouteTrackerProps {
    userId: string;
    activeRoute: ActiveRouteData;
    onComplete: () => void;
    onStop: () => void;
    onPause?: () => void;
    onResume?: () => void;
}

export default function ActiveRouteTracker({
    userId,
    activeRoute,
    onComplete,
    onStop,
    onPause,
    onResume
}: ActiveRouteTrackerProps) {
    const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [currentSpeed, setCurrentSpeed] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
    const [showCompleteDialog, setShowCompleteDialog] = useState(false);
    const [isTracking, setIsTracking] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const watchIdRef = useRef<number | null>(null);
    const startTimeRef = useRef<Date>(new Date(activeRoute.start_time));
    const pausedTimeRef = useRef<number>(0);

    // Calculate real-time statistics
    const routeStats = useMemo(() => {
        const coordinates = activeRoute.coordinates;
        if (coordinates.length < 2) {
            return {
                distance: 0,
                averageSpeed: 0,
                maxSpeed: 0,
                coordinateCount: coordinates.length,
                isClosedLoop: false,
                duration: elapsedTime
            };
        }

        const distance = calculateTotalDistance(coordinates);
        const duration = elapsedTime / 1000; // convert to seconds
        const averageSpeed = duration > 0 ? (distance / duration) * 3.6 : 0; // km/h

        // Calculate max speed from coordinates
        const speeds = coordinates
            .filter(coord => coord.speed !== null && coord.speed !== undefined)
            .map(coord => (coord.speed || 0) * 3.6); // convert m/s to km/h
        const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;

        const closedLoop = isClosedLoop(coordinates);

        return {
            distance,
            averageSpeed,
            maxSpeed,
            coordinateCount: coordinates.length,
            isClosedLoop: closedLoop,
            duration: elapsedTime
        };
    }, [activeRoute.coordinates, elapsedTime]);

    // Start GPS tracking
    const startGPSTracking = useCallback(() => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by this browser");
            return;
        }

        const options: PositionOptions = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 1000
        };

        const handleSuccess = (position: GeolocationPosition) => {
            setCurrentLocation(position);
            setGpsAccuracy(position.coords.accuracy);
            setCurrentSpeed(position.coords.speed ? position.coords.speed * 3.6 : 0); // convert to km/h
            setError(null);

            // Validate and potentially add coordinate to route
            const coordinate: GPSCoordinate = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                timestamp: new Date().toISOString(),
                accuracy: position.coords.accuracy,
                altitude: position.coords.altitude,
                speed: position.coords.speed,
                bearing: position.coords.heading
            };

            if (validateCoordinate(coordinate)) {
                // Add coordinate to route (this would typically be sent to the backend)
                console.log("New GPS coordinate:", coordinate);
            }
        };

        const handleError = (error: GeolocationPositionError) => {
            console.error("GPS Error:", error);
            setError(`GPS Error: ${error.message}`);
        };

        watchIdRef.current = navigator.geolocation.watchPosition(
            handleSuccess,
            handleError,
            options
        );

        setIsTracking(true);
    }, []);

    // Listen to simulator events to reflect simulated location on the map
    useEffect(() => {
        const onSimLoc = (e: Event) => {
            const detail: any = (e as CustomEvent).detail;
            if (!detail) return;
            const fake: GeolocationPosition = {
                coords: {
                    latitude: detail.coords.latitude,
                    longitude: detail.coords.longitude,
                    altitude: detail.coords.altitude ?? null as any,
                    accuracy: detail.coords.accuracy ?? 5,
                    altitudeAccuracy: detail.coords.altitudeAccuracy ?? null as any,
                    heading: detail.coords.heading ?? null as any,
                    speed: detail.coords.speed ?? null as any
                },
                timestamp: detail.timestamp || Date.now()
            } as GeolocationPosition;
            setCurrentLocation(fake);
            setGpsAccuracy(fake.coords.accuracy);
            setCurrentSpeed((fake.coords.speed || 0) * 3.6);
        };
        window.addEventListener('gps:position', onSimLoc as EventListener);
        return () => window.removeEventListener('gps:position', onSimLoc as EventListener);
    }, []);

    // Stop GPS tracking
    const stopGPSTracking = useCallback(() => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        setIsTracking(false);
    }, []);

    // Update elapsed time
    useEffect(() => {
        if (isPaused) return;

        const interval = setInterval(() => {
            const now = new Date();
            const elapsed = now.getTime() - startTimeRef.current.getTime() - pausedTimeRef.current;
            setElapsedTime(elapsed);
        }, 1000);

        return () => clearInterval(interval);
    }, [isPaused]);

    // Start GPS tracking on mount
    useEffect(() => {
        startGPSTracking();
        return () => stopGPSTracking();
    }, [startGPSTracking, stopGPSTracking]);

    // Handle pause/resume
    const handlePause = useCallback(() => {
        setIsPaused(true);
        stopGPSTracking();
        onPause?.();
    }, [stopGPSTracking, onPause]);

    const handleResume = useCallback(() => {
        const pauseStart = Date.now();
        setIsPaused(false);
        startGPSTracking();
        pausedTimeRef.current += pauseStart - Date.now();
        onResume?.();
    }, [startGPSTracking, onResume]);

    // Handle complete
    const handleComplete = useCallback(async () => {
        stopGPSTracking();
        setShowCompleteDialog(true);
    }, [stopGPSTracking]);

    const confirmComplete = useCallback(async () => {
        try {
            await GatewayAPI.completeRoute(activeRoute.id, userId, {
                end_coordinate: currentLocation ? {
                    latitude: currentLocation.coords.latitude,
                    longitude: currentLocation.coords.longitude,
                    accuracy: currentLocation.coords.accuracy,
                    timestamp: new Date().toISOString()
                } : undefined,
                force_completion: false
            });
            setShowCompleteDialog(false);
            onComplete();
        } catch (error) {
            console.error("Failed to complete route:", error);
            setError("Failed to complete route. Please try again.");
        }
    }, [activeRoute.id, userId, currentLocation, onComplete]);

    // Handle stop
    const handleStop = useCallback(async () => {
        stopGPSTracking();
        try {
            await GatewayAPI.deleteRoute(activeRoute.id, userId);
            onStop();
        } catch (error) {
            console.error("Failed to stop route:", error);
            setError("Failed to stop route. Please try again.");
        }
    }, [activeRoute.id, userId, onStop, stopGPSTracking]);

    // Format time
    const formatTime = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
        }
        return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
    };

    // Format distance
    const formatDistance = (meters: number) => {
        return meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${meters.toFixed(0)} m`;
    };

    // Format speed
    const formatSpeed = (kmh: number) => {
        return `${kmh.toFixed(1)} km/h`;
    };

    // Get GPS quality status
    const getGPSQualityStatus = () => {
        if (!gpsAccuracy) return { color: 'text-gray-500', status: 'Unknown' };
        if (gpsAccuracy <= 5) return { color: 'text-green-500', status: 'Excellent' };
        if (gpsAccuracy <= 10) return { color: 'text-blue-500', status: 'Good' };
        if (gpsAccuracy <= 20) return { color: 'text-yellow-500', status: 'Fair' };
        return { color: 'text-red-500', status: 'Poor' };
    };

    const gpsStatus = getGPSQualityStatus();

    return (
        <div className="space-y-4">
            {/* Error Alert */}
            {error && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Route Status Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Route className="w-5 h-5" />
                            {activeRoute.name || `Route ${activeRoute.id.slice(0, 8)}`}
                            <Badge variant={isPaused ? "secondary" : "default"}>
                                {isPaused ? "Paused" : "Active"}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className={`w-4 h-4 ${gpsStatus.color}`} />
                            <span className="text-sm">{gpsStatus.status}</span>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Real-time stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-primary">
                                {formatTime(elapsedTime)}
                            </div>
                            <div className="text-sm text-muted-foreground">Duration</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-primary">
                                {formatDistance(routeStats.distance)}
                            </div>
                            <div className="text-sm text-muted-foreground">Distance</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-primary">
                                {formatSpeed(currentSpeed)}
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

                    {/* Additional stats */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <Gauge className="w-4 h-4 text-blue-500" />
                            <span>Avg Speed: {formatSpeed(routeStats.averageSpeed)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-green-500" />
                            <span>Max Speed: {formatSpeed(routeStats.maxSpeed)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-purple-500" />
                            <span>Closed Loop: {routeStats.isClosedLoop ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className={`w-4 h-4 ${gpsStatus.color}`} />
                            <span>GPS: ±{gpsAccuracy?.toFixed(1) || '?'}m</span>
                        </div>
                    </div>

                    {/* Territory eligibility */}
                    {routeStats.isClosedLoop && (
                        <Alert>
                            <Trophy className="h-4 w-4" />
                            <AlertDescription>
                                This route forms a closed loop and is eligible for territory claiming!
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Control buttons */}
                    <div className="flex gap-2">
                        {!isPaused ? (
                            <Button variant="secondary" onClick={handlePause} className="flex-1">
                                <Pause className="w-4 h-4 mr-2" />
                                Pause
                            </Button>
                        ) : (
                            <Button onClick={handleResume} className="flex-1">
                                <Play className="w-4 h-4 mr-2" />
                                Resume
                            </Button>
                        )}
                        <Button onClick={handleComplete} className="flex-1">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Complete
                        </Button>
                        <Button variant="destructive" onClick={handleStop}>
                            <StopCircle className="w-4 h-4 mr-2" />
                            Stop
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Route Map */}
            <Card>
                <CardContent className="p-0" style={{ height: "300px" }}>
                    <RouteMap
                        route={activeRoute}
                        currentLocation={currentLocation}
                        interactive={true}
                        className="h-full"
                    />
                </CardContent>
            </Card>

            {/* Complete Route Dialog */}
            <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            Complete Route
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p>Are you sure you want to complete this route?</p>

                        <div className="bg-muted rounded-lg p-4 space-y-2">
                            <div className="flex justify-between">
                                <span>Distance:</span>
                                <span className="font-medium">{formatDistance(routeStats.distance)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Duration:</span>
                                <span className="font-medium">{formatTime(elapsedTime)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>GPS Points:</span>
                                <span className="font-medium">{routeStats.coordinateCount}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Closed Loop:</span>
                                <span className="font-medium">{routeStats.isClosedLoop ? 'Yes' : 'No'}</span>
                            </div>
                        </div>

                        {routeStats.isClosedLoop && (
                            <Alert>
                                <Trophy className="h-4 w-4" />
                                <AlertDescription>
                                    This route will be eligible for territory claiming after completion.
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={confirmComplete}>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Complete Route
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}