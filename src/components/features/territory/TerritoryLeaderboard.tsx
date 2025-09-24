import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Trophy, Medal, Award, Target, MapPin, Activity,
  TrendingUp, Users, BarChart3, Clock, Zap
} from 'lucide-react';
import {
  useLeaderboard,
  useLeaderboardStats,
  useLeaderboardCategories
} from '@/hooks/useTerritoryLeaderboard';
import type { LeaderboardEntry, LeaderboardResponse } from '@/lib/api/types/leaderboard';

interface LeaderboardProps {
  userId?: string;
  className?: string;
  showAchievements?: boolean;
  compact?: boolean;
}

export const TerritoryLeaderboard: React.FC<LeaderboardProps> = ({
  userId,
  className = '',
  showAchievements = true,
  compact = false
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('territory_area');
  const [selectedPeriod, setSelectedPeriod] = useState('ALL_TIME');

  const { categories } = useLeaderboardCategories();

  const {
    data: leaderboardData,
    isLoading: isLoadingLeaderboard,
    error: leaderboardError
  } = useLeaderboard(selectedCategory, selectedPeriod, 0, 20);

  const {
    data: statsData,
    isLoading: isLoadingStats
  } = useLeaderboardStats(selectedCategory);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const formatScore = (score: number, category: string) => {
    switch (category) {
      case 'territory_area':
        return `${score.toFixed(2)} km²`;
      case 'routes_completed':
        return `${Math.round(score)} routes`;
      case 'win_rate':
        return `${score.toFixed(1)}%`;
      default:
        return score.toString();
    }
  };

  const getEntryDetails = (entry: LeaderboardEntry, category: string) => {
    switch (category) {
      case 'territory_area':
        return `${entry.territory_count || 0} territories claimed`;
      case 'routes_completed':
        return `${(entry.territory_area_km2 || 0).toFixed(2)} km² territory`;
      case 'win_rate':
        return `Completion rate`;
      default:
        return '';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'territory_area':
        return <MapPin className="h-4 w-4" />;
      case 'routes_completed':
        return <Activity className="h-4 w-4" />;
      case 'win_rate':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Trophy className="h-4 w-4" />;
    }
  };

  if (leaderboardError) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Failed to load territory leaderboard
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className={compact ? "p-4" : "p-6"}>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Leaderboard
          </CardTitle>

          {!compact && (
            <div className="flex items-center gap-2">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL_TIME">All Time</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="DAILY">Daily</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className={compact ? "p-4 pt-0" : "p-6 pt-0"}>
        {/* Category Selection */}
        <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value)}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            {categories.map((category) => (
              <TabsTrigger
                key={category.key}
                value={category.key}
                className="text-xs"
                title={category.description}
              >
                <span className="mr-1">{category.icon}</span>
                {compact ? '' : category.name.split(' ')[0]}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category.key} value={category.key} className="space-y-4">
              {/* Stats Summary */}
              {!compact && (
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {statsData?.total_participants || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Players</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {statsData ? formatScore(statsData.top_score, category.key) : '-'}
                    </div>
                    <div className="text-xs text-muted-foreground">Top Score</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {leaderboardData?.user_rank ? `#${leaderboardData.user_rank}` : 'Unranked'}
                    </div>
                    <div className="text-xs text-muted-foreground">Your Rank</div>
                  </div>
                </div>
              )}

              {/* User Status */}
              {leaderboardData?.user_rank && leaderboardData?.user_score !== undefined && (
                <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">You</Badge>
                      <span className="font-medium">Rank #{leaderboardData.user_rank}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">
                        {formatScore(leaderboardData.user_score, category.key)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Leaderboard Entries */}
              <div className="space-y-2">
                {isLoadingLeaderboard ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg animate-pulse">
                        <div className="w-8 h-8 bg-muted rounded-full" />
                        <div className="flex-1 space-y-1">
                          <div className="w-24 h-4 bg-muted rounded" />
                          <div className="w-32 h-3 bg-muted rounded" />
                        </div>
                        <div className="w-16 h-4 bg-muted rounded" />
                      </div>
                    ))}
                  </div>
                ) : leaderboardData?.entries?.length ? (
                  leaderboardData.entries.map((entry: LeaderboardEntry) => (
                    <div
                      key={entry.user_id}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${entry.user_id === userId
                        ? 'bg-primary/10 border border-primary/20'
                        : 'bg-muted/30 hover:bg-muted/50'
                        }`}
                    >
                      <div className="flex items-center justify-center w-8 h-8">
                        {getRankIcon(entry.rank)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {entry.username}
                          </span>
                          {entry.user_id === userId && (
                            <Badge variant="secondary" className="text-xs">You</Badge>
                          )}
                        </div>
                        {!compact && (
                          <div className="text-xs text-muted-foreground">
                            {getEntryDetails(entry, category.key)}
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-sm">
                          {formatScore(entry.score, category.key)}
                        </div>
                        {entry.change !== undefined && (
                          <div className={`text-xs flex items-center gap-1 ${entry.change > 0 ? 'text-green-600' :
                            entry.change < 0 ? 'text-red-600' : 'text-muted-foreground'
                            }`}>
                            {entry.change > 0 && <TrendingUp className="h-3 w-3" />}
                            {entry.change !== 0 && Math.abs(entry.change)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <div>No leaderboard data available</div>
                    <div className="text-xs">Complete routes and claim territories to appear here</div>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TerritoryLeaderboard;