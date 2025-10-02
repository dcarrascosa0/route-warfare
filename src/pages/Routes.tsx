import { useEffect, useMemo, useState, useCallback, memo } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/common/PageHeader";

import { Route, Search, Target, Trash2, Eye, Calendar, Activity, StopCircle, AlertTriangle, CheckCircle, XCircle, Clock, Award, TrendingUp, RefreshCw, MapPin } from "lucide-react";
import { UnitsFormatter } from "@/lib/format/units";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GatewayAPI } from "@/lib/api";
import type { ApiResult } from "@/lib/api/types/common";
import { queryKeys, invalidateQueries } from "@/lib/query";
import { useActiveRoute } from "@/hooks/useApiQueries";
import LiveRouteTracker from "@/components/features/route-tracking/LiveRouteTracker";
import FirstRunOnboarding from "@/components/common/FirstRunOnboarding";
import GPSSimulator from "@/components/common/dev/GPSSimulator";

import RouteMapModal from "@/components/features/route-tracking/RouteMapModal";
import TerritoryClaimRetry from "@/components/features/territory-management/TerritoryClaimRetry";
import { EmptyState } from "@/components/common/EmptyState";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useTerritory } from "@/hooks/useTerritory";
import { useWebSocketManager } from "@/hooks/useWebSocketManager";

import ClaimCelebration from "@/components/features/territory-management/ClaimCelebration";


const MemoizedLiveRouteTracker = memo(LiveRouteTracker);
const MemoizedGPSSimulator = memo(GPSSimulator);




export interface RouteData {
  id: string;
  name?: string;
  description?: string;
  status: "active" | "completed" | "abandoned";
  created_at: string;
  updated_at: string;
  completed_at?: string;
  // Territory integration fields
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
    // Enhanced territory metrics
    gps_quality_score?: number | null;
    territory_eligibility_score?: number | null;
    coordinate_quality_issues?: string[];
  };
}

type NearbySuggestion = { id: string; name?: string; area_km2?: number };

const Routes = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  // Determine active tab from URL
  const [tab, setTab] = useState<string>(() => (location.pathname.includes('/history') ? 'history' : 'active'));
  useEffect(() => {
    setTab(location.pathname.includes('/history') ? 'history' : 'active');
  }, [location.pathname]);

  const onTabChange = (val: string) => {
    setTab(val);
    
    // Reset search and filters when switching to Active tab
    if (val === 'active') {
      setSearchTerm("");
      setStatusFilter("all");
    }
    
    const target = val === 'history' ? '/routes/history' : '/routes/active';
    if (location.pathname !== target && !location.pathname.startsWith('/routes/history/')) {
      navigate(target, { replace: true });
    }
  };
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm, 250);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed" | "abandoned">("all");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState<{ id: string; name?: string } | null>(null);
  const [routeMapModalOpen, setRouteMapModalOpen] = useState(false);
  const [routeMapModalData, setRouteMapModalData] = useState<RouteData | null>(null);
  const [territoryRetryModalOpen, setTerritoryRetryModalOpen] = useState(false);
  const [territoryRetryRouteData, setTerritoryRetryRouteData] = useState<RouteData | null>(null);
  const [claimCelebrationOpen, setClaimCelebrationOpen] = useState(false);
  const [celebrationTerritoryId, setCelebrationTerritoryId] = useState<string | null>(null);


  const queryClient = useQueryClient();
  const { onMessage } = useWebSocketManager({ autoConnect: true });

  useEffect(() => {
    document.title = "My Routes - Route Wars";

    // Check if we should select a specific route (from territory navigation)
    const selectedRouteId = localStorage.getItem('selectedRouteId');
    if (selectedRouteId) {
      setSelectedRoute(selectedRouteId);
      localStorage.removeItem('selectedRouteId'); // Clean up

      // Show a toast to indicate the route was selected
      toast.info("Route selected from territory", {
        description: `Viewing route ${selectedRouteId.slice(0, 8)}...`
      });
    }
  }, []);

  // Real-time updates: listen for completion/deletion to refresh lists immediately
  useEffect(() => {
    if (!userId) return;
    const offCompleted = onMessage('route_completed', () => {
      invalidateQueries.routes(queryClient, userId);
    });
    const offDeleted = onMessage('route_deleted', () => {
      invalidateQueries.routes(queryClient, userId);
    });
    const offStats = onMessage('route_stats_updated', () => {
      invalidateQueries.activeRoute(queryClient, userId);
    });
    const offTerritoryClaimed = onMessage('territory_claimed', () => {
      invalidateQueries.territories(queryClient, userId);
      invalidateQueries.territoryStatistics(queryClient, userId);
    });
    return () => {
      offCompleted?.();
      offDeleted?.();
      offStats?.();
      offTerritoryClaimed?.();
    };
  }, [onMessage, queryClient, userId]);



  // Fetch active route
  const { data: activeRoute, refetch: refetchActiveRoute, isLoading: isLoadingActiveRoute } = useActiveRoute(userId);

  // Fetch user routes
  const { data: userRoutes, isLoading, error, refetch } = useQuery<ApiResult<RouteData[]>, ApiResult<unknown>, RouteData[]>({
    queryKey: queryKeys.routesForUser(userId!, 50),
    queryFn: () => (userId ? GatewayAPI.routesForUser(userId, 50, statusFilter) : Promise.resolve({ ok: false } as any)),
    enabled: !!userId,
    select: (res) => (res && res.ok && Array.isArray(res.data) ? (res.data as RouteData[]) : []),
  });

  // Pre-run loop planning: nearby suggestions
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => { },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const { data: nearbySuggestions, isLoading: loadingSuggestions } = useQuery<ApiResult<NearbySuggestion[]>, ApiResult<unknown>, NearbySuggestion[]>({
    queryKey: ['nearby-territories', userCoords?.lat, userCoords?.lng],
    queryFn: () => (userCoords ? GatewayAPI.getNearbyTerritories(userCoords.lat, userCoords.lng, 5000) : Promise.resolve({ ok: false } as any)),
    enabled: !!userCoords,
    select: (res) => (res && res.ok && Array.isArray(res.data) ? res.data.slice(0, 3) : []),
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
      setSelectedRoute(null);
      setDeleteModalOpen(false);
      setRouteToDelete(null);
    },
  });

  // Handle delete confirmation
  const handleDeleteConfirm = useCallback(() => {
    if (routeToDelete && userId) {
      deleteRouteMutation.mutate({ routeId: routeToDelete.id, userId });
    }
  }, [routeToDelete, userId, deleteRouteMutation]);

  // Handle delete cancel
  const handleDeleteCancel = useCallback(() => {
    setDeleteModalOpen(false);
    setRouteToDelete(null);
  }, []);

  // Handle route map modal
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
    // Navigate to the newly claimed territory
    handleNavigateToTerritory(territoryId);
    setTerritoryRetryModalOpen(false);
    setTerritoryRetryRouteData(null);
    setCelebrationTerritoryId(territoryId);
    setClaimCelebrationOpen(true);
  }, [handleNavigateToTerritory]);

  const routes: RouteData[] = useMemo(() => (Array.isArray(userRoutes) ? userRoutes : []), [userRoutes]);

  const getStatusBadgeClass = useCallback((status: string) => {
    // Use static class names so Tailwind can tree-shake correctly
    switch (status) {
      case "active": return "bg-primary/20 text-primary";
      case "completed": return "bg-territory-claimed/20 text-territory-claimed";
      case "abandoned": return "bg-destructive/20 text-destructive";
      default: return "bg-muted/20 text-muted-foreground";
    }
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case "active": return <Activity className="w-4 h-4" />;
      case "completed": return <Target className="w-4 h-4" />;
      case "abandoned": return <StopCircle className="w-4 h-4" />;
      default: return <Route className="w-4 h-4" />;
    }
  }, []);

  const getTerritoryClaimStatusBadge = useCallback((route: RouteData) => {
    if (route.status !== "completed" || !route.stats.is_closed_loop) {
      return null;
    }

    const { territory_claim_status, territory_id, territory_claim_error } = route;

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

  const getTerritoryImpactMetrics = useCallback((route: RouteData) => {
    const { stats } = route;
    const metrics = [];

    if (stats.territory_area_km2) {
      metrics.push({
        label: "Territory Area",
        value: `${stats.territory_area_km2.toFixed(3)} km²`,
        icon: <Target className="w-4 h-4" />,
        color: "text-green-600"
      });
    }

    if (stats.gps_quality_score !== null && stats.gps_quality_score !== undefined) {
      const qualityColor = stats.gps_quality_score >= 80 ? "text-green-600" :
        stats.gps_quality_score >= 60 ? "text-yellow-600" : "text-red-600";
      metrics.push({
        label: "GPS Quality",
        value: `${stats.gps_quality_score.toFixed(0)}%`,
        icon: <Award className="w-4 h-4" />,
        color: qualityColor
      });
    }

    if (stats.territory_eligibility_score !== null && stats.territory_eligibility_score !== undefined) {
      const eligibilityColor = stats.territory_eligibility_score >= 80 ? "text-green-600" :
        stats.territory_eligibility_score >= 60 ? "text-yellow-600" : "text-red-600";
      metrics.push({
        label: "Territory Eligibility",
        value: `${stats.territory_eligibility_score.toFixed(0)}%`,
        icon: <TrendingUp className="w-4 h-4" />,
        color: eligibilityColor
      });
    }

    return metrics;
  }, []);

  const filteredRoutes = useMemo(() => {
    // For Active tab, don't apply search/status filters - just return all routes
    if (tab === 'active') {
      return routes;
    }
    
    // For History tab, apply search and status filters
    return routes.filter((route) => {
      const matchesSearch = (route.name || `Route ${route.id.slice(0, 8)}`).toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesStatus = statusFilter === "all" || route.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [routes, debouncedSearch, statusFilter, tab]);

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

  // Handle route lifecycle events
  const handleRouteComplete = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.routesForUser(userId!) });
    queryClient.invalidateQueries({ queryKey: queryKeys.activeRoute(userId!) });
    queryClient.invalidateQueries({ queryKey: ["territories"] });
    queryClient.invalidateQueries({ queryKey: ["userTerritories", userId] });
    queryClient.invalidateQueries({ queryKey: ["contestedTerritories"] });
  }, [queryClient, userId]);

  const handleRouteStart = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.routesForUser(userId!) });
    queryClient.invalidateQueries({ queryKey: queryKeys.activeRoute(userId!) });
  }, [queryClient, userId]);

  const handleRouteStop = useCallback(async () => {
    // Add a small delay to ensure the API call completes
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.routesForUser(userId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.activeRoute(userId!) });
    }, 100);
  }, [queryClient, userId]);

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <FirstRunOnboarding onComplete={() => { /* no-op */ }} />
        <Tabs value={tab} onValueChange={onTabChange} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="mb-8">
          <PageHeader
            title="My Routes"
            description="Track your GPS routes and claim territory by completing closed loops. Start new routes or manage your route history."
            icon={Route}
          >
            <div className="flex flex-col gap-2">

            </div>
          </PageHeader>

          {/* Live Route Tracking - only show on Active tab */}
          {tab === 'active' && (
            <div className="mb-8">
              <MemoizedLiveRouteTracker
                userId={userId!}
                onRouteComplete={handleRouteComplete}
                onRouteStart={handleRouteStart}
                onRouteStop={handleRouteStop}
              />
              
              {/* GPS Simulator - Development only */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-4">
                  <MemoizedGPSSimulator />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Search and Filters - Only show in History tab */}
        {tab === 'history' && (
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
        )}

        <div className="space-y-4">
          {/* Suggested Loops Nearby */}
          {userCoords && (
            <Card className="bg-card/80 border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Suggested Loops Nearby</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingSuggestions ? (
                  <div className="text-sm text-muted-foreground">Finding suggested loops…</div>
                ) : nearbySuggestions && nearbySuggestions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {nearbySuggestions.map((t: any) => (
                      <div key={t.id} className="p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                        <div className="font-medium truncate">{t.name || `Territory ${String(t.id).slice(0, 8)}`}</div>
                        <div className="text-xs text-muted-foreground">~{UnitsFormatter.areaKm2(t.area_km2 || 0)}</div>
                        <div className="mt-2 flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleNavigateToTerritory(t.id)}>
                            Plan on Map
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No suggestions nearby yet. Start a route to discover opportunities.</div>
                )}
              </CardContent>
            </Card>
          )}
          {isLoading && (
            <Card className="bg-card/80 border-border/50">
              <CardContent className="p-6 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading your routes...</p>
              </CardContent>
            </Card>
          )}

          {error && (
            <Card className="bg-destructive/10 border-destructive/30">
              <CardContent className="p-6 text-center">
                <p className="text-destructive">Failed to load routes</p>
                <Button variant="outline" onClick={() => refetch()} className="mt-2">
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          {!isLoading && !error && filteredRoutes.length === 0 && (
            <EmptyState
              Icon={Route}
              title={routes.length === 0 ? "No Routes Yet" : "No Routes Found"}
              message={
                routes.length === 0
                  ? "Start your first route using the live tracker above to begin claiming territory!"
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
                ) : null
              }
            />
          )}

          <AnimatePresence>
            {filteredRoutes
              .filter(r => tab === 'active' ? r.status === 'active' : r.status !== 'active')
              .map((route, index) => (
                <motion.div
                  key={route.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card
                    className={`cursor-pointer transition-all duration-300 hover:shadow-glow ${selectedRoute === route.id ? 'ring-2 ring-primary shadow-glow' : 'bg-card/80 border-border/50'
                      }`}
                    onClick={() => {
                      if (tab === 'history') {
                        navigate(`/routes/history/${route.id}`);
                      } else {
                        setSelectedRoute(route.id);
                      }
                    }}
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
                              setSelectedRoute(route.id);
                            }}
                            title="View route details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
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
                          {route.territory_claim_status === "success" && route.territory_id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNavigateToTerritory(route.territory_id);
                              }}
                              className="text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
                              title="View claimed territory"
                            >
                              <MapPin className="w-4 h-4" />
                            </Button>
                          )}
                          {route.territory_claim_status === "failed" && route.stats.is_closed_loop && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRetryTerritoryClaimFromRoute(route);
                              }}
                              className="text-orange-600 hover:text-orange-700 border-orange-200 hover:border-orange-300"
                              title="Retry territory claiming"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                          )}
                          {route.status !== "active" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRouteToDelete({ id: route.id, name: route.name });
                                setDeleteModalOpen(true);
                              }}
                              className="text-destructive hover:text-destructive"
                              title="Delete route"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* Basic Statistics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Distance</p>
                            <p className="font-semibold text-primary">{formatDistance(route.stats.distance_meters)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Duration</p>
                            <p className="font-semibold">{formatDuration(route.stats.duration_seconds)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Points</p>
                            <p className="font-semibold">{route.stats.coordinate_count ?? 0}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Claim</p>
                            <p className="font-semibold text-territory-claimed">
                              {route.stats.territory_area_km2
                                ? UnitsFormatter.areaKm2(route.stats.territory_area_km2)
                                : route.stats.is_closed_loop ? "Loop closed (claimable)" : "Open route"}
                            </p>
                          </div>
                        </div>

                        {/* Territory Impact Metrics */}
                        {getTerritoryImpactMetrics(route).length > 0 && (
                          <div className="border-t pt-3">
                            <p className="text-sm text-muted-foreground mb-2">Territory Impact</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {getTerritoryImpactMetrics(route).map((metric, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <span className={metric.color}>{metric.icon}</span>
                                  <div>
                                    <p className="text-xs text-muted-foreground">{metric.label}</p>
                                    <p className={`text-sm font-medium ${metric.color}`}>{metric.value}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Territory Claim Error */}
                        {route.territory_claim_error && (
                          <div className="border-t pt-3">
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                              <div className="flex items-start gap-2">
                                <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-sm font-medium text-red-800">Territory Claim Failed</p>
                                  <p className="text-xs text-red-600 mt-1">
                                    {typeof route.territory_claim_error === 'string'
                                      ? route.territory_claim_error
                                      : route.territory_claim_error
                                        ? JSON.stringify(route.territory_claim_error)
                                        : 'Unknown error'
                                    }
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* GPS Quality Issues */}
                        {route.stats.coordinate_quality_issues && route.stats.coordinate_quality_issues.length > 0 && (
                          <div className="border-t pt-3">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                              <div className="flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-sm font-medium text-yellow-800">GPS Quality Issues</p>
                                  <ul className="text-xs text-yellow-600 mt-1 space-y-1">
                                    {route.stats.coordinate_quality_issues.map((issue, index) => (
                                      <li key={index}>• {issue}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Territory Navigation Quick Actions */}
                        {route.stats.is_closed_loop && route.status === "completed" && (
                          <div className="border-t pt-3">
                            <div className="text-sm font-medium mb-2 flex items-center gap-2">
                              <Target className="w-4 h-4 text-primary" />
                              Territory Actions
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              {route.territory_claim_status === "success" && route.territory_id && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleNavigateToTerritory(route.territory_id);
                                  }}
                                  className="text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
                                >
                                  <MapPin className="w-4 h-4 mr-1" />
                                  View Territory
                                </Button>
                              )}
                              {route.territory_claim_status === "failed" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRetryTerritoryClaimFromRoute(route);
                                  }}
                                  className="text-orange-600 hover:text-orange-700 border-orange-200 hover:border-orange-300"
                                >
                                  <RefreshCw className="w-4 h-4 mr-1" />
                                  Retry Claim
                                </Button>
                              )}
                              {/* no conflict state */}
                              {!route.territory_claim_status && route.auto_claim_attempted === false && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRetryTerritoryClaimFromRoute(route);
                                  }}
                                  className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                                >
                                  <Target className="w-4 h-4 mr-1" />
                                  Claim Territory
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
          </AnimatePresence>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Route
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this route? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {routeToDelete && (
            <div className="py-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="font-medium text-sm">
                  {routeToDelete.name || `Route ${routeToDelete.id.slice(0, 8)}`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  ID: {routeToDelete.id}
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleDeleteCancel}
              disabled={deleteRouteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteRouteMutation.isPending}
              className="flex items-center gap-2"
            >
              {deleteRouteMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete Route
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Route Map Modal */}
      <RouteMapModal
        isOpen={routeMapModalOpen}
        onClose={() => {
          setRouteMapModalOpen(false);
          setRouteMapModalData(null);
        }}
        route={routeMapModalData ? {
          id: routeMapModalData.id,
          name: routeMapModalData.name,
          user_id: userId || '',
          username: (user && user.username) || 'You',
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



      {/* Territory Claim Retry Modal */}
      {territoryRetryRouteData && (
        <TerritoryClaimRetry
          route={territoryRetryRouteData}
          isOpen={territoryRetryModalOpen}
          onClose={() => {
            setTerritoryRetryModalOpen(false);
            setTerritoryRetryRouteData(null);
          }}
          onSuccess={handleTerritoryClaimSuccess}
          onViewRoute={(routeId) => {
            setSelectedRoute(routeId);
            setTerritoryRetryModalOpen(false);
            setTerritoryRetryRouteData(null);
          }}
        />
      )}

      {/* Claim Celebration */}
      <ClaimCelebration
        isOpen={claimCelebrationOpen}
        onClose={() => setClaimCelebrationOpen(false)}
        territoryId={celebrationTerritoryId}
        onViewTerritory={(tid) => {
          setClaimCelebrationOpen(false);
          handleNavigateToTerritory(tid);
        }}
      />
    </div>
  );
};

export default Routes;