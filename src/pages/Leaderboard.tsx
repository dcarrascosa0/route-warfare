import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";

import { Trophy, MapPin, Route, Target, Users, Calendar, BarChart3, Search, Zap, Star, Award, Flame, Crown, ChevronDown, HelpCircle, Play, UserPlus, TrendingUp, Clock, Filter, Flag } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GatewayAPI } from "../lib/api";
import { LeaderboardEntry } from "../components/features/user-profile/LeaderboardEntry";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { useWebSocketManager } from "../hooks/useWebSocketManager";
import { useGlobalControls } from "@/contexts/GlobalControlsContext";
import { useAuth } from "@/contexts/AuthContext";
import type { ApiResult } from "@/lib/api/types/common";
import type { LeaderboardResponse as LBResponse } from "@/lib/api/types/leaderboard";

type LeaderboardCategory = "territory" | "routes" | "xp" | "level" | "achievements" | "streak" | "distance";
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
  xp: number;
  achievements: number;
  streak: number;
  prestige: number;
  title?: string;
  trend: "up" | "down" | "stable";
  rankChange: number;
  badge: string | null;
  isCurrentUser: boolean;
}



const Leaderboard = () => {
  // Load preferences from localStorage with Weekly default
  const [selectedCategory, setSelectedCategory] = useState<LeaderboardCategory>(() => {
    const prefs = localStorage.getItem('rw.lb.pref');
    if (prefs) {
      try {
        const parsed = JSON.parse(prefs);
        return parsed.m || "territory";
      } catch {
        return "territory";
      }
    }
    return "territory";
  });
  const { period, setPeriod } = useGlobalControls();
  const [selectedPeriod, setSelectedPeriodState] = useState<LeaderboardPeriod>(() => {
    const prefs = localStorage.getItem('rw.lb.pref');
    if (prefs) {
      try {
        const parsed = JSON.parse(prefs);
        return parsed.t || "WEEKLY";
      } catch {
        return "WEEKLY";
      }
    }
    return "WEEKLY"; // Default to Weekly for first-time users
  });
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, 250);
  const [pageSize, setPageSize] = useState(50); // Increased default page size
  const [currentPage, setCurrentPage] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [socialFilter, setSocialFilter] = useState<"all" | "friends" | "city" | "club">("all");
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);

  const queryClient = useQueryClient();
  const { onMessage } = useWebSocketManager({ autoConnect: true });
  const { user } = useAuth();



  const userId = user?.id ?? null;
  const isAuthenticated = !!userId;

  useEffect(() => {
    document.title = "Leaderboard - Route Wars";
    // Track page view
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'lb_view', {
        metric: selectedCategory,
        timeframe: selectedPeriod
      });
    }
  }, [selectedCategory, selectedPeriod]);

  // Real-time updates
  useEffect(() => {
    const cleanup = onMessage('leaderboard_updated', () => {
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["total-players"] });
      setLastUpdated(new Date());
    });
    return cleanup;
  }, [onMessage, queryClient]);

  // Auto-refresh every 45 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAutoRefreshing(true);
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      setLastUpdated(new Date());
      setTimeout(() => setIsAutoRefreshing(false), 1000);
    }, 45000);

    return () => clearInterval(interval);
  }, [queryClient]);

  // Fetch leaderboard data based on selected category
  const { data: apiData, isLoading, error, refetch } = useQuery<ApiResult<LBResponse>>({
    queryKey: ["leaderboard", selectedCategory, selectedPeriod, currentPage, pageSize],
    queryFn: () => {
      const start = currentPage * pageSize;
      switch (selectedCategory) {
        case "routes":
          return GatewayAPI.leaderboardRoutes(selectedPeriod, start, pageSize) as Promise<ApiResult<LBResponse>>;

        case "xp":
          return GatewayAPI.leaderboardXP(selectedPeriod, start, pageSize) as Promise<ApiResult<LBResponse>>;
        case "level":
          return GatewayAPI.leaderboardLevel(selectedPeriod, start, pageSize) as Promise<ApiResult<LBResponse>>;
        case "achievements":
          return GatewayAPI.leaderboardAchievements(selectedPeriod, start, pageSize) as Promise<ApiResult<LBResponse>>;
        case "streak":
          return GatewayAPI.leaderboardStreak(selectedPeriod, start, pageSize) as Promise<ApiResult<LBResponse>>;
        case "distance":
          return GatewayAPI.leaderboardDistance(selectedPeriod, start, pageSize) as Promise<ApiResult<LBResponse>>;
        default:
          return GatewayAPI.getLeaderboard("territory", selectedPeriod, start, pageSize) as Promise<ApiResult<LBResponse>>;
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

  // Note: Route data is now included in all leaderboard responses, no separate API call needed

  const allPlayers = useMemo(() => {
    const entries = apiData?.data?.entries as Array<{
      username?: string;
      user_id?: string;
      rank?: number;
      score?: number;
      territory_area_km2?: number;
      territory_count?: number;
      avg_territory_size?: number;
      recent_claims?: number;
      level?: number;
      total_xp?: number;
      achievement_count?: number;
      current_streak?: number;
      longest_streak?: number;
      total_distance?: number;
      prestige_level?: number;
      title?: string;
      routes_completed?: number;
      territories_claimed?: number;
    }> | undefined;

    if (!entries || entries.length === 0) {
      return [];
    }

    return entries.map((e, idx) => {
      const globalRank = (currentPage * pageSize) + idx + 1;

      // Format score based on category
      let formattedScore = "";
      switch (selectedCategory) {
        case "territory":
          formattedScore = `${(e.territory_area_km2 ?? 0).toFixed(2)} km²`;
          break;
        case "routes":
          formattedScore = `${e.routes_completed ?? 0} routes`;
          break;
        case "xp":
          formattedScore = `${(e.total_xp ?? 0).toLocaleString()} XP`;
          break;
        case "level":
          formattedScore = `Level ${e.level ?? 1}`;
          break;
        case "achievements":
          formattedScore = `${e.achievement_count ?? 0} achievements`;
          break;
        case "streak":
          formattedScore = `${e.current_streak ?? 0} days`;
          break;
        case "distance":
          formattedScore = `${((e.total_distance ?? 0) / 1000).toFixed(1)} km`;
          break;

        default:
          formattedScore = `${e.score ?? 0}`;
      }

      return {
        rank: e.rank ?? globalRank,
        name: e.username ?? `Player ${globalRank}`,
        userId: e.user_id,
        score: e.score ?? 0,
        totalArea: `${(e.territory_area_km2 ?? 0).toFixed(2)} km²`,
        zones: e.territory_count ?? e.territories_claimed ?? 0,
        routes: e.routes_completed ?? 0,
        winRate: "0%",
        level: e.level ?? 1,
        distance: `${((e.total_distance ?? 0) / 1000).toFixed(1)} km`,
        xp: e.total_xp ?? 0,
        achievements: e.achievement_count ?? 0,
        streak: e.current_streak ?? 0,
        prestige: e.prestige_level ?? 0,
        title: e.title,
        trend: "stable" as "up" | "down" | "stable",
        rankChange: 0,
        badge: globalRank <= 3 ? null : null,
        isCurrentUser: e.user_id === userId,
      } as LeaderboardPlayer;
    });
  }, [apiData, selectedCategory, currentPage, pageSize, userId]);

  // Filter players based on search query
  const filteredPlayers = useMemo(() => {
    if (!debouncedSearch.trim()) {
      return allPlayers;
    }
    return allPlayers.filter(player =>
      player.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [allPlayers, debouncedSearch]);


  // Pin current user row at top if present
  const topPlayers = useMemo(() => {
    const idx = filteredPlayers.findIndex(p => p.isCurrentUser);
    if (idx <= 0) return filteredPlayers;
    const self = filteredPlayers[idx];
    const others = filteredPlayers.filter((_, i) => i !== idx);
    return [self, ...others];
  }, [filteredPlayers]);





  const categories = [
    {
      id: "territory" as LeaderboardCategory,
      title: "Most Territory",
      icon: MapPin,
      description: "Total area controlled",
      howToClimb: "Complete routes to capture new territories",
      tooltip: "Measured in square kilometers (km²)",
      color: "territory-claimed",
      statLabel: "Area",
      unit: "km²"
    },
    {
      id: "routes" as LeaderboardCategory,
      title: "Most Completed Routes",
      icon: Route,
      description: "Routes completed successfully",
      howToClimb: "Start and complete more routes",
      tooltip: "Total number of routes you've finished",
      color: "primary",
      statLabel: "Routes",
      unit: "routes"
    },
    {
      id: "xp" as LeaderboardCategory,
      title: "Most XP",
      icon: Zap,
      description: "Total experience points earned",
      howToClimb: "Complete routes, claim territories, and unlock achievements",
      tooltip: "Experience points earned from all activities",
      color: "yellow-500",
      statLabel: "XP",
      unit: "XP"
    },
    {
      id: "level" as LeaderboardCategory,
      title: "Highest Level",
      icon: Crown,
      description: "Player progression level",
      howToClimb: "Earn XP to level up automatically",
      tooltip: "Your current level based on total XP earned",
      color: "purple-500",
      statLabel: "Level",
      unit: "level"
    },
    {
      id: "achievements" as LeaderboardCategory,
      title: "Most Achievements",
      icon: Award,
      description: "Achievements unlocked",
      howToClimb: "Complete challenges and milestones to unlock achievements",
      tooltip: "Total number of achievements you've earned",
      color: "orange-500",
      statLabel: "Achievements",
      unit: "achievements"
    },
    {
      id: "streak" as LeaderboardCategory,
      title: "Longest Streak",
      icon: Flame,
      description: "Consecutive days active",
      howToClimb: "Stay active daily to build your streak",
      tooltip: "Your longest consecutive activity streak in days",
      color: "red-500",
      statLabel: "Streak",
      unit: "days"
    },
    {
      id: "distance" as LeaderboardCategory,
      title: "Most Distance",
      icon: Target,
      description: "Total distance traveled",
      howToClimb: "Complete longer routes to increase your total distance",
      tooltip: "Total distance covered across all your routes",
      color: "blue-500",
      statLabel: "Distance",
      unit: "km"
    }
  ];

  // Map category color tokens to static Tailwind classes
  const colorToTextClass: Record<string, string> = {
    "territory-claimed": "text-territory-claimed",
    "primary": "text-primary",
    "territory-contested": "text-territory-contested",
    "yellow-500": "text-yellow-500",
    "purple-500": "text-purple-500",
    "orange-500": "text-orange-500",
    "red-500": "text-red-500",
    "blue-500": "text-blue-500",
  };
  const colorToBgClass20: Record<string, string> = {
    "territory-claimed": "bg-territory-claimed/20",
    "primary": "bg-primary/20",
    "territory-contested": "bg-territory-contested/20",
    "yellow-500": "bg-yellow-500/20",
    "purple-500": "bg-purple-500/20",
    "orange-500": "bg-orange-500/20",
    "red-500": "bg-red-500/20",
    "blue-500": "bg-blue-500/20",
  };
  const colorToBorderClass30: Record<string, string> = {
    "territory-claimed": "border-territory-claimed/30",
    "primary": "border-primary/30",
    "territory-contested": "border-territory-contested/30",
    "yellow-500": "border-yellow-500/30",
    "purple-500": "border-purple-500/30",
    "orange-500": "border-orange-500/30",
    "red-500": "border-red-500/30",
    "blue-500": "border-blue-500/30",
  };

  const periods = [
    { id: "ALL_TIME" as LeaderboardPeriod, label: "All Time", icon: BarChart3 },
    { id: "MONTHLY" as LeaderboardPeriod, label: "Monthly", icon: Calendar },
    { id: "WEEKLY" as LeaderboardPeriod, label: "Weekly", icon: Users },
  ];

  const getCurrentCategoryInfo = () => {
    return categories.find(cat => cat.id === selectedCategory) || categories[0];
  };

  // Save preferences to localStorage in structured format
  const savePreferences = (metric?: LeaderboardCategory, timeframe?: LeaderboardPeriod) => {
    const current = JSON.parse(localStorage.getItem('rw.lb.pref') || '{}');
    const updated = {
      m: metric || selectedCategory,
      t: timeframe || selectedPeriod
    };
    localStorage.setItem('rw.lb.pref', JSON.stringify(updated));
  };

  const handleCategoryChange = (category: LeaderboardCategory) => {
    setSelectedCategory(category);
    savePreferences(category, undefined);
    setCurrentPage(0);
    // Track event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'lb_change_metric', {
        metric: category,
        previous_metric: selectedCategory
      });
    }
  };

  const handlePeriodChange = (newPeriod: LeaderboardPeriod) => {
    setSelectedPeriodState(newPeriod);
    setPeriod(newPeriod);
    savePreferences(undefined, newPeriod);
    setCurrentPage(0);
    // Track event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'lb_timeframe', {
        timeframe: newPeriod,
        previous_timeframe: selectedPeriod
      });
    }
  };

  // Minimal virtualization to avoid adding deps
  function VirtualizedList<T>({ items, rowHeight, renderItem }: { items: T[]; rowHeight: number; renderItem: (item: T, index: number) => React.ReactNode }) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [height, setHeight] = useState(400);

    const onScroll = useCallback(() => {
      if (containerRef.current) setScrollTop(containerRef.current.scrollTop);
    }, []);

    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      const resize = () => setHeight(el.clientHeight);
      resize();
      const obs = new ResizeObserver(resize);
      obs.observe(el);
      return () => obs.disconnect();
    }, []);

    const total = items.length * rowHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - 5);
    const endIndex = Math.min(items.length, Math.ceil((scrollTop + height) / rowHeight) + 5);
    const offsetY = startIndex * rowHeight;

    const showScroll = items.length > Math.ceil((height || 0) / rowHeight) + 2;
    return (
      <div
        ref={containerRef}
        onScroll={onScroll}
        style={{ maxHeight: 600, overflow: showScroll ? 'auto' : 'hidden' }}
        role="list"
        aria-label="Leaderboard results"
        className="space-y-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-muted [&::-webkit-scrollbar-thumb]:rounded-md [&::-webkit-scrollbar-track]:bg-background"
      >
        <div style={{ height: total, position: 'relative' }}>
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            {items.slice(startIndex, endIndex).map((item, i) => (
              <div key={startIndex + i} style={{ height: rowHeight }} role="listitem">
                {renderItem(item, startIndex + i)}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-6 py-8 pb-24 lg:pb-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="w-8 h-8 text-primary" />
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold">Global Leaderboard</h1>
                    {topPlayers.length > 10 && (
                      <Badge variant="outline" className="text-xs">
                        Top {Math.round((10 / topPlayers.length) * 100)}%
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm mt-1">
                    Compete worldwide. Complete routes to claim territory and climb weekly ranks.
                  </p>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle
                        className="w-5 h-5 text-muted-foreground cursor-pointer hover:text-primary"
                        onClick={() => setShowOnboarding(true)}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Learn how leaderboards work</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Updated {Math.floor((Date.now() - lastUpdated.getTime()) / 60000)}m ago</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button className="bg-gradient-hero hover:shadow-glow" asChild>
                <Link to="/routes/active">
                  <Play className="w-4 h-4 mr-2" />
                  Capture Territory Now
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/dashboard">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Challenge
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Category and Period Selection */}
            <div className="flex gap-3 items-center">
              {/* Category Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 min-w-[200px] justify-between">
                    {React.createElement(getCurrentCategoryInfo().icon, { className: "w-4 h-4" })}
                    <span>{getCurrentCategoryInfo().title}</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64">
                  {categories.map((category) => {
                    const IconComponent = category.icon;
                    return (
                      <DropdownMenuItem
                        key={category.id}
                        onClick={() => handleCategoryChange(category.id)}
                        className="flex items-center gap-3 p-3"
                      >
                        <IconComponent className={`w-4 h-4 ${colorToTextClass[category.color] || 'text-primary'}`} />
                        <div className="flex-1">
                          <div className="font-medium">{category.title}</div>
                          <div className="text-xs text-muted-foreground">{category.description}</div>
                        </div>
                        {selectedCategory === category.id && (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Period Selection */}
              <div className="flex gap-1 bg-muted p-1 rounded-lg">
                {periods.map((p) => {
                  const IconComponent = p.icon;
                  const isSelected = selectedPeriod === p.id;
                  return (
                    <Button
                      key={p.id}
                      variant={isSelected ? "secondary" : "ghost"}
                      size="sm"
                      className="flex items-center gap-1 px-3"
                      onClick={() => handlePeriodChange(p.id)}
                    >
                      <IconComponent className="w-3 h-3" />
                      {p.label}
                    </Button>
                  );
                })}
              </div>
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
                  aria-label="Search players"
                />
              </div>
              {/* Social Filter Tabs */}
              <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
                {[
                  { id: "all", label: "All", icon: Users },
                  { id: "friends", label: "Friends", icon: UserPlus },
                  { id: "city", label: "City", icon: MapPin },
                  { id: "club", label: "Club", icon: Flag }
                ].map((filter) => {
                  const IconComponent = filter.icon;
                  return (
                    <Button
                      key={filter.id}
                      variant={socialFilter === filter.id ? "default" : "ghost"}
                      size="sm"
                      className={`gap-2 min-h-[44px] ${socialFilter === filter.id ? 'bg-background shadow-sm' : ''}`}
                      onClick={() => setSocialFilter(filter.id as any)}
                    >
                      <IconComponent className="w-4 h-4" />
                      <span className="hidden sm:inline">{filter.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* You vs Next Rank - Sticky Card - Only when ≥2 players */}
        {isAuthenticated && topPlayers.length >= 2 && (() => {
          const currentUserRank = topPlayers.find(p => p.isCurrentUser);
          const nextRank = currentUserRank ? topPlayers.find(p => p.rank === currentUserRank.rank - 1) : null;

          if (currentUserRank && nextRank && currentUserRank.rank > 1) {
            const currentCat = getCurrentCategoryInfo();
            const delta = nextRank.score - currentUserRank.score;
            const deltaFormatted = currentCat.unit === "km²" ? `+${delta.toFixed(2)} km²` :
              currentCat.unit === "XP" ? `+${delta.toLocaleString()} XP` :
                currentCat.unit === "days" ? `+${delta} days` :
                  `+${delta} ${currentCat.unit}`;

            return (
              <div className="sticky top-4 z-10 mb-6">
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-lg dark:from-blue-950/20 dark:to-indigo-950/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-lg">
                          <span className="font-bold text-blue-600">#{currentUserRank.rank}</span>
                          <TrendingUp className="w-5 h-5 text-blue-500" />
                          <span className="font-bold text-gray-600">#{nextRank.rank}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {deltaFormatted} to pass @{nextRank.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {getCurrentCategoryInfo().howToClimb}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="bg-gradient-hero hover:shadow-glow font-semibold"
                        asChild
                        onClick={() => {
                          // Track overtake plan click
                          if (typeof window !== 'undefined' && (window as any).gtag) {
                            (window as any).gtag('event', 'overtake_plan_click', {
                              current_rank: currentUserRank.rank,
                              target_rank: nextRank.rank,
                              delta: delta,
                              metric: selectedCategory
                            });
                          }
                        }}
                      >
                        <Link to="/routes/active">
                          Plan Route
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          }
          return null;
        })()}

        <div className={`grid gap-6 lg:gap-8 ${topPlayers.length <= 1 ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-4'
          }`}>
          {/* Main Leaderboard */}
          <div className={topPlayers.length <= 1 ? '' : 'lg:col-span-3'}>
            <Card className="bg-card/80 border-border/50">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 text-xl sm:text-2xl">
                            {React.createElement(getCurrentCategoryInfo().icon, {
                              className: `w-6 h-6 sm:w-7 sm:h-7 ${colorToTextClass[getCurrentCategoryInfo().color] || 'text-primary'}`
                            })}
                            <span className="font-bold">{getCurrentCategoryInfo().title}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{getCurrentCategoryInfo().tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Live Status Badge */}
                    {isLoading || isAutoRefreshing ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        <span>{isAutoRefreshing ? 'Auto-refreshing...' : 'Updating...'}</span>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                        Updated {Math.floor((Date.now() - lastUpdated.getTime()) / 60000)}m ago
                      </Badge>
                    )}
                  </div>
                </CardTitle>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm text-muted-foreground">
                    {getCurrentCategoryInfo().description} • {periods.find(p => p.id === selectedPeriod)?.label}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {getCurrentCategoryInfo().unit}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-8 lg:pb-10">
                {error && (
                  <div className="p-6 text-center">
                    <p className="text-muted-foreground">Failed to load leaderboard data</p>
                    <Button variant="outline" onClick={() => refetch()} className="mt-2">
                      Try Again
                    </Button>
                  </div>
                )}

                {!isLoading && !error && topPlayers.length === 0 && (
                  <div className="p-8 text-center">
                    <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-6 opacity-50" />
                    <h3 className="text-xl font-semibold mb-3">Be the first to rank.</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      {isAuthenticated
                        ? "No one has claimed this leaderboard yet. Start your journey and become the pioneer!"
                        : "The leaderboard is waiting for its first champions. Join the competition!"
                      }
                    </p>
                    {isAuthenticated ? (
                      <div className="space-y-6">
                        {/* Primary CTA */}
                        <Button
                          className="bg-gradient-hero hover:shadow-glow"
                          size="lg"
                          asChild
                          onClick={() => {
                            // Track CTA click
                            if (typeof window !== 'undefined' && (window as any).gtag) {
                              (window as any).gtag('event', 'cta_capture_click', {
                                source: 'empty_leaderboard',
                                metric: selectedCategory
                              });
                            }
                          }}
                        >
                          <Link to="/routes/active">
                            <Play className="w-5 h-5 mr-2" />
                            Start Your First Route
                          </Link>
                        </Button>

                        {/* Secondary helpers as links */}
                        <div className="flex justify-center gap-6 text-sm">
                          <Link to="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">
                            Invite Friends
                          </Link>
                          <button className="text-muted-foreground hover:text-primary transition-colors">
                            Try Sample Route
                          </button>
                          <button
                            onClick={() => setShowOnboarding(true)}
                            className="text-muted-foreground hover:text-primary transition-colors"
                          >
                            Learn How
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">Join thousands of players competing worldwide</p>
                        <div className="flex gap-3 justify-center">
                          <Button variant="outline" size="lg" asChild>
                            <Link to="/login">Sign In</Link>
                          </Button>
                          <Button className="bg-gradient-hero hover:shadow-glow" size="lg" asChild>
                            <Link to="/register">
                              <Trophy className="w-5 h-5 mr-2" />
                              Join Competition
                            </Link>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {isLoading && topPlayers.length === 0 ? (
                  // Skeleton loading
                  <div className="space-y-2 p-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="h-[72px] flex items-center gap-4 p-4 rounded-lg border animate-pulse">
                        <div className="w-10 h-10 bg-muted rounded-full flex-shrink-0"></div>
                        <div className="w-9 h-9 bg-muted rounded-full flex-shrink-0"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-32"></div>
                          <div className="h-3 bg-muted rounded w-48"></div>
                        </div>
                        <div className="text-right">
                          <div className="h-8 bg-muted rounded w-16"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 pt-4 lg:pt-5">
                    <VirtualizedList items={topPlayers} rowHeight={72} renderItem={(player: LeaderboardPlayer) => (
                      <LeaderboardEntry
                        key={`${player.rank}-${player.name}`}
                        player={player}
                        category={selectedCategory}
                        showTrend={true}
                        showStats={true}
                      />
                    )} />
                  </div>
                )}

                {/* Pagination Controls - Only show if ≥25 rows */}
                {topPlayers.length > 0 && (apiData?.data?.total_count || 0) >= 25 && (
                  <div className="flex items-center justify-between p-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Showing {currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, apiData?.data?.total_count || 0)} of {apiData?.data?.total_count || 0} players
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

          {/* Single pill summary for ≤1 player */}
          {topPlayers.length <= 1 && (
            <div className="mt-6 lg:mt-8 text-center">
              <Badge variant="outline" className="px-4 py-2 text-sm">
                {topPlayers.length} player • Top {topPlayers.length > 0 ? (() => {
                  const topPlayer = topPlayers[0];
                  switch (selectedCategory) {
                    case "territory": return topPlayer.totalArea;
                    case "routes": return `${topPlayer.routes} routes`;
                    case "xp": return `${topPlayer.xp.toLocaleString()} XP`;
                    case "level": return `Level ${topPlayer.level}`;
                    case "achievements": return `${topPlayer.achievements} achievements`;
                    case "streak": return `${topPlayer.streak} days`;
                    case "distance": return topPlayer.distance;

                    default: return "0";
                  }
                })() : "0"}
              </Badge>
            </div>
          )}

          {/* Compact Sidebar - Only show if multiple players */}
          {topPlayers.length > 1 && (
            <div className="space-y-6">
              <Card className="bg-card/80 border-border/50">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="text-center p-3 bg-background/50 rounded-lg">
                      <p className="text-xl font-bold text-primary">
                        {totalPlayersData?.data?.total_players ?? 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Players</p>
                    </div>
                    <div className="text-center p-3 bg-background/50 rounded-lg">
                      <p className="text-xl font-bold text-territory-claimed">
                        {topPlayers.length > 0 ? (() => {
                          const topPlayer = topPlayers[0];
                          switch (selectedCategory) {
                            case "territory": return topPlayer.totalArea.split(' ')[0];
                            case "routes": return `${topPlayer.routes}`;
                            case "xp": return `${Math.round(topPlayer.xp / 1000)}k`;
                            case "level": return `${topPlayer.level}`;
                            case "achievements": return `${topPlayer.achievements}`;
                            case "streak": return `${topPlayer.streak}`;
                            case "distance": return topPlayer.distance.split(' ')[0];

                            default: return "0";
                          }
                        })() : "0"}
                      </p>
                      <p className="text-xs text-muted-foreground">Top {getCurrentCategoryInfo().unit}</p>
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-sm font-medium mb-2">{getCurrentCategoryInfo().title}</p>
                    <p className="text-xs text-muted-foreground">{getCurrentCategoryInfo().howToClimb}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Your Position */}
              <Card className="bg-card/80 border-border/50">
                <CardContent className="p-4">
                  {isAuthenticated ? (
                    (() => {
                      const currentUserRank = topPlayers.find(p => p.isCurrentUser);
                      if (currentUserRank) {
                        return (
                          <div className="text-center space-y-3">
                            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-hero/20 mx-auto">
                              <span className="text-xl font-bold text-primary">#{currentUserRank.rank}</span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-lg">{currentUserRank.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {(() => {
                                  switch (selectedCategory) {
                                    case "territory": return currentUserRank.totalArea;
                                    case "routes": return `${currentUserRank.routes} routes`;
                                    case "xp": return `${currentUserRank.xp.toLocaleString()} XP`;
                                    case "level": return `Level ${currentUserRank.level}`;
                                    case "achievements": return `${currentUserRank.achievements} achievements`;
                                    case "streak": return `${currentUserRank.streak} day streak`;
                                    case "distance": return currentUserRank.distance;

                                    default: return "N/A";
                                  }
                                })()}
                              </p>
                            </div>

                            {currentUserRank.title && (
                              <Badge variant="outline" className="text-xs">
                                {currentUserRank.title}
                              </Badge>
                            )}

                            {currentUserRank.prestige > 0 && (
                              <Badge className="bg-yellow-500/20 text-yellow-600 text-xs">
                                <Crown className="w-3 h-3 mr-1" />
                                Prestige {currentUserRank.prestige}
                              </Badge>
                            )}

                            <Button size="sm" variant="outline" className="w-full" asChild>
                              <Link to={`/profile/${currentUserRank.userId}`}>
                                View Profile
                              </Link>
                            </Button>
                          </div>
                        );
                      }
                      return (
                        <div className="text-center space-y-3">
                          <Users className="w-10 h-10 mx-auto text-muted-foreground opacity-50" />
                          <div>
                            <p className="font-medium">Not Ranked Yet</p>
                            <p className="text-sm text-muted-foreground">Complete activities to join the leaderboard</p>
                          </div>
                          <Button size="sm" className="w-full bg-gradient-hero hover:shadow-glow" asChild>
                            <Link to="/routes/active">Start Now</Link>
                          </Button>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-center space-y-3">
                      <Trophy className="w-10 h-10 text-muted-foreground mx-auto opacity-50" />
                      <div>
                        <h4 className="font-semibold">Join the Competition</h4>
                        <p className="text-sm text-muted-foreground">Compete with players worldwide</p>
                      </div>
                      <div className="space-y-2">
                        <Button className="w-full bg-gradient-hero hover:shadow-glow" size="sm" asChild>
                          <Link to="/register">Sign Up</Link>
                        </Button>
                        <Button variant="outline" className="w-full" size="sm" asChild>
                          <Link to="/login">Sign In</Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Mobile Sticky Bottom Bar */}
      {isAuthenticated && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-sm border-t p-4">
          <Button
            className="w-full bg-gradient-hero hover:shadow-glow min-h-[44px]"
            size="lg"
            asChild
            onClick={() => {
              // Track mobile CTA click
              if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'cta_capture_click', {
                  source: 'mobile_sticky_bar',
                  metric: selectedCategory
                });
              }
            }}
          >
            <Link to="/routes/active">
              <Route className="w-5 h-5 mr-2" />
              Capture Territory Now
            </Link>
          </Button>
        </div>
      )}

      {/* Onboarding Dialog */}
      <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-primary" />
              Quick Guide: How to Climb
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
                <MapPin className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold mb-2">Capture Rules</h3>
                <p className="text-sm text-muted-foreground">
                  Create closed loops to claim territory. Larger areas = higher scores.
                </p>
              </div>
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200">
                <Flame className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <h3 className="font-semibold mb-2">Streaks</h3>
                <p className="text-sm text-muted-foreground">
                  Daily activity = streak multipliers. 7+ days = +25% XP bonus.
                </p>
              </div>
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200">
                <Target className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold mb-2">Win Rate</h3>
                <p className="text-sm text-muted-foreground">
                  Successful captures ÷ Total attempts. Defend territories to improve.
                </p>
              </div>
            </div>
            <div className="text-center space-y-2">
              <Button onClick={() => setShowOnboarding(false)} className="bg-gradient-hero hover:shadow-glow">
                Start Climbing!
              </Button>
              <p className="text-xs text-muted-foreground">
                <Link to="/help" className="text-primary hover:underline">View full rules</Link>
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Leaderboard;