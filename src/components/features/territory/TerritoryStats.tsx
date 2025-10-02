import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UnitsFormatter } from "@/lib/format/units";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  MapPin, 
  Target, 
  TrendingUp, 
  Calendar, 
  Award,
  Crown,
  Medal,
  Trophy
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface TerritoryStatsProps {
  userStats?: any;
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



const TerritoryStatsContent = ({
  userStats,
  compact,
  isLoading,
}: TerritoryStatsProps) => {

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
    claims_last_7d: 0
  };

  const achievement = getAchievementLevel(stats.territory_count, stats.total_area_km2);
  const AchievementIcon = achievement.icon;

  const areaRankDisplay = getRankDisplay(stats.area_ranking, stats.total_users);
  const countRankDisplay = getRankDisplay(stats.count_ranking, stats.total_users);
  const AreaRankIcon = areaRankDisplay.icon;
  const CountRankIcon = countRankDisplay.icon;



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

            {/* Claims Last 7 Days */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Claims 7d</span>
              </div>
              <div className="text-2xl font-bold">{stats.claims_last_7d}</div>
              <div className="text-xs text-muted-foreground">
                Recent activity
              </div>
            </div>
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


    </div>
  );
};

export const TerritoryStats = (props: TerritoryStatsProps) => (
  <TerritoryStatsContent {...props} />
);

export default TerritoryStats;