import { useState, useCallback, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { UnitsFormatter } from "@/lib/format/units";

import { MapPin, Trophy, Target } from "lucide-react";
import { FilterBar } from "@/components/common/FilterBar";

import { TerritoryMap } from "@/components/features/territory/TerritoryMap";
import { TerritoryStats } from "@/components/features/territory/TerritoryStats";
// Removed full leaderboard from Territory page to reduce redundancy
import { useGlobalTerritoryWebSocket } from "@/hooks/useTerritoryWebSocket";
import { useWebSocketManager } from "@/hooks/useWebSocketManager";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys, invalidateQueries } from "@/lib/query";
import { useAuth } from "@/contexts/AuthContext";
import {
  useTerritoriesMap,
  useUserTerritoryStatistics,
  useTerritoryLeaderboard,
} from "@/hooks/useTerritory";
import { Skeleton } from "@/components/ui/skeleton";

const Territory = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [filterBy, setFilterBy] = useState("all");
  const [selectedTerritoryId, setSelectedTerritoryId] = useState<string | undefined>();
  const [leaderboardData, setLeaderboardData] = useState<any>(null);

  const {
    data: userStats,
    isLoading: isLoadingUserStats,
  } = useUserTerritoryStatistics(user?.id ?? "");

  const {
    data: leaderboardQueryData,
    isLoading: isLoadingLeaderboard,
  } = useTerritoryLeaderboard("total_area", 100);

  const {
    data: territoriesData,
    isLoading: isLoadingTerritories,
    error: territoriesError,
  } = useTerritoriesMap();

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

  console.log("Territory Page Debug:", {
    userId: user?.id,
    territoriesFromApi: territoriesData?.territories,
    transformedTerritories: territories,
    sampleBoundary: territories[0]?.boundary_coordinates?.slice(0, 3),
  });

  // WebSocket integration for real-time territory updates
  const handleLeaderboardUpdate = useCallback((data: any) => {
    if (data.leaderboard) {
      setLeaderboardData(data.leaderboard);
    }
  }, []);

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
    onLeaderboardUpdate: handleLeaderboardUpdate,
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
    subs.push(onMessage('leaderboard_update', () => {
      // Force leaderboard refetch; handled by hooks via keys
      // No direct key here; rely on socket integration already updating state
    }));
    subs.push(onMessage('route_completed', () => {
      if (user?.id) {
        invalidateQueries.routes(queryClient, user.id);
      }
    }));
    return () => { subs.forEach(off => off?.()); };
  }, [onMessage, queryClient, user?.id]);

  const currentLeaderboard = useMemo(() => {
    return leaderboardData || leaderboardQueryData?.leaderboard || [];
  }, [leaderboardData, leaderboardQueryData]);

  const handleTerritorySelect = (territory: any) => {
    setSelectedTerritoryId(territory.id);
  };

  const handleLeaderboardSortChange = (newSort: string) => {
    setSortBy(newSort);
  };

  // Sync tab with URL: /territory/map | /territory/stats
  const [activeTab, setActiveTab] = useState<string>(() => (window.location.pathname.endsWith('/stats') ? 'stats' : 'map'));

  useEffect(() => {
    const path = window.location.pathname;
    const nextTab = path.endsWith('/stats') ? 'stats' : 'map';
    setActiveTab(nextTab);
  }, []);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    const target = val === 'stats' ? '/territory/stats' : '/territory/map';
    if (window.location.pathname !== target) {
      window.history.replaceState(null, '', target);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Territory Control</h1>
          <p className="text-muted-foreground">
            Manage your claimed territories and explore new conquest opportunities
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
          <Badge
            variant={isGlobalConnected ? "default" : "destructive"}
            className="flex items-center gap-1"
          >
            <div className={`h-2 w-2 rounded-full ${isGlobalConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            {isGlobalConnected ? 'Live Updates' : 'Offline'}
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

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="map" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Territory Map
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Statistics
          </TabsTrigger>
        </TabsList>

        {/* Territory Map Tab */}
        <TabsContent value="map" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                <div>
                  <CardTitle>Territory Map</CardTitle>
                  <CardDescription>
                    View and manage your claimed territories
                  </CardDescription>
                </div>
                <FilterBar
                  search={{ value: searchTerm, onChange: setSearchTerm, placeholder: "Search territories..." }}
                  selects={[{
                    id: 'filterBy',
                    value: filterBy,
                    onChange: setFilterBy,
                    options: [
                      { value: 'all', label: 'All' },
                      { value: 'mine', label: 'My Territories' },
                      { value: 'contested', label: 'Contested' },
                      { value: 'nearby', label: 'Nearby' },
                    ]
                  }]}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[500px]">
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
                    searchTerm={searchTerm}
                    showOwnershipIndicators={true}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="stats" className="space-y-4">
          <TerritoryStats
            leaderboard={currentLeaderboard}
            sortBy={sortBy}
            onSortChange={handleLeaderboardSortChange}
            isLoading={isLoadingLeaderboard}
          />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Explore Full Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <a href="/leaderboard" className="inline-flex items-center px-4 py-2 rounded-md bg-gradient-hero text-white hover:shadow-glow">
                View Leaderboard
              </a>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default Territory;