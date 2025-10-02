import { useState, useCallback, useMemo, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UnitsFormatter } from "@/lib/format/units";
import { PageHeader } from "@/components/common/PageHeader";

import {
  MapPin,
  Trophy,
  Target,
  Route,
  Search,
  ArrowLeft,
  Zap,
  History,
  TrendingUp,
  Users,
  Calendar,
  BarChart3
} from "lucide-react";

import { TerritoryMap } from "@/components/features/territory/TerritoryMap";
import { TerritoryStats } from "@/components/features/territory/TerritoryStats";
import { LeaderboardPreview } from "@/components/features/leaderboard";
import { useGlobalTerritoryWebSocket } from "@/hooks/useTerritoryWebSocket";
import { useWebSocketManager } from "@/hooks/useWebSocketManager";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { GatewayAPI } from "@/lib/api";
import { queryKeys, invalidateQueries } from "@/lib/query";
import { useAuth } from "@/contexts/AuthContext";
import {
  useTerritoriesMap,
  useUserTerritoryStatistics,
} from "@/hooks/useTerritory";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { territoryTracking } from "@/lib/utils/tracking";

const Territory = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState(() => {
    return localStorage.getItem('rw.territory.filter') || 'all';
  });
  const [selectedTerritoryId, setSelectedTerritoryId] = useState<string | undefined>();
  const [searchFocused, setSearchFocused] = useState(false);
  const [showBackToArea, setShowBackToArea] = useState(false);
  const [showPlanRoute, setShowPlanRoute] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const {
    data: userStats,
    isLoading: isLoadingUserStats,
  } = useUserTerritoryStatistics(user?.id ?? "");



  const {
    data: territoriesData,
    isLoading: isLoadingTerritories,
    error: territoriesError,
  } = useTerritoriesMap();

  // Fetch top 3 territory leaderboard entries for preview
  const { data: leaderboardPreviewData, isLoading: isLoadingLeaderboard } = useQuery({
    queryKey: ["leaderboard-preview", "territory"],
    queryFn: async () => {
      const result = await GatewayAPI.getLeaderboard("territory", "ALL_TIME", 0, 3);
      if (!result.ok) {
        throw result;
      }
      return result.data;
    },
  });

  const territories = useMemo(() => {
    if (!territoriesData?.territories) return [];
    return territoriesData.territories.map((t) => {
      // Handle API response that might have boundary instead of boundary_coordinates
      const apiTerritory = t as any;
      // Normalize boundary from backend: prefer boundary_coordinates (array of {lat,lon}).
      // If backend returns numeric pairs, map accordingly. Handle nulls.
      let boundaryCoordinates = apiTerritory.boundary_coordinates as Array<{ latitude: number; longitude: number }> | undefined;
      if (!boundaryCoordinates && Array.isArray(apiTerritory.boundary)) {
        boundaryCoordinates = (apiTerritory.boundary as Array<[number, number]>).map(([latitude, longitude]) => ({ latitude, longitude }));
      }
      if (!boundaryCoordinates && Array.isArray(apiTerritory.boundary_geojson?.coordinates)) {
        // Handle simple Polygon GeoJSON [[lng,lat],...] in case summary endpoint is used
        const ring = apiTerritory.boundary_geojson.coordinates?.[0] || [];
        boundaryCoordinates = ring.map(([lon, lat]: [number, number]) => ({ latitude: lat, longitude: lon }));
      }

      return {
        ...t,
        is_mine: t.owner_id === user?.id,
        owner_name: t.owner_username || 'Unknown',
        name: t.name || 'Unnamed Territory',
        area_square_meters: t.area_km2 * 1000000,
        // contested removed from model
        boundary_coordinates: boundaryCoordinates || [],
      };
    });
  }, [territoriesData, user?.id]);

  if (import.meta.env.MODE === 'development') {
    console.log("Territory Page Debug:", {
      userId: user?.id,
      territoriesFromApi: territoriesData?.territories,
      transformedTerritories: territories,
      sampleBoundary: territories[0]?.boundary_coordinates?.slice(0, 3),
    });
  }

  // WebSocket integration for real-time territory updates

  const queryClient = useQueryClient();
  const handleTerritoryMapUpdate = useCallback((data: any) => {
    if (data?.requires_refresh) {
      // Invalidate territory-related queries for immediate refresh
      queryClient.invalidateQueries({ queryKey: queryKeys.territoriesMap() });
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.userTerritories(user.id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.territoryStatistics(user.id) });
      }
    }
  }, [queryClient, user?.id]);

  const { isConnected: isGlobalConnected } = useGlobalTerritoryWebSocket({
    onTerritoryMapUpdate: handleTerritoryMapUpdate,
  });

  // Also subscribe to notification WS for territory and route events to invalidate caches
  const { onMessage } = useWebSocketManager({ autoConnect: true });
  useEffect(() => {
    const subs: Array<() => void | undefined> = [];
    subs.push(onMessage('territory_claimed', () => {
      if (user?.id) {
        invalidateQueries.territories(queryClient, user.id);
        invalidateQueries.territoryStatistics(queryClient, user.id);
      }
    }));

    subs.push(onMessage('route_completed', () => {
      if (user?.id) {
        invalidateQueries.routes(queryClient, user.id);
      }
    }));
    return () => { subs.forEach(off => off?.()); };
  }, [onMessage, queryClient, user?.id]);



  const handleTerritorySelect = (territory: any) => {
    setSelectedTerritoryId(territory.id);
  };



  // Sync tab with URL: /territory/map | /territory/stats
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>(() => (location.pathname.endsWith('/stats') ? 'stats' : 'map'));

  useEffect(() => {
    const nextTab = location.pathname.endsWith('/stats') ? 'stats' : 'map';
    setActiveTab(nextTab);
  }, [location.pathname]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    const target = val === 'stats' ? '/territory/stats' : '/territory/map';
    if (location.pathname !== target) {
      navigate(target, { replace: true });
    }
  };

  // Persist filter selection
  useEffect(() => {
    localStorage.setItem('rw.territory.filter', filterBy);
  }, [filterBy]);

  // Handle search with debouncing (250ms as specified in feedback)
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 250);

  // Handle search selection
  const handleSearchSelect = (territory: any) => {
    setSelectedTerritoryId(territory.id);
    setShowBackToArea(true);
    territoryTracking.searchSelect(territory.id);
    // TODO: Implement flyTo and flash polygon
  };

  // Handle filter chip selection
  const handleFilterSelect = (filter: string) => {
    setFilterBy(filter);
    territoryTracking.filterChange(filter);
  };

  // Handle zoom to mine
  const handleZoomToMine = () => {
    territoryTracking.zoomToMine();
    // TODO: Implement zoom to user territories
  };

  // Handle plan route
  const handlePlanRoute = () => {
    setShowPlanRoute(!showPlanRoute);
    territoryTracking.planRouteClick();
  };

  // Track territory view on mount
  useEffect(() => {
    territoryTracking.view();
  }, []);

  // Get user geolocation for Nearby filter
  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => { },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Deep-link highlight: read ?highlight=ID or localStorage and select territory
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlId = params.get('highlight');
    const lsId = localStorage.getItem('highlightTerritoryId') || undefined;
    const targetId = urlId || lsId;
    if (targetId) {
      setSelectedTerritoryId(targetId);
      localStorage.removeItem('highlightTerritoryId');
      if (urlId) {
        const newParams = new URLSearchParams(location.search);
        newParams.delete('highlight');
        navigate(`${location.pathname}${newParams.size ? `?${newParams.toString()}` : ''}`, { replace: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Check if user has no territories for empty state
  const hasNoTerritories = userStats?.territory_count === 0;

  return (
    <TooltipProvider>
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Clear header with counters */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Territory</h1>
              <p className="text-muted-foreground">
                Manage your territories, discover new targets, and track expansion.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {isLoadingUserStats ? (
                  <Skeleton className="h-4 w-12" />
                ) : (
                  `${userStats?.territory_count ?? 0} Territories`
                )}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                {isLoadingUserStats ? (
                  <Skeleton className="h-4 w-12" />
                ) : (
                  `${UnitsFormatter.areaKm2(userStats?.total_area_km2 ?? 0)} Claimed`
                )}
              </Badge>
            </div>
          </div>
        </div>

        {/* Two tabs: Map and Statistics */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="map" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Map
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Statistics
            </TabsTrigger>
          </TabsList>

          {/* Territory Map Tab */}
          <TabsContent value="map" className="space-y-4">
            {hasNoTerritories ? (
              /* Empty state (no territories) */
              <Card className="h-[56vh] md:h-[68vh]">
                <CardContent className="flex flex-col items-center justify-center h-full space-y-6">
                  <div className="text-center space-y-4">
                    <MapPin className="h-16 w-16 text-muted-foreground mx-auto" />
                    <div>
                      <h3 className="text-xl font-semibold">No Territories Yet</h3>
                      <p className="text-muted-foreground mt-2">
                        Start tracking routes and complete them to claim your first territory.
                      </p>
                    </div>
                    <Button size="lg" className="mt-4">
                      <Route className="h-4 w-4 mr-2" />
                      Start Your First Route
                    </Button>
                    <div className="flex gap-4 mt-4">
                      <Button variant="outline" size="sm">
                        <Users className="h-4 w-4 mr-2" />
                        Invite Friend
                      </Button>
                      <Button variant="outline" size="sm">
                        Learn Rules
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Primary CTA above map */}
                <div className="flex flex-col gap-4">
                  <Button
                    onClick={handlePlanRoute}
                    className="w-full md:w-auto"
                    variant={showPlanRoute ? "secondary" : "default"}
                  >
                    <Route className="h-4 w-4 mr-2" />
                    Plan route to expand
                  </Button>

                  {/* Filter chips and search */}
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    {/* Filter chips: All | Mine | Others */}
                    <div className="flex gap-2" role="group" aria-label="Territory filters">
                      {['all', 'mine', 'others'].map((filter) => (
                        <Button
                          key={filter}
                          variant={filterBy === filter ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleFilterSelect(filter)}
                          aria-pressed={filterBy === filter}
                          className="focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        >
                          {filter === 'all' ? 'All' : filter === 'mine' ? 'Mine' : 'Others'}
                        </Button>
                      ))}
                    </div>

                    {/* Search UX */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      <Input
                        placeholder="Search territories..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                        className="pl-10 w-full md:w-64 focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        aria-label="Search territories by name or owner"
                      />
                      {showBackToArea && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowBackToArea(false)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 focus:ring-2 focus:ring-primary focus:ring-offset-2"
                          aria-label="Return to your territory area"
                        >
                          <ArrowLeft className="h-4 w-4 mr-1" />
                          Back to my area
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Quick chips */}
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={handleZoomToMine}>
                      <Target className="h-4 w-4 mr-2" />
                      Zoom to Mine
                    </Button>
                    <Button variant="outline" size="sm">
                      <History className="h-4 w-4 mr-2" />
                      Capture history
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => territoryTracking.heatmapToggle(true)}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Heatmap opportunities
                    </Button>
                  </div>
                </div>

                {/* Map with consistent height */}
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="h-[56vh] md:h-[68vh]">
                      {isLoadingTerritories ? (
                        <Skeleton className="w-full h-full" />
                      ) : territoriesError ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center space-y-2">
                            <MapPin className="h-12 w-12 text-muted-foreground mx-auto" />
                            <p className="text-muted-foreground">
                              Failed to load territories. Please try again.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <TerritoryMap
                          territories={territories}
                          selectedTerritoryId={selectedTerritoryId}
                          onTerritorySelect={handleTerritorySelect}
                          filterBy={filterBy}
                          searchTerm={debouncedSearchTerm}
                          showOwnershipIndicators={true}
                          userLocation={userLocation || undefined}
                          showPlanRoute={showPlanRoute}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Mobile sticky bar */}
                <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
                  <div className="flex gap-2 bg-background/95 backdrop-blur-sm border rounded-lg p-2">
                    <Button onClick={handlePlanRoute} className="flex-1">
                      <Route className="h-4 w-4 mr-2" />
                      Plan route
                    </Button>
                    <Button variant="outline" onClick={handleZoomToMine} className="flex-1">
                      <Target className="h-4 w-4 mr-2" />
                      Zoom to Mine
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="stats" className="space-y-6">
            {/* KPI grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Territories</p>
                      <p className="text-2xl font-bold">
                        {isLoadingUserStats ? <Skeleton className="h-8 w-12" /> : userStats?.territory_count ?? 0}
                      </p>
                    </div>
                    <MapPin className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-sm font-medium text-muted-foreground cursor-help">Total area</p>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Total area of all your claimed territories measured in square kilometers (km²)</p>
                        </TooltipContent>
                      </Tooltip>
                      <p className="text-2xl font-bold">
                        {isLoadingUserStats ? <Skeleton className="h-8 w-16" /> : UnitsFormatter.areaKm2(userStats?.total_area_km2 ?? 0)}
                      </p>
                    </div>
                    <Target className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Avg area</p>
                      <p className="text-2xl font-bold">
                        {isLoadingUserStats ? <Skeleton className="h-8 w-16" /> : UnitsFormatter.areaKm2(userStats?.average_area_km2 ?? 0)}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-sm font-medium text-muted-foreground cursor-help">Claims last 7d</p>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Number of new territories you have claimed in the past 7 days by completing routes</p>
                        </TooltipContent>
                      </Tooltip>
                      <p className="text-2xl font-bold">
                        {isLoadingUserStats ? <Skeleton className="h-8 w-8" /> : ((userStats as any)?.claims_last_7d ?? 0)}
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed stats */}
            <TerritoryStats
              userStats={userStats}
              isLoading={isLoadingUserStats}
            />

            {/* Leaders: top 5 + "View full leaderboard" */}
            <LeaderboardPreview
              title="Territory Leaders"
              entries={leaderboardPreviewData?.entries?.slice(0, 5).map(entry => ({
                rank: entry.rank,
                username: entry.username,
                score: entry.score,
                user_id: entry.user_id
              })) || []}
              isLoading={isLoadingLeaderboard}
              category="territory"
            />
          </TabsContent>

        </Tabs>
      </div>
    </TooltipProvider>
  );
};

export default Territory;