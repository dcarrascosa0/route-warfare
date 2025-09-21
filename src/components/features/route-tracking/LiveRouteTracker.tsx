import { useCallback, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
    Play, Pause, Square, CheckCircle, Route, Trophy, 
    AlertTriangle, MapPin, Clock, Activity 
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { GatewayAPI } from "@/lib/api";
import { useRouteTracker } from "@/hooks/useRouteTracker";
import RealTimeRouteMap from "./RealTimeRouteMap";
import { toast } from "sonner";

interface LiveRouteTrackerProps {
    userId: string;
    onRouteComplete?: () => void;
    onRouteStart?: () => void;
    onRouteStop?: () => void;
}

export default function LiveRouteTracker({
    userId,
    onRouteComplete,
    onRouteStart,
    onRouteStop
}: LiveRouteTrackerProps) {
    const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null);
    const [showCompleteDialog, setShowCompleteDialog] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);

    const tracker = useRouteTracker(userId);

    // Fetch active route data
    const { data: activeRouteData, refetch: refetchActiveRoute } = useQuery({
        queryKey: ["activeRoute", userId],
        queryFn: () => GatewayAPI.getActiveRoute(userId),
        enabled: !!userId,
        refetchInterval: tracker.isTracking ? 3000 : false, // Refresh every 3 seconds when tracking
        staleTime: 0,
    });

    const activeRoute = activeRouteData?.ok ? activeRouteData.data : null;

    // GPS tracking effect
    const startGPSTracking = useCallback(() => {
        if (!navigator.geolocation) {
            toast.error("GPS not supported by this browser");
            return;
        }

        const options: PositionOptions = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 2000
        };

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                setCurrentLocation(position);
            },
            (error) => {
                console.error("GPS Error:", error);
                toast.error(`GPS Error: ${error.message}`);
            },
            options
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    // Handle route start
    const handleStart = useCallback(async () => {
        try {
            const success = await tracker.start({
                name: `Route ${new Date().toLocaleDateString()}`,
                description: "GPS tracked route"
            });

            if (success) {
                startGPSTracking();
                refetchActiveRoute();
                onRouteStart?.();
                toast.success("Route tracking started!");
            } else {
                toast.error(tracker.error || "Failed to start route");
            }
        } catch (error) {
            console.error("Error starting route:", error);
            toast.error("Failed to start route");
        }
    }, [tracker, startGPSTracking, refetchActiveRoute, onRouteStart]);

    // Handle route completion
    const handleComplete = useCallback(async () => {
        if (!activeRoute) return;
        
        setShowCompleteDialog(true);
    }, [activeRoute]);

    const confirmComplete = useCallback(async () => {
        if (!activeRoute || isCompleting) return;

        setIsCompleting(true);
        try {
            const success = await tracker.stop(false); // Don't auto-claim territory
            
            if (success) {
                setShowCompleteDialog(false);
                refetchActiveRoute();
                onRouteComplete?.();
                toast.success("Route completed successfully!");
            } else {
                toast.error(tracker.error || "Failed to complete route");
            }
        } catch (error) {
            console.error("Error completing route:", error);
            toast.error("Failed to complete route");
        } finally {
            setIsCompleting(false);
        }
    }, [activeRoute, tracker, refetchActiveRoute, onRouteComplete, isCompleting]);

    // Handle route stop/cancel
    const handleStop = useCallback(async () => {
        try {
            const success = await tracker.stop(false);
            
            if (success) {
                refetchActiveRoute();
                onRouteStop?.();
                toast.info("Route tracking stopped");
            } else {
                toast.error(tracker.error || "Failed to stop route");
            }
        } catch (error) {
            console.error("Error stopping route:", error);
            toast.error("Failed to stop route");
        }
    }, [tracker, refetchActiveRoute, onRouteStop]);

    // Format elapsed time
    const formatElapsedTime = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
        }
        return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
    };

    // Check if route is eligible for territory claiming
    const isEligibleForTerritory = activeRoute?.coordinates?.length >= 4 && 
        activeRoute.stats?.is_closed_loop;

    // No active route - show start option
    if (!tracker.isTracking && !activeRoute) {
        return (
            <Card className="bg-gradient-to-br from-background via-background/95 to-primary/5 border-primary/20">
                <CardContent className="p-8 text-center">
                    <div className="mb-6">
                        <Route className="w-16 h-16 text-primary mx-auto mb-4" />
                        <h3 className="text-2xl font-bold mb-2">Ready to Start Tracking</h3>
                        <p className="text-muted-foreground">
                            Start a new route to track your GPS path and potentially claim territory.
                        </p>
                    </div>
                    
                    <Button 
                        onClick={handleStart} 
                        size="lg"
                        className="bg-gradient-to-r from-primary to-orange-500 hover:shadow-glow"
                    >
                        <Play className="w-5 h-5 mr-2" />
                        Start Route Tracking
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // Show error state
    if (tracker.error) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{tracker.error}</AlertDescription>
            </Alert>
        );
    }

    // Active route tracking interface
    return (
        <div className="space-y-6">
            {/* Route Status Header */}
            <Card className="bg-gradient-to-r from-primary/10 to-orange-500/10 border-primary/20">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Route className="w-6 h-6 text-primary" />
                            <div>
                                <h3 className="text-xl font-bold">
                                    {activeRoute?.name || `Route ${activeRoute?.id?.slice(0, 8) || 'Active'}`}
                                </h3>
                                <p className="text-sm text-muted-foreground font-normal">
                                    Started {tracker.startedAt ? new Date(tracker.startedAt).toLocaleTimeString() : 'recently'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge 
                                variant={tracker.isTracking ? "default" : "secondary"}
                                className={tracker.isTracking ? "bg-green-500/20 text-green-700" : ""}
                            >
                                <Activity className="w-3 h-3 mr-1" />
                                {tracker.isTracking ? "Tracking" : "Paused"}
                            </Badge>
                            {isEligibleForTerritory && (
                                <Badge className="bg-orange-500/20 text-orange-700 border-orange-500/30">
                                    <Trophy className="w-3 h-3 mr-1" />
                                    Territory Eligible
                                </Badge>
                            )}
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span className="font-mono text-lg">
                                    {formatElapsedTime(tracker.elapsedMs)}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4 text-muted-foreground" />
                                <span>{activeRoute?.stats?.coordinate_count || 0} GPS points</span>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleComplete}
                                disabled={!activeRoute || activeRoute.coordinates?.length < 2}
                            >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Complete Route
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleStop}
                            >
                                <Square className="w-4 h-4 mr-2" />
                                Stop Tracking
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Real-time Map */}
            {activeRoute && (
                <RealTimeRouteMap
                    activeRoute={activeRoute}
                    currentLocation={currentLocation}
                    isTracking={tracker.isTracking}
                    height="500px"
                />
            )}

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
                        <p>Are you ready to complete this route?</p>
                        
                        {activeRoute && (
                            <div className="bg-muted rounded-lg p-4 space-y-2">
                                <div className="flex justify-between">
                                    <span>Distance:</span>
                                    <span className="font-medium">
                                        {activeRoute.stats?.distance_meters ? 
                                            `${(activeRoute.stats.distance_meters / 1000).toFixed(2)} km` : 
                                            'Calculating...'
                                        }
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Duration:</span>
                                    <span className="font-medium">{formatElapsedTime(tracker.elapsedMs)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>GPS Points:</span>
                                    <span className="font-medium">{activeRoute.stats?.coordinate_count || 0}</span>
                                </div>
                                {isEligibleForTerritory && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Territory Eligible:</span>
                                        <span className="font-medium">Yes (Closed Loop)</span>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {isEligibleForTerritory && (
                            <Alert>
                                <Trophy className="h-4 w-4" />
                                <AlertDescription>
                                    This route forms a closed loop and can be used to claim territory after completion.
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>

                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => setShowCompleteDialog(false)}
                            disabled={isCompleting}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={confirmComplete}
                            disabled={isCompleting}
                            className="bg-gradient-to-r from-primary to-orange-500"
                        >
                            {isCompleting ? (
                                <>
                                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                                    Completing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Complete Route
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}