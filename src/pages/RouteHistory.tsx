import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/common/PageHeader";

import {
    Route,
    Search,
    Target,
    Trash2,
    Eye,
    Calendar,
    Activity,
    StopCircle,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Clock,
    Award,
    TrendingUp,
    ArrowLeft,
    Share,
    Download,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    History
} from "lucide-react";
import { UnitsFormatter } from "@/lib/format/units";
import { GatewayAPI } from "@/lib/api";
import type { ApiResult } from "@/lib/api/types/common";
import { queryKeys } from "@/lib/query";
import { useAuth } from "@/contexts/AuthContext";
import { EmptyState } from "@/components/common/EmptyState";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import RouteMapModal from "@/components/features/route-tracking/RouteMapModal";
import TerritoryClaimRetry from "@/components/features/territory-management/TerritoryClaimRetry";


export interface RouteData {
    id: string;
    name?: string;
    description?: string;
    status: "active" | "completed" | "abandoned";
    created_at: string;
    updated_at: string;
    completed_at?: string;
    territory_id?: string;
    territory_claim_status: "pending" | "success" | "failed" | "conflict";
    territory_claim_error?: string;
    auto_claim_attempted: boolean;
    stats: {
        distance_meters: number | null;
        duration_seconds?: number | null;
        coordinate_count: number | null;
        is_closed_loop: boolean;
        territory_area_km2?: number | null;
        gps_quality_score?: number | null;
        territory_eligibility_score?: number | null;
        coordinate_quality_issues?: string[];
    };
}

const RouteHistory = () => {
    const { user } = useAuth();
    const userId = user?.id;
    const navigate = useNavigate();
    const location = useLocation();
    const { id: routeId } = useParams<{ id?: string }>();

    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebouncedValue(searchTerm, 250);
    const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "abandoned">("all");
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [routeToDelete, setRouteToDelete] = useState<{ id: string; name?: string } | null>(null);
    const [routeMapModalOpen, setRouteMapModalOpen] = useState(false);
    const [routeMapModalData, setRouteMapModalData] = useState<RouteData | null>(null);
    const [territoryRetryModalOpen, setTerritoryRetryModalOpen] = useState(false);
    const [territoryRetryRouteData, setTerritoryRetryRouteData] = useState<RouteData | null>(null);

    // Tab navigation state
    const [tab, setTab] = useState<string>("history");

    const queryClient = useQueryClient();

    // Tab change handler
    const onTabChange = (val: string) => {
        setTab(val);
        const target = val === 'active' ? '/routes/active' : '/routes/history';
        navigate(target);
    };

    useEffect(() => {
        document.title = "Route History - Route Wars";
    }, []);

    // Sync tab state with current route
    useEffect(() => {
        if (location.pathname.startsWith('/routes/history')) {
            setTab('history');
        } else if (location.pathname.startsWith('/routes/active')) {
            setTab('active');
        }
    }, [location.pathname]);

    // Fetch user routes (excluding active routes)
    const { data: userRoutes, isLoading, error, refetch } = useQuery<ApiResult<RouteData[]>, ApiResult<unknown>, RouteData[]>({
        queryKey: queryKeys.routesForUser(userId!, 50),
        queryFn: () => (userId ? GatewayAPI.routesForUser(userId, 50, statusFilter) : Promise.resolve({ ok: false } as any)),
        enabled: !!userId,
        select: (res) => (res && res.ok && Array.isArray(res.data) ? (res.data as RouteData[]).filter(r => r.status !== 'active') : []),
    });

    // Fetch selected route details if routeId is provided
    const { data: selectedRouteDetails } = useQuery({
        queryKey: queryKeys.route(routeId!, userId!),
        queryFn: () => (routeId && userId ? GatewayAPI.getRouteDetail(routeId, userId) : Promise.resolve({ ok: false } as any)),
        enabled: !!routeId && !!userId,
    });

    // Fetch route detail (with coordinates) for Route Map modal when open
    const { data: routeMapDetail } = useQuery({
        queryKey: queryKeys.route(routeMapModalData?.id!, userId!),
        queryFn: () => (routeMapModalData?.id && userId ? GatewayAPI.getRouteDetail(routeMapModalData.id, userId) : Promise.resolve({ ok: false } as any)),
        enabled: !!routeMapModalOpen && !!routeMapModalData?.id && !!userId,
    });

    // Delete route mutation
    const deleteRouteMutation = useMutation({
        mutationFn: ({ routeId, userId }: { routeId: string; userId: string }) =>
            GatewayAPI.deleteRoute(routeId, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.routesForUser(userId!) });
            setDeleteModalOpen(false);
            setRouteToDelete(null);
            // If we deleted the currently viewed route, navigate back to list
            if (routeId === routeToDelete?.id) {
                navigate('/routes/history');
            }
        },
    });

    const routes: RouteData[] = useMemo(() => (Array.isArray(userRoutes) ? userRoutes : []), [userRoutes]);

    const filteredRoutes = useMemo(() => routes.filter((route) => {
        const matchesSearch = (route.name || `Route ${route.id.slice(0, 8)}`).toLowerCase().includes(debouncedSearch.toLowerCase());
        const matchesStatus = statusFilter === "all" || route.status === statusFilter;
        return matchesSearch && matchesStatus;
    }), [routes, debouncedSearch, statusFilter]);

    // Helper functions
    const getStatusBadgeClass = useCallback((status: string) => {
        switch (status) {
            case "completed": return "bg-territory-claimed/20 text-territory-claimed";
            case "abandoned": return "bg-destructive/20 text-destructive";
            default: return "bg-muted/20 text-muted-foreground";
        }
    }, []);

    const getStatusIcon = useCallback((status: string) => {
        switch (status) {
            case "completed": return <Target className="w-4 h-4" />;
            case "abandoned": return <StopCircle className="w-4 h-4" />;
            default: return <Route className="w-4 h-4" />;
        }
    }, []);

    const getTerritoryClaimStatusBadge = useCallback((route: RouteData) => {
        if (route.status !== "completed" || !route.stats?.is_closed_loop) {
            return null;
        }

        const { territory_claim_status } = route;

        switch (territory_claim_status) {
            case "success":
                return (
                    <Badge className="bg-green-500/20 text-green-700 border-green-500/30 hover:bg-green-500/30">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Territory Claimed
                    </Badge>
                );
            case "failed":
                return (
                    <Badge className="bg-red-500/20 text-red-700 border-red-500/30 hover:bg-red-500/30">
                        <XCircle className="w-3 h-3 mr-1" />
                        Claim Failed
                    </Badge>
                );
            case "conflict":
                return (
                    <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30 hover:bg-yellow-500/30">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Territory Conflict
                    </Badge>
                );
            case "pending":
                return (
                    <Badge className="bg-blue-500/20 text-blue-700 border-blue-500/30 hover:bg-blue-500/30">
                        <Clock className="w-3 h-3 mr-1" />
                        Claim Pending
                    </Badge>
                );
            default:
                return null;
        }
    }, []);

    const formatDistance = useCallback((meters: number | null | undefined) => UnitsFormatter.distance(meters ?? null), []);

    const formatDuration = useCallback((seconds?: number) => {
        if (!seconds) return "—";
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    }, []);

    const formatDate = useCallback((dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }, []);

    // Handle actions
    const handleDeleteConfirm = useCallback(() => {
        if (routeToDelete && userId) {
            deleteRouteMutation.mutate({ routeId: routeToDelete.id, userId });
        }
    }, [routeToDelete, userId, deleteRouteMutation]);

    const handleDeleteCancel = useCallback(() => {
        setDeleteModalOpen(false);
        setRouteToDelete(null);
    }, []);

    const handleOpenRouteMap = useCallback((route: RouteData) => {
        setRouteMapModalData(route);
        setRouteMapModalOpen(true);
    }, []);

    const handleNavigateToTerritory = useCallback((territoryId: string) => {
        localStorage.setItem('highlightTerritoryId', territoryId);
        navigate(`/territory/map?highlight=${territoryId}`);
    }, [navigate]);

    const handleRetryTerritoryClaimFromRoute = useCallback((route: RouteData) => {
        setTerritoryRetryRouteData(route);
        setTerritoryRetryModalOpen(true);
    }, []);

    const handleTerritoryClaimSuccess = useCallback((territoryId: string) => {
        handleNavigateToTerritory(territoryId);
        setTerritoryRetryModalOpen(false);
        setTerritoryRetryRouteData(null);
    }, [handleNavigateToTerritory]);

    const handleShare = useCallback(async (route: RouteData) => {
        const url = `${window.location.origin}/routes/history/${route.id}`;
        if ((navigator as any).share) {
            try {
                await (navigator as any).share({ title: route.name || 'Route', url });
            } catch { }
        } else {
            try {
                await navigator.clipboard.writeText(url);
                toast.info('Link copied to clipboard');
            } catch { }
        }
    }, []);

    const handleExport = useCallback((route: RouteData) => {
        const coords = (routeMapDetail?.ok ? (routeMapDetail as any).data.coordinates : []) as Array<{ latitude: number; longitude: number; timestamp?: string }>;
        if (!coords || coords.length === 0) {
            toast.info('No coordinates to export');
            return;
        }
        const gpx = `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="Route Wars" xmlns="http://www.topografix.com/GPX/1/1">\n<trk><name>${route.name || route.id}</name><trkseg>\n${coords.map(c => `<trkpt lat="${c.latitude}" lon="${c.longitude}"></trkpt>`).join('\n')}\n</trkseg></trk></gpx>`;
        const blob = new Blob([gpx], { type: 'application/gpx+xml' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${(route.name || 'route').replace(/\s+/g, '_')}.gpx`;
        a.click();
        URL.revokeObjectURL(a.href);
    }, [routeMapDetail]);

    // Navigation between routes
    const currentRouteIndex = useMemo(() => {
        if (!routeId || !routes.length) return -1;
        return routes.findIndex(r => r.id === routeId);
    }, [routeId, routes]);

    const previousRoute = useMemo(() => {
        if (currentRouteIndex <= 0) return null;
        return routes[currentRouteIndex - 1];
    }, [currentRouteIndex, routes]);

    const nextRoute = useMemo(() => {
        if (currentRouteIndex < 0 || currentRouteIndex >= routes.length - 1) return null;
        return routes[currentRouteIndex + 1];
    }, [currentRouteIndex, routes]);

    const handleNavigateToPrevious = useCallback(() => {
        if (previousRoute) {
            navigate(`/routes/history/${previousRoute.id}`);
        }
    }, [previousRoute, navigate]);

    const handleNavigateToNext = useCallback(() => {
        if (nextRoute) {
            navigate(`/routes/history/${nextRoute.id}`);
        }
    }, [nextRoute, navigate]);

    // Keyboard navigation support
    useEffect(() => {
        if (!routeId) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            // Only handle keyboard shortcuts when not typing in an input
            if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
                return;
            }

            switch (event.key) {
                case 'ArrowLeft':
                    event.preventDefault();
                    if (previousRoute) {
                        handleNavigateToPrevious();
                    }
                    break;
                case 'ArrowRight':
                    event.preventDefault();
                    if (nextRoute) {
                        handleNavigateToNext();
                    }
                    break;
                case 'Escape':
                    event.preventDefault();
                    navigate('/routes/history');
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [routeId, previousRoute, nextRoute, handleNavigateToPrevious, handleNavigateToNext, navigate]);

    // If viewing a specific route, show route detail view
    if (routeId && selectedRouteDetails?.ok) {
        const route = selectedRouteDetails.data as RouteData;

        return (
            <div className="min-h-screen bg-background">
                <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                    {/* Enhanced navigation header */}
                    <div className="mb-6">

                        <PageHeader
                            title={route.name || `Route ${route.id.slice(0, 8)}`}
                            description={`Route details and statistics. ${route.status === 'completed' ? 'Completed' : 'Abandoned'} route from ${formatDate(route.created_at)}.`}
                            icon={Route}
                        >
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => navigate('/routes/history')}
                                        className="text-muted-foreground hover:text-foreground"
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Back to History
                                    </Button>
                                </div>
                            </div>
                        </PageHeader>

                        {/* Route navigation controls */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleNavigateToPrevious}
                                    disabled={!previousRoute}
                                    title={previousRoute ? `Previous: ${previousRoute.name || `Route ${previousRoute.id.slice(0, 8)}`}` : 'No previous route'}
                                    className="h-8 w-8 p-0"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>

                                <div className="px-3 py-1 text-sm font-medium bg-background rounded border">
                                    {currentRouteIndex + 1} / {routes.length}
                                </div>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleNavigateToNext}
                                    disabled={!nextRoute}
                                    title={nextRoute ? `Next: ${nextRoute.name || `Route ${nextRoute.id.slice(0, 8)}`}` : 'No next route'}
                                    className="h-8 w-8 p-0"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => handleOpenRouteMap(route)}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Map
                                </Button>
                                <Button variant="outline" onClick={() => handleShare(route)}>
                                    <Share className="w-4 h-4 mr-2" />
                                    Share
                                </Button>
                                <Button variant="outline" onClick={() => handleExport(route)}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Export
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => {
                                        setRouteToDelete({ id: route.id, name: route.name });
                                        setDeleteModalOpen(true);
                                    }}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Enhanced route summary bar with navigation context */}
                    <div className="bg-muted/30 rounded-lg p-4 mb-6">
                        {/* Route sequence indicator */}
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/50">
                            <div className="flex items-center gap-3">
                                <div className="text-sm font-medium text-muted-foreground">Route Sequence:</div>
                                <div className="flex items-center gap-2">
                                    {previousRoute && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleNavigateToPrevious}
                                            className="h-7 px-2 text-xs"
                                        >
                                            ← {previousRoute.name || `Route ${previousRoute.id.slice(0, 8)}`}
                                        </Button>
                                    )}
                                    <div className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
                                        Current
                                    </div>
                                    {nextRoute && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleNavigateToNext}
                                            className="h-7 px-2 text-xs"
                                        >
                                            {nextRoute.name || `Route ${nextRoute.id.slice(0, 8)}`} →
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {currentRouteIndex + 1} of {routes.length} routes
                            </div>
                        </div>

                        {/* Route statistics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div>
                                <div className="text-2xl font-bold text-primary">{formatDistance(route.stats?.distance_meters || 0)}</div>
                                <div className="text-sm text-muted-foreground">Distance</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-primary">{formatDuration(route.stats?.duration_seconds || 0)}</div>
                                <div className="text-sm text-muted-foreground">Duration</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-primary">{route.stats?.coordinate_count || 0}</div>
                                <div className="text-sm text-muted-foreground">GPS Points</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-primary">
                                    {route.stats?.territory_area_km2 ? UnitsFormatter.areaKm2(route.stats.territory_area_km2) : '—'}
                                </div>
                                <div className="text-sm text-muted-foreground">Territory Area</div>
                            </div>
                        </div>
                    </div>

                    {/* Route details */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <span>Route Information</span>
                                        <div className="text-sm font-normal text-muted-foreground">
                                            ID: {route.id.slice(0, 8)}...
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-sm text-muted-foreground">Created</div>
                                            <div className="text-sm font-medium">{formatDate(route.created_at)}</div>
                                        </div>
                                        {route.completed_at && (
                                            <div>
                                                <div className="text-sm text-muted-foreground">Completed</div>
                                                <div className="text-sm font-medium">{formatDate(route.completed_at)}</div>
                                            </div>
                                        )}
                                        <div>
                                            <div className="text-sm text-muted-foreground">Route Type</div>
                                            <div className="text-sm font-medium">{route.stats?.is_closed_loop ? 'Closed Loop' : 'Open Path'}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground">Status</div>
                                            <div className="text-sm font-medium capitalize">{route.status}</div>
                                        </div>
                                    </div>

                                    {/* Route position in collection */}
                                    <div className="pt-4 border-t">
                                        <div className="text-sm text-muted-foreground mb-2">Position in Collection</div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="font-medium">#{currentRouteIndex + 1}</span>
                                            <span className="text-muted-foreground">of {routes.length} routes</span>
                                            {route.status === 'completed' && (
                                                <Badge variant="secondary" className="text-xs">
                                                    Completed Route
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {route.description && (
                                        <div className="pt-4 border-t">
                                            <div className="text-sm text-muted-foreground mb-2">Description</div>
                                            <p className="text-sm">{route.description}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Territory information */}
                            {route.stats?.is_closed_loop && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Target className="w-5 h-5 text-primary" />
                                            Territory Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="text-center p-3 bg-muted/50 rounded-lg">
                                                <div className="text-lg font-bold text-primary">
                                                    {route.stats?.territory_area_km2 ? UnitsFormatter.areaKm2(route.stats.territory_area_km2) : '—'}
                                                </div>
                                                <div className="text-sm text-muted-foreground">Area</div>
                                            </div>
                                            <div className="text-center p-3 bg-muted/50 rounded-lg">
                                                <div className="text-lg font-bold text-primary">
                                                    {route.stats?.gps_quality_score !== null && route.stats?.gps_quality_score !== undefined ? `${route.stats.gps_quality_score.toFixed(0)}%` : '—'}
                                                </div>
                                                <div className="text-sm text-muted-foreground">GPS Quality</div>
                                            </div>
                                            <div className="text-center p-3 bg-muted/50 rounded-lg">
                                                <div className="text-lg font-bold text-primary">
                                                    {route.stats?.territory_eligibility_score !== null && route.stats?.territory_eligibility_score !== undefined ? `${route.stats.territory_eligibility_score.toFixed(0)}%` : '—'}
                                                </div>
                                                <div className="text-sm text-muted-foreground">Eligibility</div>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t space-y-2">
                                            {route.territory_claim_status === "success" && route.territory_id && (
                                                <Button
                                                    onClick={() => handleNavigateToTerritory(route.territory_id!)}
                                                    className="w-full"
                                                >
                                                    <Target className="w-4 h-4 mr-2" />
                                                    View Territory on Map
                                                </Button>
                                            )}

                                            {(route.territory_claim_status === "failed" || route.territory_claim_status === "conflict") && (
                                                <Button
                                                    onClick={() => handleRetryTerritoryClaimFromRoute(route)}
                                                    variant="outline"
                                                    className="w-full"
                                                >
                                                    <RefreshCw className="w-4 h-4 mr-2" />
                                                    Retry Territory Claim
                                                </Button>
                                            )}

                                            {route.territory_claim_status === "pending" && (
                                                <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                                                    <Clock className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                                                    <div className="text-sm text-blue-800">Territory claim is being processed...</div>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Actions and info sidebar */}
                        <div className="space-y-6">
                            {/* Route navigation card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm">Route Navigation</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Visual progress indicator */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>Route {currentRouteIndex + 1}</span>
                                            <span>{routes.length} total</span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2">
                                            <div
                                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${((currentRouteIndex + 1) / routes.length) * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Navigation buttons */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleNavigateToPrevious}
                                            disabled={!previousRoute}
                                            className="text-xs"
                                        >
                                            <ChevronLeft className="w-3 h-3 mr-1" />
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleNavigateToNext}
                                            disabled={!nextRoute}
                                            className="text-xs"
                                        >
                                            Next
                                            <ChevronRight className="w-3 h-3 ml-1" />
                                        </Button>
                                    </div>

                                    {/* Adjacent route info */}
                                    {(previousRoute || nextRoute) && (
                                        <div className="pt-3 border-t space-y-2">
                                            {previousRoute && (
                                                <div className="text-xs">
                                                    <span className="text-muted-foreground">Previous: </span>
                                                    <span className="font-medium">
                                                        {previousRoute.name || `Route ${previousRoute.id.slice(0, 8)}`}
                                                    </span>
                                                </div>
                                            )}
                                            {nextRoute && (
                                                <div className="text-xs">
                                                    <span className="text-muted-foreground">Next: </span>
                                                    <span className="font-medium">
                                                        {nextRoute.name || `Route ${nextRoute.id.slice(0, 8)}`}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Quick Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => handleOpenRouteMap(route)}
                                        className="w-full justify-start"
                                    >
                                        <Eye className="w-4 h-4 mr-2" />
                                        View on Map
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => handleShare(route)}
                                        className="w-full justify-start"
                                    >
                                        <Share className="w-4 h-4 mr-2" />
                                        Share Route
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => handleExport(route)}
                                        className="w-full justify-start"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Export GPX
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Route Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">GPS Points</span>
                                        <span className="text-sm font-medium">{route.stats?.coordinate_count || 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Route Type</span>
                                        <span className="text-sm font-medium">{route.stats?.is_closed_loop ? 'Closed Loop' : 'Open Path'}</span>
                                    </div>
                                    {route.stats?.gps_quality_score !== null && route.stats?.gps_quality_score !== undefined && (
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">GPS Quality</span>
                                            <span className={`text-sm font-medium ${route.stats.gps_quality_score >= 80 ? 'text-green-600' :
                                                route.stats.gps_quality_score >= 60 ? 'text-yellow-600' : 'text-red-600'
                                                }`}>
                                                {route.stats.gps_quality_score.toFixed(0)}%
                                            </span>
                                        </div>
                                    )}
                                    {route.stats?.territory_eligibility_score !== null && route.stats?.territory_eligibility_score !== undefined && (
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Territory Eligibility</span>
                                            <span className={`text-sm font-medium ${route.stats.territory_eligibility_score >= 80 ? 'text-green-600' :
                                                route.stats.territory_eligibility_score >= 60 ? 'text-yellow-600' : 'text-red-600'
                                                }`}>
                                                {route.stats.territory_eligibility_score.toFixed(0)}%
                                            </span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Enhanced navigation help */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <ChevronLeft className="w-4 h-4" />
                                        Navigation Guide
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-xs text-muted-foreground space-y-3">
                                    <div>
                                        <p className="font-medium text-foreground mb-1">Route Navigation</p>
                                        <p>Use the ← → arrow buttons to navigate between routes in chronological order.</p>
                                    </div>

                                    <div>
                                        <p className="font-medium text-foreground mb-1">Quick Actions</p>
                                        <p>• "View on Map" shows the full route path and territory boundaries</p>
                                        <p>• "Share" creates a shareable link to this route</p>
                                        <p>• "Export GPX" downloads route data for external use</p>
                                    </div>

                                    {route.stats?.is_closed_loop && (
                                        <div>
                                            <p className="font-medium text-foreground mb-1">Territory Claiming</p>
                                            <p>This closed loop route can be used to claim territory. Check the Territory Information section above for details.</p>
                                        </div>
                                    )}

                                    <div>
                                        <p className="font-medium text-foreground mb-1">Keyboard Shortcuts</p>
                                        <p>• ← Previous route</p>
                                        <p>• → Next route</p>
                                        <p>• Esc Back to history</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </main>

                {/* Modals */}
                <RouteMapModal
                    isOpen={routeMapModalOpen}
                    onClose={() => setRouteMapModalOpen(false)}
                    route={routeMapModalData ? {
                        id: routeMapModalData.id,
                        name: routeMapModalData.name,
                        user_id: userId || '',
                        username: user?.username || 'You',
                        completed_at: routeMapModalData.completed_at || routeMapModalData.created_at,
                        distance_meters: routeMapModalData.stats.distance_meters || 0,
                        duration_seconds: routeMapModalData.stats.duration_seconds,
                        coordinate_count: routeMapModalData.stats.coordinate_count || 0,
                        is_closed: routeMapModalData.stats.is_closed_loop,
                        gps_quality_score: routeMapModalData.stats.gps_quality_score,
                        territory_eligibility_score: routeMapModalData.stats.territory_eligibility_score,
                        territory_id: routeMapModalData.territory_id,
                        territory_claim_status: (routeMapModalData.territory_claim_status === 'conflict'
                            ? 'failed'
                            : routeMapModalData.territory_claim_status) as 'pending' | 'success' | 'failed',
                        territory_claim_error: routeMapModalData.territory_claim_error,
                        auto_claim_attempted: routeMapModalData.auto_claim_attempted
                    } : null}
                    coordinates={routeMapDetail?.ok ? (routeMapDetail as any).data.coordinates : []}
                />

                {territoryRetryRouteData && (
                    <TerritoryClaimRetry
                        isOpen={territoryRetryModalOpen}
                        onClose={() => setTerritoryRetryModalOpen(false)}
                        route={territoryRetryRouteData}
                        onSuccess={handleTerritoryClaimSuccess}
                    />
                )}

                {/* Delete confirmation dialog */}
                <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Route</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete "{routeToDelete?.name || `Route ${routeToDelete?.id.slice(0, 8)}`}"?
                                This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={handleDeleteCancel}>Cancel</Button>
                            <Button
                                variant="destructive"
                                onClick={handleDeleteConfirm}
                                disabled={deleteRouteMutation.isPending}
                            >
                                {deleteRouteMutation.isPending ? "Deleting..." : "Delete"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    // Route list view
    return (
        <div className="min-h-screen bg-background">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                <Tabs value={tab} onValueChange={onTabChange} className="mb-6">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="active">Active</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>
                </Tabs>
                <div className="mb-8">

                    <PageHeader
                        title="Route History"
                        description="View and manage your completed and abandoned routes. Track your progress and analyze past performance."
                        icon={History}
                    >
                        <div className="flex flex-col gap-2">
                            {routes.length > 0 && (
                                <div className="text-sm text-muted-foreground">
                                    Showing {filteredRoutes.length} of {routes.length} routes
                                </div>
                            )}
                        </div>
                    </PageHeader>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search routes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                            aria-label="Search routes"
                        />
                    </div>
                    <div className="flex gap-2">
                        {["all", "completed", "abandoned"].map((status) => (
                            <Button
                                key={status}
                                variant={statusFilter === status ? "default" : "outline"}
                                size="sm"
                                onClick={() => setStatusFilter(status as any)}
                                className="capitalize"
                            >
                                {status === "all" ? "All Routes" : status}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Routes List */}
                <div className="space-y-4">
                    {isLoading && (
                        <Card className="bg-card/80 border-border/50">
                            <CardContent className="p-6 text-center">
                                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                                <p className="text-muted-foreground">Loading your route history...</p>
                            </CardContent>
                        </Card>
                    )}

                    {error && (
                        <Card className="bg-destructive/10 border-destructive/30">
                            <CardContent className="p-6 text-center">
                                <p className="text-destructive">Failed to load route history</p>
                                <Button variant="outline" onClick={() => refetch()} className="mt-2">
                                    Try Again
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {!isLoading && !error && filteredRoutes.length === 0 && (
                        <EmptyState
                            Icon={Route}
                            title={routes.length === 0 ? "No Route History" : "No Routes Found"}
                            message={
                                routes.length === 0
                                    ? "You haven't completed any routes yet. Start tracking routes to build your history!"
                                    : "No routes match your current search term or filters."
                            }
                            action={
                                routes.length > 0 ? (
                                    <Button variant="outline" onClick={() => {
                                        setSearchTerm("");
                                        setStatusFilter("all");
                                    }}>
                                        Clear Filters
                                    </Button>
                                ) : (
                                    <Button onClick={() => navigate('/routes')}>
                                        Start Tracking Routes
                                    </Button>
                                )
                            }
                        />
                    )}

                    <AnimatePresence>
                        {filteredRoutes.map((route, index) => (
                            <motion.div
                                key={route.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                            >
                                <Card
                                    className="cursor-pointer transition-all duration-300 hover:shadow-glow bg-card/80 border-border/50"
                                    onClick={() => navigate(`/routes/history/${route.id}`)}
                                >
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                    {getStatusIcon(route.status)}
                                                    <h3 className="text-xl font-bold">
                                                        {route.name || `Route ${route.id.slice(0, 8)}`}
                                                    </h3>
                                                    <Badge className={getStatusBadgeClass(route.status)}>
                                                        {route.status}
                                                    </Badge>
                                                    {getTerritoryClaimStatusBadge(route)}
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4" />
                                                        {formatDate(route.created_at)}
                                                    </span>
                                                    {route.completed_at && (
                                                        <span className="flex items-center gap-1">
                                                            <Target className="w-4 h-4" />
                                                            Finished {formatDate(route.completed_at)}
                                                        </span>
                                                    )}
                                                </div>
                                                {route.description && (
                                                    <p className="text-sm text-muted-foreground">{route.description}</p>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenRouteMap(route);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                                                    title="View route on map"
                                                >
                                                    <Route className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setRouteToDelete({ id: route.id, name: route.name });
                                                        setDeleteModalOpen(true);
                                                    }}
                                                    className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                                                    title="Delete route"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Route stats */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <div className="text-muted-foreground">Distance</div>
                                                <div className="font-medium">{formatDistance(route.stats?.distance_meters || 0)}</div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground">Duration</div>
                                                <div className="font-medium">{formatDuration(route.stats?.duration_seconds || 0)}</div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground">Coordinates</div>
                                                <div className="font-medium">{route.stats?.coordinate_count || 0}</div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground">Territory Area</div>
                                                <div className="font-medium">
                                                    {route.stats?.territory_area_km2 ? UnitsFormatter.areaKm2(route.stats.territory_area_km2) : '—'}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </main>

            {/* Modals */}
            <RouteMapModal
                isOpen={routeMapModalOpen}
                onClose={() => setRouteMapModalOpen(false)}
                route={routeMapModalData ? {
                    id: routeMapModalData.id,
                    name: routeMapModalData.name,
                    user_id: userId || '',
                    username: user?.username || 'You',
                    completed_at: routeMapModalData.completed_at || routeMapModalData.created_at,
                    distance_meters: routeMapModalData.stats.distance_meters || 0,
                    duration_seconds: routeMapModalData.stats.duration_seconds,
                    coordinate_count: routeMapModalData.stats.coordinate_count || 0,
                    is_closed: routeMapModalData.stats.is_closed_loop,
                    gps_quality_score: routeMapModalData.stats.gps_quality_score,
                    territory_eligibility_score: routeMapModalData.stats.territory_eligibility_score,
                    territory_id: routeMapModalData.territory_id,
                    territory_claim_status: (routeMapModalData.territory_claim_status === 'conflict'
                        ? 'failed'
                        : routeMapModalData.territory_claim_status) as 'pending' | 'success' | 'failed',
                    territory_claim_error: routeMapModalData.territory_claim_error,
                    auto_claim_attempted: routeMapModalData.auto_claim_attempted
                } : null}
                coordinates={routeMapDetail?.ok ? (routeMapDetail as any).data.coordinates : []}
            />

            {territoryRetryRouteData && (
                <TerritoryClaimRetry
                    isOpen={territoryRetryModalOpen}
                    onClose={() => setTerritoryRetryModalOpen(false)}
                    route={territoryRetryRouteData}
                    onSuccess={handleTerritoryClaimSuccess}
                />
            )}

            {/* Delete confirmation dialog */}
            <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Route</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{routeToDelete?.name || `Route ${routeToDelete?.id.slice(0, 8)}`}"?
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleDeleteCancel}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                            disabled={deleteRouteMutation.isPending}
                        >
                            {deleteRouteMutation.isPending ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default RouteHistory;