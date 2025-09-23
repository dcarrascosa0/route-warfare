import { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Trophy, Target, Filter, Search, Award } from "lucide-react";

import { TerritoryMap } from "@/components/features/territory/TerritoryMap";
import { TerritoryStats } from "@/components/features/territory/TerritoryStats";
import { TerritoryLeaderboard } from "@/components/features/territory/TerritoryLeaderboard";
import { TerritoryAchievements } from "@/components/features/territory/TerritoryAchievements";
import { useGlobalTerritoryWebSocket } from "@/hooks/useTerritoryWebSocket";
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
      const boundaryCoordinates = apiTerritory.boundary_coordinates ||
        (apiTerritory.boundary || []).map(([latitude, longitude]: [number, number]) => ({
          latitude,
          longitude
        }));

      return {
        ...t,
        is_mine: t.owner_id === user?.id,
        owner_name: t.owner_username || 'Unknown',
        name: t.name || 'Unnamed Territory',
        area_square_meters: t.area_km2 * 1000000,
        contested: (t.contested_by?.length || 0) > 0,
        contest_count: t.contest_count || 0,
        boundary_coordinates: boundaryCoordinates,
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

  const handleTerritoryMapUpdate = useCallback((data: any) => {
    if (data.requires_refresh) {
      // Trigger territory map refresh - handled by individual components
      console.log('Territory map update received:', data);
    }
  }, []);

  const { isConnected: isGlobalConnected } = useGlobalTerritoryWebSocket({
    onLeaderboardUpdate: handleLeaderboardUpdate,
    onTerritoryMapUpdate: handleTerritoryMapUpdate,
  });

  const currentLeaderboard = useMemo(() => {
    return leaderboardData || leaderboardQueryData?.leaderboard || [];
  }, [leaderboardData, leaderboardQueryData]);

  const handleTerritorySelect = (territory: any) => {
    setSelectedTerritoryId(territory.id);
  };

  const handleLeaderboardSortChange = (newSort: string) => {
    setSortBy(newSort);
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
              `${userStats?.total_area_km2?.toFixed(2) ?? 0} km² Claimed`
            )}
          </Badge>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="map" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="map" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Territory Map
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Statistics
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Leaderboard
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Achievements
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
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search territories..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <Select value={filterBy} onValueChange={setFilterBy}>
                    <SelectTrigger className="w-32">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="mine">My Territories</SelectItem>
                      <SelectItem value="contested">Contested</SelectItem>
                      <SelectItem value="nearby">Nearby</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
        </TabsContent>

        {/* Enhanced Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TerritoryLeaderboard
                userId={user?.id}
                showAchievements={true}
              />
            </div>
            <div>
              <TerritoryStats
                leaderboard={currentLeaderboard}
                sortBy={sortBy}
                onSortChange={handleLeaderboardSortChange}
                compact={true}
                isLoading={isLoadingLeaderboard}
              />
            </div>
          </div>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TerritoryAchievements
              userId={user?.id || ''}
              showProgress={true}
            />
            <div className="space-y-4">
              <TerritoryLeaderboard
                userId={user?.id}
                compact={true}
                showAchievements={false}
              />
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Achievement Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>🏆 <strong>Area Achievements:</strong> Claim larger territories by completing longer routes</p>
                    <p>📊 <strong>Count Achievements:</strong> Focus on claiming multiple smaller territories</p>
                    <p>⚡ <strong>Efficiency Achievements:</strong> Optimize your routes for maximum territory per completion</p>
                    <p>👑 <strong>Special Achievements:</strong> Complete unique challenges and milestones</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Territory;