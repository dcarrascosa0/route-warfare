import { useCallback, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Play, Square, CheckCircle, Route, Trophy,
    AlertTriangle, MapPin, Clock, Activity, Shield, Eye, EyeOff, Target
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GatewayAPI } from "@/lib/api";
import { useRouteTracker } from "@/hooks/useRouteTracker";
import { useRealTimeRouteTracking } from "@/hooks/useWebSocketManager";
import EnhancedActiveRouteMap from "./EnhancedActiveRouteMap";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query/query-client";
import { useEffect } from "react";
import { CompleteRouteModal } from "./CompleteRouteModal";
import { CompleteRouteResponse } from "@/lib/api/types/routes";
import { calculatePolylineDistance } from "@/lib/geo/distance";

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
    const [showCompleteDialog, setShowCompleteDialog] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);
    const [completionResult, setCompletionResult] = useState<CompleteRouteResponse | null>(null);
    const [completionError, setCompletionError] = useState<string | null>(null);
    const [territoryPreviewEnabled, setTerritoryPreviewEnabled] = useState(true);
    const [statsUpdateTrigger, setStatsUpdateTrigger] = useState(0);

    const tracker = useRouteTracker(userId);
    const queryClient = useQueryClient();

    // Fetch active route data
    const { data: activeRouteData, refetch: refetchActiveRoute } = useQuery({
        queryKey: queryKeys.activeRoute(userId),
        queryFn: async () => {
            // First try to get active route
            const result = await GatewayAPI.getActiveRoute(userId);

            // If we have an active route but no tracking state, it might be stuck
            if (result.ok && result.data && !tracker.isTracking) {
                const route = result.data as any;
                // Check if route has no coordinates and is older than 5 minutes
                if ((!route.coordinates || route.coordinates.length === 0)) {
                    const routeAge = Date.now() - new Date(route.created_at).getTime();
                    if (routeAge > 5 * 60 * 1000) { // 5 minutes
                        console.log("Found potentially stuck route, attempting cleanup");
                        try {
                            // Try to cleanup stuck routes via API client
                            await GatewayAPI.cleanupStuckRoutes(userId, 5);
                            // Refetch after cleanup
                            return await GatewayAPI.getActiveRoute(userId);
                        } catch (error) {
                            console.error("Failed to cleanup stuck routes:", error);
                        }
                    }
                }
            }

            return result;
        },
        enabled: !!userId,
        refetchInterval: false, // Now handled by WebSocket
        staleTime: 0,
    });

    const activeRouteFromQuery = activeRouteData?.ok ? activeRouteData.data : null;

    // WebSocket connection for real-time updates
    const { routeData, onRouteStatsUpdated } = useRealTimeRouteTracking(activeRouteFromQuery?.id);

    // Prioritize tracker state when tracking is active, merging with backend data
    const activeRoute = useMemo(() => {
        const baseRoute = activeRouteFromQuery;

        if (tracker.isTracking) {
            const localStats = {
                distance_meters: calculatePolylineDistance(tracker.trackedCoordinates),
                duration_seconds: tracker.elapsedMs / 1000,
                coordinate_count: tracker.trackedCoordinates.length,
            };

            // Merge stats: start with base, add WebSocket, then add most recent local stats.
            // Preserve server-calculated fields like is_closed_loop from WebSocket stats.
            const mergedStats = {
                ...baseRoute?.stats,
                ...routeData.stats,
                ...localStats,
                // Preserve important server-calculated fields
                is_closed_loop: routeData.stats?.is_closed_loop ?? baseRoute?.stats?.is_closed_loop ?? false,
            };

            return {
                ...baseRoute,
                id: tracker.routeId,
                coordinates: tracker.trackedCoordinates,
                status: "active",
                created_at: new Date(tracker.startedAt || Date.now()).toISOString(),
                updated_at: new Date().toISOString(),
                stats: mergedStats,
            };
        }

        // If not tracking, but we have WS data, merge it into the query data.
        if (!tracker.isTracking && baseRoute && routeData.stats) {
            return {
                ...baseRoute,
                stats: {
                    ...baseRoute.stats,
                    ...routeData.stats,
                },
            };
        }

        // Otherwise, just use the data from the query
        return baseRoute;
    }, [activeRouteFromQuery, tracker.isTracking, tracker.routeId, tracker.trackedCoordinates, tracker.startedAt, tracker.elapsedMs, routeData.stats]);


    useEffect(() => {
        if (routeData.coordinates.length > 0 || routeData.stats) {
            queryClient.setQueryData(queryKeys.activeRoute(userId), (oldData: any) => {
                if (!oldData || !oldData.ok || !oldData.data) return oldData;

                const updatedRoute = { ...oldData.data };
                if (routeData.coordinates.length > 0) {
                    updatedRoute.coordinates = routeData.coordinates;
                }
                if (routeData.stats) {
                    updatedRoute.stats = routeData.stats;
                }

                return { ...oldData, data: updatedRoute };
            });
        }
    }, [routeData, userId, queryClient]);

    // Listen for WebSocket route stats updates
    useEffect(() => {
        if (!activeRoute?.id) return;

        const unsubscribe = onRouteStatsUpdated?.((data) => {
                        if (import.meta.env.MODE === 'development') console.log('Received route stats update:', data);
            // The stats are already updated in routeData by the WebSocket hook
        });

        return unsubscribe;
    }, [activeRoute?.id, onRouteStatsUpdated]);

    // Handle route start
    const handleStart = useCallback(async () => {
        try {
            const success = await tracker.start({
                name: `Route ${new Date().toLocaleDateString()}`,
                description: "GPS tracked route"
            });

            if (success) {
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
    }, [tracker, refetchActiveRoute, onRouteStart]);

    // Handle route completion
    const handleComplete = useCallback(async () => {
        if (!tracker.routeId) return;

        setShowCompleteDialog(true);
    }, [tracker.routeId]);

    const confirmComplete = useCallback(async (name: string) => {
        if (!tracker.routeId || isCompleting) return;

        setIsCompleting(true);
        setCompletionError(null);
        setCompletionResult(null);

        try {
            // Use the enhanced route completion that includes territory claiming
            const result = await GatewayAPI.completeRoute(tracker.routeId, userId, {
                name,
                completion: {
                    completed_at: new Date().toISOString(),
                    distance: routeStats.distance.meters,
                    duration: routeStats.duration.seconds,
                }
            });

            if (result.ok && result.data) {
                setCompletionResult(result.data as CompleteRouteResponse);

                // Stop the tracker
                await tracker.flush();
                tracker.cleanup();

                // Refresh data
                refetchActiveRoute();
                queryClient.invalidateQueries({ queryKey: queryKeys.routesForUser(userId) });

                // Show success message based on territory claiming result
                const territoryStatus = (result.data as CompleteRouteResponse).territory_claim_status;
                if (territoryStatus === 'success') {
                    const area = (result.data as CompleteRouteResponse).territory_claim?.area_km2 || 0;
                    toast.success(`Route completed! Territory claimed: ${area.toFixed(2)} km²`);
                } else if (territoryStatus === 'blocked') {
                    toast.warning("Route completed, but territory claiming was blocked due to conflicts.");
                } else if (territoryStatus === 'ineligible') {
                    toast.info("Route completed. This route was not eligible for territory claiming.");
                } else {
                    toast.success("Route completed successfully!");
                }

                onRouteComplete?.();
            } else {
                const errorMessage = (result.error as any)?.message || "Failed to complete route";
                setCompletionError(errorMessage);
                toast.error(errorMessage);
            }
        } catch (error) {
            console.error("Error completing route:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to complete route";
            setCompletionError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsCompleting(false);
        }
    }, [tracker, refetchActiveRoute, onRouteComplete, isCompleting, queryClient, userId]);

    // Handle route stop/cancel
    const handleStop = useCallback(async () => {
        try {
            // Immediately clear the active route data for instant UI feedback
            queryClient.setQueryData(queryKeys.activeRoute(userId), { ok: false, data: null });

            const success = await tracker.cancel();

            if (success) {
                // Invalidate queries to ensure fresh data on next fetch
                queryClient.invalidateQueries({ queryKey: queryKeys.activeRoute(userId) });
                queryClient.invalidateQueries({ queryKey: queryKeys.routesForUser(userId) });

                onRouteStop?.();
                toast.info("Route tracking stopped");
            } else {
                // Revert the optimistic update if it failed
                refetchActiveRoute();
                toast.error(tracker.error || "Failed to stop route");
            }
        } catch (error) {
            console.error("Error stopping route:", error);
            // Revert the optimistic update if it failed
            refetchActiveRoute();
            toast.error("Failed to stop route");
        }
    }, [tracker, refetchActiveRoute, onRouteStop, userId, queryClient]);

    // Handle manual cleanup of stuck routes
    const handleCleanupStuckRoutes = useCallback(async () => {
        try {
            const response = await GatewayAPI.cleanupStuckRoutes(userId, 1);
            if (response.ok) {
                const result: any = response.data;
                if ((result?.cleaned_count || 0) > 0) {
                    toast.success(`Cleaned up ${result.cleaned_count} stuck route(s)`);
                } else {
                    toast.info("No stuck routes found to clean up");
                }
                // Refresh the active route data
                queryClient.invalidateQueries({ queryKey: queryKeys.activeRoute(userId) });
                refetchActiveRoute();
            } else {
                toast.error("Failed to cleanup stuck routes");
            }
        } catch (error) {
            console.error("Error cleaning up stuck routes:", error);
            toast.error("Failed to cleanup stuck routes");
        }
    }, [userId, queryClient, refetchActiveRoute]);

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

    // Calculate comprehensive route statistics using WebSocket data when available
    const calculateRouteStats = () => {
        const coordinates = activeRoute?.coordinates || [];

        // Use WebSocket stats if available, otherwise fall back to local calculation
        const wsStats = routeData.stats;
        const localStats = (activeRoute as any)?.stats || {};
        const stats = wsStats || localStats;

        const elapsedSeconds = tracker.elapsedMs / 1000;

        // Distance calculation - prefer WebSocket data
        const distanceMeters = stats?.distance_meters || 0;
        const distanceKm = distanceMeters / 1000;

        // Duration calculation - prefer WebSocket data
        const durationSeconds = stats?.duration_seconds || elapsedSeconds;

        // Speed calculations
        const currentSpeed = tracker.currentLocation?.coords?.speed || 0; // m/s
        const currentSpeedKmh = currentSpeed * 3.6;
        const averageSpeedKmh = durationSeconds > 0 ? (distanceKm / (durationSeconds / 3600)) : 0;

        // Pace calculation (minutes per km)
        const paceMinPerKm = distanceKm > 0 ? (durationSeconds / 60) / distanceKm : 0;

        // Elevation (if available)
        const currentAltitude = tracker.currentLocation?.coords?.altitude || null;

        // GPS accuracy (if available)
        const gpsAccuracy = tracker.currentLocation?.coords?.accuracy || null;

        return {
            distance: {
                meters: distanceMeters,
                km: distanceKm,
                formatted: distanceKm >= 1 ? `${distanceKm.toFixed(2)} km` : `${Math.round(distanceMeters)} m`
            },
            speed: {
                current: currentSpeedKmh,
                average: averageSpeedKmh,
                currentFormatted: `${currentSpeedKmh.toFixed(1)} km/h`,
                averageFormatted: `${averageSpeedKmh.toFixed(1)} km/h`
            },
            pace: {
                minPerKm: paceMinPerKm,
                formatted: paceMinPerKm > 0 ? `${Math.floor(paceMinPerKm)}:${Math.floor((paceMinPerKm % 1) * 60).toString().padStart(2, '0')}/km` : '--:--/km'
            },
            elevation: {
                current: currentAltitude,
                formatted: currentAltitude ? `${Math.round(currentAltitude)} m` : 'N/A'
            },
            gps: {
                accuracy: gpsAccuracy,
                quality: gpsAccuracy ? (gpsAccuracy < 10 ? 'excellent' : gpsAccuracy < 20 ? 'good' : gpsAccuracy < 50 ? 'fair' : 'poor') : 'unknown',
                formatted: gpsAccuracy ? `±${Math.round(gpsAccuracy)}m` : 'N/A'
            },
            points: coordinates.length,
            duration: {
                seconds: durationSeconds,
                formatted: formatElapsedTime(durationSeconds * 1000) // Convert back to ms for formatting
            }
        };
    };

    const routeStats = useMemo(() => calculateRouteStats(), [
        activeRoute?.coordinates?.length,
        tracker.elapsedMs,
        tracker.currentLocation,
        (activeRoute as any)?.stats,
        routeData.stats, // Include WebSocket stats
        statsUpdateTrigger
    ]);

    // Update stats every second when tracking
    useEffect(() => {
        if (!tracker.isTracking) return;

        const interval = setInterval(() => {
            setStatsUpdateTrigger(prev => prev + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [tracker.isTracking]);

    // Enhanced territory eligibility logic
    const getTerritoryEligibility = () => {
        const coordinateCount = activeRoute?.coordinates?.length || 0;

        // Use WebSocket stats if available, otherwise fall back to local stats
        const wsStats = routeData.stats;
        const localStats = (activeRoute as any)?.stats;
        const stats = wsStats || localStats;

        const distanceMeters = stats?.distance_meters || 0;
        const isClosedLoop = stats?.is_closed_loop || false;

        // Minimum requirements for territory claiming
        const minCoordinates = 4;
        const minDistanceMeters = 100; // 100 meters minimum

        const hasMinCoordinates = coordinateCount >= minCoordinates;
        const hasMinDistance = distanceMeters >= minDistanceMeters;
        const hasClosedLoop = isClosedLoop;

        if (hasMinCoordinates && hasMinDistance && hasClosedLoop) {
            return {
                eligible: true,
                status: 'eligible',
                reason: 'Route meets all territory requirements',
                badge: 'Territory Eligible',
                color: 'bg-green-500/20 text-green-700 border-green-500/30'
            };
        } else if (hasMinCoordinates && hasMinDistance) {
            return {
                eligible: false,
                status: 'partial',
                reason: 'Route needs to form a closed loop for territory claiming',
                badge: 'Needs Closed Loop',
                color: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30'
            };
        } else if (hasMinCoordinates) {
            return {
                eligible: false,
                status: 'insufficient',
                reason: `Route needs ${minDistanceMeters - distanceMeters}m more distance`,
                badge: 'Too Short',
                color: 'bg-orange-500/20 text-orange-700 border-orange-500/30'
            };
        } else {
            return {
                eligible: false,
                status: 'starting',
                reason: `Need ${minCoordinates - coordinateCount} more GPS points`,
                badge: 'Building Route',
                color: 'bg-blue-500/20 text-blue-700 border-blue-500/30'
            };
        }
    };

    const territoryEligibility = useMemo(() => getTerritoryEligibility(), [
        activeRoute?.coordinates?.length,
        routeData.stats,
        (activeRoute as any)?.stats
    ]);

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

    // Active route tracking interface
    return (
        <div className="space-y-4 md:space-y-6">
            {/* Show error state */}
            {tracker.error && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="flex justify-between items-center">
                        <span>{tracker.error}</span>
                        <Button variant="ghost" size="sm" onClick={tracker.clearError}>
                            Clear
                        </Button>
                    </AlertDescription>
                </Alert>
            )}
            {/* Route Status Header */}
            <Card className="bg-gradient-to-r from-primary/10 to-orange-500/10 border-primary/20">
                <CardHeader className="p-4 md:p-6">
                    <CardTitle className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Route className="w-6 h-6 text-primary" />
                            <div>
                                <h3 className="text-lg md:text-xl font-bold">
                                    {(activeRoute as any)?.name || `Route ${(activeRoute as any)?.id?.slice(0, 8) || 'Active'}`}
                                </h3>
                                <p className="text-xs md:text-sm text-muted-foreground font-normal">
                                    Started {tracker.startedAt ? new Date(tracker.startedAt).toLocaleTimeString() : 'recently'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 self-end md:self-center">
                            <Badge
                                variant={tracker.isTracking ? "default" : "secondary"}
                                className={tracker.isTracking ? "bg-green-500/20 text-green-700" : ""}
                            >
                                <Activity className="w-3 h-3 mr-1" />
                                {tracker.isTracking ? "Tracking" : "Paused"}
                            </Badge>

                            {/* Enhanced Territory Status Badge */}
                            <Badge
                                className={territoryEligibility.color}
                                title={territoryEligibility.reason}
                            >
                                {territoryEligibility.eligible ? (
                                    <Trophy className="w-3 h-3 mr-1" />
                                ) : territoryEligibility.status === 'partial' ? (
                                    <Target className="w-3 h-3 mr-1" />
                                ) : territoryEligibility.status === 'insufficient' ? (
                                    <MapPin className="w-3 h-3 mr-1" />
                                ) : (
                                    <Shield className="w-3 h-3 mr-1" />
                                )}
                                {territoryEligibility.badge}
                            </Badge>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0">
                    {/* Enhanced Route Statistics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        {/* Duration */}
                        <div className="flex flex-col items-center p-3 bg-muted/30 rounded-lg">
                            <Clock className="w-5 h-5 text-primary mb-1" />
                            <span className="font-mono text-lg font-bold">{routeStats.duration.formatted}</span>
                            <span className="text-xs text-muted-foreground">Duration</span>
                        </div>

                        {/* Distance */}
                        <div className="flex flex-col items-center p-3 bg-muted/30 rounded-lg">
                            <MapPin className="w-5 h-5 text-blue-500 mb-1" />
                            <span className="font-mono text-lg font-bold">{routeStats.distance.formatted}</span>
                            <span className="text-xs text-muted-foreground">Distance</span>
                        </div>

                        {/* Current Speed */}
                        <div className="flex flex-col items-center p-3 bg-muted/30 rounded-lg">
                            <Activity className="w-5 h-5 text-green-500 mb-1" />
                            <span className="font-mono text-lg font-bold">{routeStats.speed.currentFormatted}</span>
                            <span className="text-xs text-muted-foreground">Current Speed</span>
                        </div>

                        {/* Average Speed */}
                        <div className="flex flex-col items-center p-3 bg-muted/30 rounded-lg">
                            <Target className="w-5 h-5 text-orange-500 mb-1" />
                            <span className="font-mono text-lg font-bold">{routeStats.speed.averageFormatted}</span>
                            <span className="text-xs text-muted-foreground">Avg Speed</span>
                        </div>
                    </div>

                    {/* Additional Stats Row */}
                    <div className="grid grid-cols-4 gap-3 mb-4">
                        {/* Pace */}
                        <div className="flex flex-col items-center p-2 bg-muted/20 rounded">
                            <span className="font-mono text-sm font-bold">{routeStats.pace.formatted}</span>
                            <span className="text-xs text-muted-foreground">Pace</span>
                        </div>

                        {/* GPS Points */}
                        <div className="flex flex-col items-center p-2 bg-muted/20 rounded">
                            <span className="font-mono text-sm font-bold">{routeStats.points}</span>
                            <span className="text-xs text-muted-foreground">GPS Points</span>
                        </div>

                        {/* Elevation */}
                        <div className="flex flex-col items-center p-2 bg-muted/20 rounded">
                            <span className="font-mono text-sm font-bold">{routeStats.elevation.formatted}</span>
                            <span className="text-xs text-muted-foreground">Elevation</span>
                        </div>

                        {/* GPS Accuracy */}
                        <div className="flex flex-col items-center p-2 bg-muted/20 rounded">
                            <div className="flex items-center gap-1">
                                <div className={`w-2 h-2 rounded-full ${routeStats.gps.quality === 'excellent' ? 'bg-green-500' :
                                    routeStats.gps.quality === 'good' ? 'bg-blue-500' :
                                        routeStats.gps.quality === 'fair' ? 'bg-yellow-500' :
                                            routeStats.gps.quality === 'poor' ? 'bg-red-500' : 'bg-gray-500'
                                    }`} />
                                <span className="font-mono text-sm font-bold">{routeStats.gps.formatted}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">GPS Accuracy</span>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">

                        <div className="flex items-center gap-2 self-end md:self-center">
                            {/* Territory Preview Toggle */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setTerritoryPreviewEnabled(!territoryPreviewEnabled)}
                                title={territoryPreviewEnabled ? "Hide territory preview" : "Show territory preview"}
                                className="text-xs"
                            >
                                {territoryPreviewEnabled ? (
                                    <Eye className="w-4 h-4 md:mr-1" />
                                ) : (
                                    <EyeOff className="w-4 h-4 md:mr-1" />
                                )}
                                <span className="hidden md:inline">
                                    {territoryPreviewEnabled ? "Hide" : "Show"} Territory
                                </span>
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleComplete}
                                disabled={!activeRoute || (activeRoute.coordinates?.length || 0) < 2}
                                title="Finish and save this route"
                            >
                                <CheckCircle className="w-4 h-4 md:mr-2" />
                                <span className="hidden md:inline">Complete</span>
                            </Button>
                            {tracker.isTracking && !tracker.isPaused && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => { await tracker.pause(); }}
                                    title="Pause tracking"
                                >
                                    <Square className="w-4 h-4 md:mr-2" />
                                    <span className="hidden md:inline">Pause</span>
                                </Button>
                            )}
                            {tracker.isTracking && tracker.isPaused && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => { await tracker.resume(); }}
                                    title="Resume tracking"
                                >
                                    <Play className="w-4 h-4 md:mr-2" />
                                    <span className="hidden md:inline">Resume</span>
                                </Button>
                            )}
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleStop}
                                title="Cancel and delete this active route"
                            >
                                <Square className="w-4 h-4 md:mr-2" />
                                <span className="hidden md:inline">Cancel</span>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Territory Information Panel */}
            {activeRoute && (
                <Card className="bg-gradient-to-r from-orange-500/5 to-primary/5 border-orange-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Shield className="w-5 h-5 text-orange-500" />
                                <div>
                                    <h4 className="font-medium text-sm">Territory Status</h4>
                                    <p className="text-xs text-muted-foreground">
                                        {territoryEligibility.reason}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {territoryEligibility.eligible && (
                                    <Badge className="bg-green-500/20 text-green-700 text-xs">
                                        <Trophy className="w-3 h-3 mr-1" />
                                        Ready to Claim
                                    </Badge>
                                )}

                                {territoryPreviewEnabled && (
                                    <Badge variant="outline" className="text-xs">
                                        <Eye className="w-3 h-3 mr-1" />
                                        Preview Active
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* Territory Requirements Progress */}
                        <div className="mt-3 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Territory Requirements</span>
                                <span className="font-medium">
                                    {territoryEligibility.eligible ? "✓ All Met" : "In Progress"}
                                </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className={`flex items-center gap-1 ${(activeRoute.coordinates?.length || 0) >= 4 ? "text-green-600" : "text-gray-500"
                                    }`}>
                                    <div className={`w-2 h-2 rounded-full ${(activeRoute.coordinates?.length || 0) >= 4 ? "bg-green-500" : "bg-gray-300"
                                        }`} />
                                    GPS Points ({activeRoute.coordinates?.length || 0}/4)
                                </div>

                                <div className={`flex items-center gap-1 ${routeStats.distance.meters >= 100 ? "text-green-600" : "text-gray-500"
                                    }`}>
                                    <div className={`w-2 h-2 rounded-full ${routeStats.distance.meters >= 100 ? "bg-green-500" : "bg-gray-300"
                                        }`} />
                                    Distance ({routeStats.distance.formatted})
                                </div>

                                <div className={`flex items-center gap-1 ${(activeRoute as any)?.stats?.is_closed_loop ? "text-green-600" : "text-gray-500"
                                    }`}>
                                    <div className={`w-2 h-2 rounded-full ${(activeRoute as any)?.stats?.is_closed_loop ? "bg-green-500" : "bg-gray-300"
                                        }`} />
                                    Closed Loop
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Real-time Map */}
            {activeRoute && (
                <EnhancedActiveRouteMap
                    userId={userId}
                    activeRoute={activeRoute}
                    currentLocation={tracker.currentLocation}
                    height="500px"
                    territoryPreviewEnabled={territoryPreviewEnabled}
                    onTerritoryPreviewClick={(preview) => {
                        // Handle territory preview click - could show details modal
                        if (import.meta.env.MODE === 'development') console.log('Territory preview clicked:', preview);
                    }}
                />
            )}

            {/* Complete Route Dialog */}
            <CompleteRouteModal
                isOpen={showCompleteDialog}
                onClose={() => {
                    setShowCompleteDialog(false);
                    setCompletionResult(null);
                    setCompletionError(null);
                }}
                onConfirm={confirmComplete}
                isCompleting={isCompleting}
                completionResult={completionResult}
                completionError={completionError}
                coordinates={activeRoute?.coordinates || []}
            />
        </div>
    );
}