import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Trophy, MapPin, Route, Target, Users, Calendar, BarChart3, RefreshCw, Search } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GatewayAPI } from "../lib/api";
import { LeaderboardEntry } from "../components/features/user-profile/LeaderboardEntry";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useWebSocketManager } from "../hooks/useWebSocketManager";
import { useGlobalControls } from "@/contexts/GlobalControlsContext";

type LeaderboardCategory = "territory" | "routes" | "winrate";
type LeaderboardPeriod = "ALL_TIME" | "WEEKLY" | "MONTHLY";

interface LeaderboardPlayer {
  rank: number;
  name: string;
  userId?: string;
  score: number;
  totalArea: string;
  zones: number;
  routes: number;
  winRate: string;
  level: number;
  distance: string;
  trend: "up" | "down" | "stable";
  rankChange: number;
  badge: string | null;
  isCurrentUser: boolean;
}



const Leaderboard = () => {
  const [selectedCategory, setSelectedCategory] = useState<LeaderboardCategory>("territory");
  const { period } = useGlobalControls();
  const selectedPeriod: LeaderboardPeriod = period as any;
  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(0);

  const queryClient = useQueryClient();
  const { onMessage } = useWebSocketManager({ autoConnect: true });

  // Function to refresh total players count
  const refreshTotalPlayers = () => {
    queryClient.invalidateQueries({ queryKey: ["total-players"] });
  };

  const userId = useMemo(() => localStorage.getItem("user_id"), []);
  const isAuthenticated = !!userId;

  useEffect(() => {
    document.title = "Leaderboard - Route Wars";
  }, []);

  // Real-time updates
  useEffect(() => {
    const cleanup = onMessage('leaderboard_updated', () => {
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["total-players"] });
    });
    return cleanup;
  }, [onMessage, queryClient]);

  // Fetch leaderboard data based on selected category
  const { data: apiData, isLoading, error, refetch } = useQuery({
    queryKey: ["leaderboard", selectedCategory, selectedPeriod, currentPage, pageSize],
    queryFn: () => {
      const start = currentPage * pageSize;
      switch (selectedCategory) {
        case "routes":
          return GatewayAPI.leaderboardRoutes(selectedPeriod, start, pageSize);
        case "winrate":
          return GatewayAPI.leaderboardWinRate(selectedPeriod, start, pageSize);
        default:
          return GatewayAPI.getLeaderboard("territory", selectedPeriod, start, pageSize);
      }
    },
  });

  // Fetch total players count using the new dedicated endpoint
  const { data: totalPlayersData } = useQuery({
    queryKey: ["total-players"],
    queryFn: () => GatewayAPI.getTotalPlayers(),
  });

  // Fetch leaderboard stats (keeping for other stats if needed)
  const { data: statsData } = useQuery({
    queryKey: ["leaderboard-stats", selectedCategory],
    queryFn: () => GatewayAPI.leaderboardStats(selectedCategory),
    enabled: !!selectedCategory,
  });

  // Fetch routes data for all users to populate the routes field
  const { data: routesData } = useQuery({
    queryKey: ["routes-leaderboard"],
    queryFn: () => GatewayAPI.getRoutesForAllUsers(),
    enabled: selectedCategory === "territory" || selectedCategory === "routes" || selectedCategory === "winrate",
  });

  // Debug: Log routes data when received
  useEffect(() => {
    if (routesData && selectedCategory === "routes") {
      console.log('Routes data received for routes category:', routesData);
    }
  }, [routesData, selectedCategory]);

  // Get current user info for highlighting
  const currentUsername = "testuser"; // This would come from user context in a real app

  // Create a map of route data for quick lookup
  const routeDataMap = useMemo(() => {
    // Handle both ApiResult wrapper and direct array response
    let routes: any[] = [];

    if (routesData) {
      // Check if it's an ApiResult wrapper
      if (typeof routesData === 'object' && 'data' in routesData) {
        routes = Array.isArray(routesData.data) ? routesData.data : [];
      } else if (Array.isArray(routesData)) {
        // Direct array response
        routes = routesData;
      }
    }

    const routeMap: Record<string, { completed_routes: number; total_routes: number; win_rate: number }> = {};

    // Debug: Log the routes data structure
    if (routesData && routes.length > 0) {
      console.log('Routes data received:', routes);
    }

    if (Array.isArray(routes)) {
      routes.forEach((route: any) => {
        if (route.user_id) {
          routeMap[route.user_id] = {
            completed_routes: route.completed_routes || 0,
            total_routes: route.total_routes || 0,
            win_rate: route.win_rate || 0
          };
        }
      });
    }

    // Debug: Log the created route map
    if (Object.keys(routeMap).length > 0) {
      console.log('Route data map created:', routeMap);
    }

    return routeMap;
  }, [routesData]);

  const allPlayers = useMemo(() => {
    // Handle both data structures: apiData.entries (from leaderboard API) and apiData.data.entries (legacy)
    const entries = (apiData as any)?.entries || (apiData as any)?.data?.entries as Array<{
      username?: string;
      user_id?: string;
      rank?: number;
      score?: number;
      territory_area_km2?: number;
      territory_count?: number;
      avg_territory_size?: number;
      recent_claims?: number;
    }> | undefined;

    if (!entries || entries.length === 0) {
      return [];
    }

    return entries.map((e, idx) => {
      const globalRank = (currentPage * pageSize) + idx + 1;
      const routeData = routeDataMap[e.user_id || ''] || { completed_routes: 0, total_routes: 0, win_rate: 0 };

      // Debug: Log route data for each user when routes category is selected
      if (selectedCategory === "routes" && e.user_id) {
        console.log(`User ${e.user_id} (${e.username}):`, {
          completed_routes: routeData.completed_routes,
          total_routes: routeData.total_routes,
          win_rate: routeData.win_rate
        });
      }

      return {
        rank: e.rank ?? globalRank,
        name: e.username ?? `Player ${globalRank}`,
        userId: e.user_id,
        score: e.score ?? 0,
        totalArea: `${Math.max(0, Math.round(((e.territory_area_km2 ?? 0) * 10)) / 10)} km²`,
        zones: e.territory_count ?? 0,
        routes: routeData.completed_routes,
        winRate: `${Math.round(routeData.win_rate)}%`,
        level: 1, // This should come from user profile/gamification data
        distance: `0.0 km`, // This should come from route statistics
        trend: Math.random() > 0.5 ? "up" : Math.random() > 0.5 ? "down" : "stable" as "up" | "down" | "stable",
        rankChange: Math.floor(Math.random() * 10) + 1,
        badge: globalRank === 1 ? "Crown" : globalRank === 2 ? "Trophy" : globalRank === 3 ? "Medal" : null,
        isCurrentUser: e.user_id === userId,
      } as LeaderboardPlayer;
    });
  }, [apiData, selectedCategory, currentUsername, currentPage, pageSize, userId, routeDataMap]);

  // Filter players based on search query
  const filteredPlayers = useMemo(() => {
    if (!searchQuery.trim()) {
      return allPlayers;
    }
    return allPlayers.filter(player =>
      player.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allPlayers, searchQuery]);

  // Debug: Log filtered players for routes category
  useMemo(() => {
    if (selectedCategory === "routes" && filteredPlayers.length > 0) {
      console.log('Filtered players for routes category:', filteredPlayers.map(p => ({
        name: p.name,
        userId: p.userId,
        routes: p.routes,
        winRate: p.winRate
      })));
    }
  }, [filteredPlayers, selectedCategory]);

  // Pin current user row at top if present
  const topPlayers = useMemo(() => {
    const idx = filteredPlayers.findIndex(p => p.isCurrentUser);
    if (idx <= 0) return filteredPlayers;
    const self = filteredPlayers[idx];
    const others = filteredPlayers.filter((_, i) => i !== idx);
    return [self, ...others];
  }, [filteredPlayers]);

  // Debug: Log final top players for routes category
  useMemo(() => {
    if (selectedCategory === "routes" && topPlayers.length > 0) {
      console.log('Final top players for routes category:', topPlayers.map(p => ({
        name: p.name,
        userId: p.userId,
        routes: p.routes,
        winRate: p.winRate,
        zones: p.zones,
        totalArea: p.totalArea
      })));
    }
  }, [topPlayers, selectedCategory]);



  const categories = [
    {
      id: "territory" as LeaderboardCategory,
      title: "Most Territory",
      icon: MapPin,
      description: "Total area controlled",
      color: "territory-claimed",
      statLabel: "Area"
    },
    {
      id: "routes" as LeaderboardCategory,
      title: "Most Routes",
      icon: Route,
      description: "Routes completed",
      color: "primary",
      statLabel: "Routes"
    },
    {
      id: "winrate" as LeaderboardCategory,
      title: "Best Strategist",
      icon: Target,
      description: "Highest win rate",
      color: "territory-contested",
      statLabel: "Win Rate"
    }
  ];

  const periods = [
    { id: "ALL_TIME" as LeaderboardPeriod, label: "All Time", icon: BarChart3 },
    { id: "MONTHLY" as LeaderboardPeriod, label: "Monthly", icon: Calendar },
    { id: "WEEKLY" as LeaderboardPeriod, label: "Weekly", icon: Users },
  ];

  const getCurrentCategoryInfo = () => {
    return categories.find(cat => cat.id === selectedCategory) || categories[0];
  };



  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Global Leaderboard</h1>
          <p className="text-xl text-muted-foreground mb-6">
            The greatest territory conquerors and strategic masterminds.
          </p>

          {/* Category Selection */}
          <div className="flex flex-wrap gap-3 mb-4">
            {categories.map((category) => {
              const IconComponent = category.icon;
              const isSelected = selectedCategory === category.id;
              return (
                <Button
                  key={category.id}
                  variant={isSelected ? "default" : "outline"}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setCurrentPage(0); // Reset to first page when changing category
                  }}
                  className={`flex items-center gap-2 ${isSelected ? "bg-gradient-hero hover:shadow-glow" : ""}`}
                >
                  <IconComponent className="w-4 h-4" />
                  {category.title}
                </Button>
              );
            })}
          </div>

          {/* Period Selection and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {periods.map((p) => {
                const IconComponent = p.icon;
                const isSelected = selectedPeriod === p.id;
                return (
                  <Button key={p.id} variant={isSelected ? "secondary" : "ghost"} size="sm" className="flex items-center gap-1">
                    <IconComponent className="w-3 h-3" />
                    {p.label}
                  </Button>
                );
              })}
            </div>

            {/* Search and Filters */}
            <div className="flex gap-2 items-center">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search players..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-48"
                />
              </div>
              <Select value={pageSize.toString()} onValueChange={(value) => {
                setPageSize(parseInt(value));
                setCurrentPage(0);
              }}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Main Leaderboard */}
          <div className="lg:col-span-3">
            <Card className="bg-card/80 border-border/50">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-lg sm:text-xl">
                    {React.createElement(getCurrentCategoryInfo().icon, {
                      className: `w-5 h-5 sm:w-6 sm:h-6 text-${getCurrentCategoryInfo().color}`
                    })}
                    {getCurrentCategoryInfo().title} Leaderboard
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => refetch()}
                      disabled={isLoading}
                      className="flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
                      Refresh
                    </Button>
                    {isLoading && (
                      <div className="text-sm text-muted-foreground">Loading...</div>
                    )}
                  </div>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {getCurrentCategoryInfo().description} • {periods.find(p => p.id === selectedPeriod)?.label}
                </p>
              </CardHeader>
              <CardContent className="p-0">
                {error && (
                  <div className="p-6 text-center">
                    <p className="text-muted-foreground">Failed to load leaderboard data</p>
                    <Button variant="outline" onClick={() => refetch()} className="mt-2">
                      Try Again
                    </Button>
                  </div>
                )}

                {!isLoading && !error && topPlayers.length === 0 && (
                  <div className="p-6 text-center">
                    <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="font-semibold mb-2">No Leaderboard Data</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {isAuthenticated
                        ? "Complete routes and claim territories to appear on the leaderboard!"
                        : "The leaderboard will show top players once they start claiming territories."
                      }
                    </p>
                    {!isAuthenticated && (
                      <div className="flex gap-2 justify-center">
                        <Button variant="outline" asChild>
                          <Link to="/login">Sign In</Link>
                        </Button>
                        <Button className="bg-gradient-hero hover:shadow-glow" asChild>
                          <Link to="/register">Get Started</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-1 sm:space-y-2">
                  {topPlayers.map((player) => (
                    <LeaderboardEntry
                      key={`${player.rank}-${player.name}`}
                      player={player}
                      category={selectedCategory}
                      showTrend={true}
                      showStats={true}
                    />
                  ))}
                </div>

                {/* Pagination Controls */}
                {topPlayers.length > 0 && (
                  <div className="flex items-center justify-between p-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Showing {currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, (apiData as any)?.data?.total_entries || 0)} of {(apiData as any)?.data?.total_entries || 0} players
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                        disabled={currentPage === 0}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={topPlayers.length < pageSize}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Leaderboard Stats */}
            <Card className="bg-card/80 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  <span>Leaderboard Stats</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={refreshTotalPlayers}
                    className="h-6 w-6 p-0"
                    title="Refresh player count"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-background/50 rounded-lg">
                    <p className="text-2xl font-bold text-primary">
                      {totalPlayersData?.data?.total_players ?? 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Players</p>
                  </div>
                  <div className="text-center p-3 bg-background/50 rounded-lg">
                    <p className="text-2xl font-bold text-territory-claimed">
                      {topPlayers.length > 0 ? (
                        selectedCategory === "territory" ? topPlayers[0].totalArea :
                          selectedCategory === "routes" ? `${topPlayers[0].routes}` :
                            topPlayers[0].winRate
                      ) : "N/A"}
                    </p>
                    <p className="text-xs text-muted-foreground">Top Score</p>
                  </div>
                </div>

                {/* Category Quick Switch */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Quick Switch</p>
                  {categories.map((category) => {
                    const IconComponent = category.icon;
                    const isSelected = selectedCategory === category.id;
                    return (
                      <div
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer ${isSelected
                          ? `bg-${category.color}/20 border border-${category.color}/30`
                          : "bg-background/50 hover:bg-primary/5"
                          }`}
                      >
                        <div className={`flex items-center justify-center w-8 h-8 rounded-lg bg-${category.color}/20`}>
                          <IconComponent className={`w-4 h-4 text-${category.color}`} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-xs">{category.title}</h4>
                          <p className="text-xs text-muted-foreground">{category.statLabel}</p>
                        </div>
                        {isSelected && (
                          <Badge className="bg-primary/20 text-primary text-xs">Active</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Your Rank */}
            <Card className="bg-card/80 border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">{isAuthenticated ? "Your Rank" : "Join the Competition"}</CardTitle>
              </CardHeader>
              <CardContent>
                {isAuthenticated ? (
                  (() => {
                    const currentUserRank = topPlayers.find(p => p.isCurrentUser);
                    if (currentUserRank) {
                      return (
                        <div className="text-center">
                          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-hero/20 mx-auto mb-3">
                            <span className="text-2xl font-bold text-primary">#{currentUserRank.rank}</span>
                          </div>
                          <h4 className="font-semibold mb-1">{currentUserRank.name}</h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            {selectedCategory === "territory" ? currentUserRank.totalArea :
                              selectedCategory === "routes" ? `${currentUserRank.routes} routes` :
                                currentUserRank.winRate}
                          </p>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="text-center">
                              <p className="font-semibold">{currentUserRank.zones}</p>
                              <p className="text-muted-foreground">Zones</p>
                            </div>
                            <div className="text-center">
                              <p className="font-semibold">{currentUserRank.routes}</p>
                              <p className="text-muted-foreground">Routes</p>
                            </div>
                            <div className="text-center">
                              <p className="font-semibold">L{currentUserRank.level}</p>
                              <p className="text-muted-foreground">Level</p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div className="text-center text-muted-foreground">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Complete your first route to appear on the leaderboard!</p>
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-center">
                    <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h4 className="font-semibold mb-2">Start Your Journey</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Sign up to track your routes, claim territories, and compete on the leaderboard!
                    </p>
                    <div className="space-y-2">
                      <Button className="w-full bg-gradient-hero hover:shadow-glow" asChild>
                        <Link to="/register">Get Started</Link>
                      </Button>
                      <Button variant="outline" className="w-full" asChild>
                        <Link to="/login">Sign In</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>


          </div>
        </div>
      </main>
    </div>
  );
};

export default Leaderboard;