import { useEffect, useMemo, useState, useCallback, memo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Route, Search, Target, Trash2, Eye, Calendar, Activity, StopCircle, AlertTriangle, CheckCircle, XCircle, Clock, Award, TrendingUp, RefreshCw } from "lucide-react";
import { UnitsFormatter } from "@/lib/format/units";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GatewayAPI } from "@/lib/api";
import { queryKeys, invalidateQueries } from "@/lib/query";
import { useActiveRoute } from "@/hooks/useApiQueries";
import LiveRouteTracker from "@/components/features/route-tracking/LiveRouteTracker";
import GPSSimulator from "@/components/common/dev/GPSSimulator";
import RouteMapModal from "@/components/features/route-tracking/RouteMapModal";
import TerritoryClaimRetry from "@/components/features/territory-management/TerritoryClaimRetry";
import { EmptyState } from "@/components/common/EmptyState";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useTerritory } from "@/hooks/useTerritory";
import { useWebSocketManager } from "@/hooks/useWebSocketManager";
import { MapPin, Maximize } from "lucide-react";

const MemoizedLiveRouteTracker = memo(LiveRouteTracker);
const MemoizedGPSSimulator = memo(GPSSimulator);

// Simple territory preview component for showing conquered territory
const TerritoryPreview = ({ territoryData, onViewFullMap }: {
  territoryData: any,
  onViewFullMap: () => void
}) => {
  if (!territoryData?.ok || !territoryData.data) return null;

  const territory = territoryData.data;
  const coordinates = territory.boundary_coordinates || [];

  // Calculate center point of the territory
  const center = useMemo(() => {
    if (!coordinates || coordinates.length === 0) return [0, 0];
    const lats = coordinates.map((c: any) => c.latitude);
    const lngs = coordinates.map((c: any) => c.longitude);
    return [
      (Math.min(...lats) + Math.max(...lats)) / 2,
      (Math.min(...lngs) + Math.max(...lngs)) / 2
    ];
  }, [coordinates]);

  if (coordinates.length === 0) {
    return (
      <div className="bg-white rounded border h-32 flex items-center justify-center">
        <div className="text-center text-green-600">
          <MapPin className="w-8 h-8 mx-auto mb-1" />
          <p className="text-sm font-medium">
            {territory.name || `Territory ${territory.id.slice(0, 8)}`}
          </p>
          <p className="text-xs text-green-600">
            {territory.area_km2.toFixed(2)} km²
          </p>
        </div>
      </div>
    );
  }

  // Simple polygon representation
  const polygonPoints = coordinates.map((coord: any, index: number) => {
    const x = ((coord.longitude - center[1]) * 100) + 50; // Simple scaling
    const y = ((coord.latitude - center[0]) * 100) + 50;  // Simple scaling
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="bg-white rounded border h-32 overflow-hidden relative">
      <svg className="w-full h-full" viewBox="0 0 100 100">
        <defs>
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#f0f0f0" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#grid)" />

        {/* Territory polygon */}
        <polygon
          points={polygonPoints}
          fill="rgba(34, 197, 94, 0.3)"
          stroke="rgba(34, 197, 94, 0.8)"
          strokeWidth="1"
        />

        {/* Center point */}
        <circle cx="50" cy="50" r="2" fill="#22c55e" />
      </svg>

      <div className="absolute bottom-1 left-1 text-xs text-green-700 bg-white/90 rounded px-1 font-medium">
        {territory.name || `Territory ${territory.id.slice(0, 8)}`}
      </div>
      <div className="absolute bottom-1 right-1 text-xs text-green-600 bg-white/80 rounded px-1">
        {territory.area_km2.toFixed(1)} km²
      </div>

      <Button
        size="sm"
        variant="outline"
        className="absolute top-1 right-1 h-6 text-xs bg-white/90 hover:bg-white"
        onClick={onViewFullMap}
      >
        <Maximize className="w-3 h-3" />
      </Button>
    </div>
  );
};

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

const Routes = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  // Determine active tab from URL
  const [tab, setTab] = useState<string>(() => (location.pathname.includes('/history') ? 'history' : 'active'));
  useEffect(() => {
    setTab(location.pathname.includes('/history') ? 'history' : 'active');
  }, [location.pathname]);

  const onTabChange = (val: string) => {
    setTab(val);
    const target = val === 'history' ? '/routes/history' : '/routes/active';
    if (location.pathname !== target && !location.pathname.startsWith('/routes/history/')) {
      navigate(target, { replace: true });
    }
  };
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed" | "abandoned">("all");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState<{ id: string; name?: string } | null>(null);
  const [routeMapModalOpen, setRouteMapModalOpen] = useState(false);
  const [routeMapModalData, setRouteMapModalData] = useState<RouteData | null>(null);
  const [territoryRetryModalOpen, setTerritoryRetryModalOpen] = useState(false);
  const [territoryRetryRouteData, setTerritoryRetryRouteData] = useState<RouteData | null>(null);


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

  // Open drawer when history route id is present in URL
  const params = useParams<{ id?: string }>();
  useEffect(() => {
    if (location.pathname.startsWith('/routes/history') && params.id) {
      setSelectedRoute(params.id);
      setHistoryDrawerOpen(true);
    }
  }, [location.pathname, params.id]);

  // Fetch active route
  const { data: activeRoute, refetch: refetchActiveRoute, isLoading: isLoadingActiveRoute } = useActiveRoute(userId);

  // Fetch user routes
  const { data: userRoutes, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.routesForUser(userId!, 50),
    queryFn: () => (userId ? GatewayAPI.routesForUser(userId, 50, statusFilter) : Promise.resolve({ ok: false } as any)),
    enabled: !!userId,
  });

  // Fetch selected route details
  const { data: selectedRouteDetails } = useQuery({
    queryKey: queryKeys.route(selectedRoute!, userId!),
    queryFn: () => (selectedRoute && userId ? GatewayAPI.getRouteDetail(selectedRoute, userId) : Promise.resolve({ ok: false } as any)),
    enabled: !!selectedRoute && !!userId,
  });

  // Fetch route detail (with coordinates) for Route Map modal when open
  const { data: routeMapDetail } = useQuery({
    queryKey: queryKeys.route(routeMapModalData?.id!, userId!),
    queryFn: () => (routeMapModalData?.id && userId ? GatewayAPI.getRouteDetail(routeMapModalData.id, userId) : Promise.resolve({ ok: false } as any)),
    enabled: !!routeMapModalOpen && !!routeMapModalData?.id && !!userId,
  });

  // Fetch territory data when a route has a successful claim
  const { data: territoryData } = useQuery({
    queryKey: queryKeys.territory(selectedRouteDetails?.data?.territory_id!),
    queryFn: () => (selectedRouteDetails?.data?.territory_id && selectedRouteDetails.data.territory_claim_status === "success"
      ? GatewayAPI.getTerritory(selectedRouteDetails.data.territory_id)
      : Promise.resolve({ ok: false } as any)),
    enabled: !!selectedRouteDetails?.data?.territory_id && selectedRouteDetails.data.territory_claim_status === "success",
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
  }, [handleNavigateToTerritory]);

  const routes: RouteData[] = useMemo(() => {
    const ok = (userRoutes as any)?.ok && (userRoutes as any)?.data;
    if (!ok) return [];
    const list = (userRoutes as any).data as RouteData[];
    return Array.isArray(list) ? list : [];
  }, [userRoutes]);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "active": return "primary";
      case "completed": return "territory-claimed";
      case "abandoned": return "destructive";
      default: return "muted";
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

  const filteredRoutes = useMemo(() => routes.filter((route) => {
    const matchesSearch = (route.name || `Route ${route.id.slice(0, 8)}`).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || route.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [routes, searchTerm, statusFilter]);

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
        <Tabs value={tab} onValueChange={onTabChange} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">My Routes</h1>
              <p className="text-lg sm:text-xl text-muted-foreground">
                Track your GPS routes and claim territory by completing closed loops.
              </p>
            </div>
            <Button
              onClick={() => {
                refetchActiveRoute();
                queryClient.invalidateQueries({ queryKey: queryKeys.routesForUser(userId!) });
              }}
              variant="outline"
              disabled={isLoadingActiveRoute}
              className="mt-4 sm:mt-0"
            >
              <Activity className="w-4 h-4 mr-2" />
              {isLoadingActiveRoute ? "Refreshing..." : "Refresh"}
            </Button>
          </div>

          {/* Live Route Tracking - only show on Active tab */}
          {tab === 'active' && (
            <div className="mb-8">
              <MemoizedLiveRouteTracker
                userId={userId!}
                onRouteComplete={handleRouteComplete}
                onRouteStart={handleRouteStart}
                onRouteStop={handleRouteStop}
              />
            </div>
          )}
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
            />
          </div>
          <div className="flex gap-2">
            {["all", "active", "completed", "abandoned"].map((status) => (
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

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Routes List */}
          <div className="xl:col-span-2 space-y-4">
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
                      setSelectedRoute(route.id);
                      if (tab === 'history') setHistoryDrawerOpen(true);
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
                            <Badge className={`bg-${getStatusColor(route.status)}/20 text-${getStatusColor(route.status)}`}>
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

          {/* Route Details Sidebar */}
          <div className="space-y-6">
            {selectedRoute && selectedRouteDetails?.ok ? (
              <>
                <Card className="bg-card/80 border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Target className="w-5 h-5 text-primary" />
                      Route Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const route = selectedRouteDetails.data as RouteData;
                      return (
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold mb-1">
                              {route.name || `Route ${route.id.slice(0, 8)}`}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {route.description || "No description provided"}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Status</p>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(route.status)}
                                <span className="font-medium capitalize">{route.status}</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Created</p>
                              <p className="font-medium">{formatDate(route.created_at)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Distance</p>
                              <p className="font-medium text-primary">{formatDistance(route.stats.distance_meters)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Duration</p>
                              <p className="font-medium">{formatDuration(route.stats.duration_seconds)}</p>
                            </div>
                          </div>

                          {route.stats.is_closed_loop && (
                            <div className="p-3 bg-territory-claimed/10 rounded-lg border border-territory-claimed/30">
                              <div className="flex items-center gap-2 mb-1">
                                <Target className="w-4 h-4 text-territory-claimed" />
                                <span className="font-medium text-territory-claimed">Closed Loop Route</span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                This route forms a closed loop and can be used to claim territory.
                              </p>
                              {route.stats.territory_area_km2 && (
                                <p className="text-sm font-medium mt-1">
                                  Territory Area: {UnitsFormatter.areaKm2(route.stats.territory_area_km2)}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Conquered Territory Preview */}
                          {territoryData?.ok && (
                            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                              <div className="flex items-center gap-2 mb-2">
                                <MapPin className="w-4 h-4 text-green-600" />
                                <span className="font-medium text-green-800">Conquered Territory</span>
                              </div>
                              <TerritoryPreview
                                territoryData={territoryData}
                                onViewFullMap={() => handleOpenRouteMap(route)}
                              />
                              <p className="text-xs text-green-600 mt-1">
                                Territory claimed successfully! Use "View Territory" to see it on the full map.
                              </p>
                            </div>
                          )}

                          <div className="pt-2 border-t">
                            <p className="text-sm text-muted-foreground mb-2">GPS Points</p>
                            <p className="font-medium">{route.stats.coordinate_count ?? 0} coordinates recorded</p>
                          </div>

                          {/* Territory Context and Actions */}
                          {route.stats.is_closed_loop && (
                            <div className="pt-3 border-t space-y-3">
                              <h5 className="font-medium text-sm">Territory Actions</h5>

                              {route.territory_claim_status === "success" && route.territory_id && (
                                <Button
                                  size="sm"
                                  className="w-full bg-green-600 hover:bg-green-700"
                                  onClick={() => handleNavigateToTerritory(route.territory_id!)}
                                >
                                  <Target className="w-4 h-4 mr-2" />
                                  View Claimed Territory
                                </Button>
                              )}

                              {route.territory_claim_status === "failed" && (
                                <div className="space-y-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full text-orange-600 border-orange-200 hover:bg-orange-50"
                                    onClick={() => handleRetryTerritoryClaimFromRoute(route)}
                                  >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Retry Territory Claim
                                  </Button>
                                  <p className="text-xs text-muted-foreground">
                                    Open detailed retry dialog with error analysis
                                  </p>
                                </div>
                              )}

                              {route.territory_claim_status === "conflict" && (
                                <div className="space-y-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                                    onClick={() => {
                                      // TODO: Implement conflict resolution
                                      toast.info("Territory conflict resolution coming soon!");
                                    }}
                                  >
                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                    Resolve Territory Conflict
                                  </Button>
                                  <p className="text-xs text-muted-foreground">
                                    Resolve territorial conflicts for this route
                                  </p>
                                </div>
                              )}

                              {!route.territory_claim_status && route.status === "completed" && (
                                <div className="space-y-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                                    onClick={() => handleRetryTerritoryClaimFromRoute(route)}
                                  >
                                    <Target className="w-4 h-4 mr-2" />
                                    Claim Territory
                                  </Button>
                                  <p className="text-xs text-muted-foreground">
                                    Manually claim territory for this closed-loop route
                                  </p>
                                </div>
                              )}

                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full"
                                onClick={() => handleOpenRouteMap(route)}
                              >
                                <Route className="w-4 h-4 mr-2" />
                                View Route on Map
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </>
            ) : selectedRoute ? (
              <Card className="bg-card/80 border-border/50">
                <CardContent className="p-6 text-center">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-muted-foreground">Loading route details...</p>
                </CardContent>
              </Card>
            ) : (
              <EmptyState
                Icon={Route}
                title="Select a Route"
                message="Click on a route from the list to see its detailed information and GPS data."
              />
            )}

            {/* GPS Simulator (Development Only) */}
            {import.meta.env.MODE === 'development' && (
              <MemoizedGPSSimulator className="mb-6" />
            )}

            {/* Route Statistics */}
            <Card className="bg-card/80 border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Your Route Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Routes</span>
                  <span className="font-bold text-primary">{routes.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Completed</span>
                  <span className="font-bold text-territory-claimed">
                    {routes.filter(r => r.status === "completed").length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Active</span>
                  <span className="font-bold text-primary">
                    {routes.filter(r => r.status === "active").length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Distance</span>
                  <span className="font-bold text-territory-contested">
                    {formatDistance(routes.reduce((sum, r) => sum + (r.stats.distance_meters || 0), 0))}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Territory Claimed</span>
                  <span className="font-bold text-territory-claimed">
                    {UnitsFormatter.areaKm2(routes.reduce((sum, r) => sum + (r.stats.territory_area_km2 || 0), 0))}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
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
          username: 'You',
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

      {/* History Detail Drawer */}
      <Sheet open={historyDrawerOpen} onOpenChange={setHistoryDrawerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl">
            <SheetHeader>
              <SheetTitle>Route Summary</SheetTitle>
            </SheetHeader>
          <div className="p-2 space-y-4">
            {selectedRouteDetails?.ok ? (
              (() => {
                const route = selectedRouteDetails.data as RouteData;
                const handleShare = async () => {
                  const url = `${window.location.origin}/routes/history/${route.id}`;
                  if ((navigator as any).share) {
                    try { await (navigator as any).share({ title: route.name || 'Route', url }); } catch {}
                  } else {
                    try { await navigator.clipboard.writeText(url); toast.info('Link copied to clipboard'); } catch {}
                  }
                };
                const handleExport = () => {
                  const coords = (routeMapDetail?.ok ? (routeMapDetail as any).data.coordinates : []) as Array<{ latitude: number; longitude: number; timestamp?: string }>;
                  if (!coords || coords.length === 0) { toast.info('No coordinates to export'); return; }
                  const gpx = `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="Route Wars" xmlns="http://www.topografix.com/GPX/1/1">\n<trk><name>${route.name || route.id}</name><trkseg>\n${coords.map(c => `<trkpt lat="${c.latitude}" lon="${c.longitude}"></trkpt>`).join('\n')}\n</trkseg></trk></gpx>`;
                  const blob = new Blob([gpx], { type: 'application/gpx+xml' });
                  const a = document.createElement('a');
                  a.href = URL.createObjectURL(blob);
                  a.download = `${(route.name || 'route').replace(/\s+/g,'_')}.gpx`;
                  a.click();
                  URL.revokeObjectURL(a.href);
                };
                return (
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">{route.description || 'No description provided'}</div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-muted-foreground">Status</div>
                        <div className="font-medium capitalize">{route.status === 'completed' ? 'Finished' : route.status}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Claimed Area</div>
                        <div className="font-medium">{route.stats.territory_area_km2 ? UnitsFormatter.areaKm2(route.stats.territory_area_km2) : '—'}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => handleOpenRouteMap(route)} title="View on map">Open Map</Button>
                      <Button variant="outline" onClick={handleShare} title="Share route">Share</Button>
                      <Button variant="outline" onClick={handleExport} title="Export GPX">Export</Button>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="text-sm text-muted-foreground">Loading route details...</div>
            )}
          </div>
        </SheetContent>
      </Sheet>

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
    </div>
  );
};

export default Routes;