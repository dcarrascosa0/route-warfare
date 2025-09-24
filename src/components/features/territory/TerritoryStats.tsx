import { useState, useCallback, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UnitsFormatter } from "@/lib/format/units";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MapPin, 
  Trophy, 
  Target, 
  TrendingUp, 
  Calendar, 
  Users, 
  Award,
  Crown,
  Medal,
  ArrowUpDown,
  ChevronsRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGlobalTerritoryWebSocket } from "@/hooks/useTerritoryWebSocket";
import type { LeaderboardEntry } from "@/lib/api/types";
import { Skeleton } from "@/components/ui/skeleton";

interface TerritoryStatsProps {
  userStats?: any;
  leaderboard?: LeaderboardEntry[];
  sortBy?: string;
  onSortChange?: (sortBy: string) => void;
  className?: string;
  compact?: boolean;
  isLoading?: boolean;
}

// Achievement levels based on territory count and area
const getAchievementLevel = (territoryCount: number, totalArea: number) => {
  if (territoryCount === 0) return { level: "Newcomer", color: "bg-gray-500", icon: Target };
  if (territoryCount < 5 || totalArea < 1) return { level: "Explorer", color: "bg-blue-500", icon: MapPin };
  if (territoryCount < 15 || totalArea < 10) return { level: "Conqueror", color: "bg-green-500", icon: Award };
  if (territoryCount < 30 || totalArea < 50) return { level: "Warlord", color: "bg-purple-500", icon: Medal };
  return { level: "Emperor", color: "bg-yellow-500", icon: Crown };
};

// Use unified UnitsFormatter for area
const formatArea = (areaKm2: number) => UnitsFormatter.areaKm2(areaKm2);

// Format date for display
const formatDate = (dateString?: string) => {
  if (!dateString) return "Never";
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Get rank display with appropriate styling
const getRankDisplay = (rank: number, total: number) => {
  const percentage = ((total - rank + 1) / total) * 100;
  
  if (rank === 1) return { text: "1st", color: "text-yellow-600", icon: Crown };
  if (rank === 2) return { text: "2nd", color: "text-gray-500", icon: Medal };
  if (rank === 3) return { text: "3rd", color: "text-amber-600", icon: Medal };
  if (percentage >= 90) return { text: `${rank}th`, color: "text-green-600", icon: Trophy };
  if (percentage >= 75) return { text: `${rank}th`, color: "text-blue-600", icon: Award };
  return { text: `${rank}th`, color: "text-muted-foreground", icon: Target };
};

const StatCard = ({
  title,
  value,
  icon: Icon,
  isLoading,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  isLoading?: boolean;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <Skeleton className="h-8 w-24" />
      ) : (
        <div className="text-2xl font-bold">{value}</div>
      )}
    </CardContent>
  </Card>
);

const TerritoryStatsContent = ({
  userStats,
  leaderboard = [],
  sortBy = "total_area",
  onSortChange,
  compact,
  isLoading,
}: TerritoryStatsProps) => {
  const [selectedMetric, setSelectedMetric] = useState<string>(sortBy);
  const [realtimeLeaderboard, setRealtimeLeaderboard] = useState<LeaderboardEntry[]>(leaderboard);

  // WebSocket integration for real-time leaderboard updates
  const handleLeaderboardUpdate = useCallback((data: any) => {
    if (data.leaderboard && Array.isArray(data.leaderboard.entries)) {
      setRealtimeLeaderboard(data.leaderboard.entries);
    }
  }, []);

  const { isConnected } = useGlobalTerritoryWebSocket({
    onLeaderboardUpdate: handleLeaderboardUpdate,
  });

  // Update local leaderboard when prop changes
  useEffect(() => {
    setRealtimeLeaderboard(leaderboard);
  }, [leaderboard]);

  // Use real-time leaderboard if available
  const activeLeaderboard = realtimeLeaderboard;

  // Mock user stats if not provided
  const stats = userStats || {
    territory_count: 0,
    total_area_km2: 0,
    average_area_km2: 0,
    area_ranking: 0,
    count_ranking: 0,
    total_users: 1,
    percentile_area: 0,
    percentile_count: 0,
    contested_territories: 0
  };

  const achievement = getAchievementLevel(stats.territory_count, stats.total_area_km2);
  const AchievementIcon = achievement.icon;

  const areaRankDisplay = getRankDisplay(stats.area_ranking, stats.total_users);
  const countRankDisplay = getRankDisplay(stats.count_ranking, stats.total_users);
  const AreaRankIcon = areaRankDisplay.icon;
  const CountRankIcon = countRankDisplay.icon;

  const handleSortChange = (newSort: string) => {
    setSelectedMetric(newSort);
    onSortChange?.(newSort);
  };

  if (compact) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Key Statistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total Claimed Area</span>
            {isLoading ? <Skeleton className="h-5 w-20" /> : <strong>{UnitsFormatter.areaKm2((stats as any)?.total_area_km2 ?? 0)}</strong>}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Average Territory Size</span>
            {isLoading ? <Skeleton className="h-5 w-20" /> : <strong>{UnitsFormatter.areaKm2((stats as any)?.average_area_km2 ?? 0)}</strong>}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total Territories</span>
            {isLoading ? <Skeleton className="h-5 w-20" /> : <strong>{(stats as any)?.territory_count?.toLocaleString() ?? 0}</strong>}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total Users</span>
            {isLoading ? <Skeleton className="h-5 w-20" /> : <strong>{(stats as any)?.total_users ?? 0}</strong>}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Achievement and Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AchievementIcon className="h-5 w-5" />
                Territory Overview
              </CardTitle>
              <CardDescription>Your territorial achievements and progress</CardDescription>
            </div>
            <Badge className={cn("text-white", achievement.color)}>
              {achievement.level}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Territory Count */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Territories</span>
              </div>
              <div className="text-2xl font-bold">{stats.territory_count}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <CountRankIcon className="h-3 w-3" />
                <span className={countRankDisplay.color}>
                  {countRankDisplay.text} of {stats.total_users}
                </span>
              </div>
            </div>

            {/* Total Area */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Total Area</span>
              </div>
              <div className="text-2xl font-bold">{formatArea(stats.total_area_km2)}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <AreaRankIcon className="h-3 w-3" />
                <span className={areaRankDisplay.color}>
                  {areaRankDisplay.text} of {stats.total_users}
                </span>
              </div>
            </div>

            {/* Average Area */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Avg. Area</span>
              </div>
              <div className="text-2xl font-bold">{formatArea(stats.average_area_km2)}</div>
              <div className="text-xs text-muted-foreground">
                Per territory
              </div>
            </div>

            {/* removed contested tile */}
          </div>

          {/* Progress Bars */}
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Area Percentile</span>
                <span>{stats.percentile_area.toFixed(1)}%</span>
              </div>
              <Progress value={stats.percentile_area} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Count Percentile</span>
                <span>{stats.percentile_count.toFixed(1)}%</span>
              </div>
              <Progress value={stats.percentile_count} className="h-2" />
            </div>
          </div>

          {/* Activity Timeline */}
          {(stats.first_claim_date || stats.latest_claim_date) && (
            <div className="mt-6 pt-4 border-t">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">First Claim:</span>
                  <span className="font-medium">{formatDate(stats.first_claim_date)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Latest Claim:</span>
                  <span className="font-medium">{formatDate(stats.latest_claim_date)}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Territory Leaderboard
              </CardTitle>
              <CardDescription>Top territory conquerors</CardDescription>
            </div>
            <Select value={selectedMetric} onValueChange={handleSortChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="total_area">Total Area</SelectItem>
                <SelectItem value="territory_count">Territory Count</SelectItem>
                <SelectItem value="average_area">Average Area</SelectItem>
                <SelectItem value="latest_claim">Recent Activity</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {activeLeaderboard.length > 0 ? (
            <div className="space-y-2">
              {activeLeaderboard.map((entry, index) => {
                const rankDisplay = getRankDisplay(entry.rank, activeLeaderboard.length);
                const RankIcon = rankDisplay.icon;
                
                return (
                  <div
                    key={entry.user_id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("flex items-center gap-1", rankDisplay.color)}>
                        <RankIcon className="h-4 w-4" />
                        <span className="font-bold text-lg">{entry.rank}</span>
                      </div>
                      <div>
                        <div className="font-medium">{entry.username || `Player ${entry.user_id.substring(0, 8)}`}</div>
                        <div className="text-sm text-muted-foreground">
                          {(entry.territory_count ?? 0)} territories • {formatArea(entry.territory_area_km2 ?? 0)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {selectedMetric === "total_area" && formatArea(entry.territory_area_km2 ?? 0)}
                        {selectedMetric === "territory_count" && `${entry.territory_count ?? 0} territories`}
                        {selectedMetric === "average_area" && formatArea(entry.avg_territory_size ?? 0)}
                        {selectedMetric === "latest_claim" && `${entry.recent_claims ?? 0} recent claims`}
                      </div>
                      {(entry.recent_claims ?? 0) > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {entry.recent_claims} recent claims
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">No leaderboard data available</p>
              <p className="text-sm text-muted-foreground">
                Start claiming territories to appear on the leaderboard
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export const TerritoryStats = (props: TerritoryStatsProps) => (
  <TerritoryStatsContent {...props} />
);

export default TerritoryStats;