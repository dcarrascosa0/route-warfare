import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { 
  MapPin, 
  Route, 
  Trophy, 
  TrendingUp, 
  Target,
  Award,
  Clock,
  Zap,
  Users,
  AlertCircle,
  RefreshCw,
  Calendar,
  Activity,
  Gauge,
  BarChart3
} from 'lucide-react';
import { useUserStatisticsData } from '@/hooks/useUserStatistics';
import { cn } from '@/lib/utils';

interface UserStatisticsEnhancedProps {
  userId: string;
  className?: string;
  showComparison?: boolean;
  showHistory?: boolean;
  showAchievements?: boolean;
  timeRange?: '7d' | '30d' | '90d' | '1y';
}

const UserStatisticsEnhanced: React.FC<UserStatisticsEnhancedProps> = ({
  userId,
  className = "",
  showComparison = true,
  showHistory = true,
  showAchievements = true,
  timeRange = '30d'
}) => {
  const { 
    statistics, 
    comparison, 
    history, 
    achievements, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useUserStatisticsData(userId, timeRange);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className={className}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load user statistics: {error?.message}</span>
            <Button variant="outline" size="sm" onClick={() => refetch?.()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className={className}>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No statistics available for this user.</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Format numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Format distance
  const formatDistance = (meters: number) => {
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
    return `${meters} m`;
  };

  // Format area
  const formatArea = (sqm: number) => {
    if (sqm >= 1000000) return `${(sqm / 1000000).toFixed(2)} km²`;
    return `${(sqm / 1000).toFixed(0)} m²`;
  };

  // Get trend indicator
  const getTrendIndicator = (current: number, previous: number) => {
    if (current > previous) {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else if (current < previous) {
      return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
    }
    return <div className="w-4 h-4" />;
  };

  // Calculate percentage change
  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Overview Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            User Statistics Overview
            <Badge variant="outline" className="ml-auto">
              Last {timeRange}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Total Routes */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Route className="w-5 h-5 text-blue-500" />
                {comparison && getTrendIndicator(statistics.totalRoutes, comparison.totalRoutes)}
              </div>
              <div className="text-2xl font-bold text-primary">
                {formatNumber(statistics.totalRoutes)}
              </div>
              <div className="text-sm text-muted-foreground">Total Routes</div>
              {comparison && (
                <div className="text-xs text-muted-foreground">
                  {getPercentageChange(statistics.totalRoutes, comparison.totalRoutes) > 0 ? '+' : ''}
                  {getPercentageChange(statistics.totalRoutes, comparison.totalRoutes).toFixed(1)}%
                </div>
              )}
            </div>

            {/* Total Distance */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Target className="w-5 h-5 text-green-500" />
                {comparison && getTrendIndicator(statistics.totalDistance, comparison.totalDistance)}
              </div>
              <div className="text-2xl font-bold text-primary">
                {formatDistance(statistics.totalDistance)}
              </div>
              <div className="text-sm text-muted-foreground">Total Distance</div>
              {comparison && (
                <div className="text-xs text-muted-foreground">
                  {getPercentageChange(statistics.totalDistance, comparison.totalDistance) > 0 ? '+' : ''}
                  {getPercentageChange(statistics.totalDistance, comparison.totalDistance).toFixed(1)}%
                </div>
              )}
            </div>

            {/* Territories Claimed */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <MapPin className="w-5 h-5 text-purple-500" />
                {comparison && getTrendIndicator(statistics.territoriesClaimed, comparison.territoriesClaimed)}
              </div>
              <div className="text-2xl font-bold text-primary">
                {formatNumber(statistics.territoriesClaimed)}
              </div>
              <div className="text-sm text-muted-foreground">Territories</div>
              {comparison && (
                <div className="text-xs text-muted-foreground">
                  {getPercentageChange(statistics.territoriesClaimed, comparison.territoriesClaimed) > 0 ? '+' : ''}
                  {getPercentageChange(statistics.territoriesClaimed, comparison.territoriesClaimed).toFixed(1)}%
                </div>
              )}
            </div>

            {/* Total Area */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Award className="w-5 h-5 text-orange-500" />
                {comparison && getTrendIndicator(statistics.totalArea, comparison.totalArea)}
              </div>
              <div className="text-2xl font-bold text-primary">
                {formatArea(statistics.totalArea)}
              </div>
              <div className="text-sm text-muted-foreground">Total Area</div>
              {comparison && (
                <div className="text-xs text-muted-foreground">
                  {getPercentageChange(statistics.totalArea, comparison.totalArea) > 0 ? '+' : ''}
                  {getPercentageChange(statistics.totalArea, comparison.totalArea).toFixed(1)}%
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="territories">Territories</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          {showHistory && history && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Activity Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="routes" 
                      stackId="1"
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.6}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="territories" 
                      stackId="1"
                      stroke="#82ca9d" 
                      fill="#82ca9d" 
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {statistics.recentActivity?.map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {activity.type}
                    </Badge>
                  </div>
                )) || (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent activity available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="w-5 h-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Route Completion Rate</span>
                    <span>{statistics.routeCompletionRate}%</span>
                  </div>
                  <Progress value={statistics.routeCompletionRate} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Territory Success Rate</span>
                    <span>{statistics.territorySuccessRate}%</span>
                  </div>
                  <Progress value={statistics.territorySuccessRate} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Average GPS Quality</span>
                    <span>{statistics.averageGPSQuality}/100</span>
                  </div>
                  <Progress value={statistics.averageGPSQuality} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Route Types Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Route className="w-5 h-5" />
                  Route Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={statistics.routeTypeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statistics.routeTypeDistribution?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Territories Tab */}
        <TabsContent value="territories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Territory Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {statistics.territoriesOwned}
                  </div>
                  <div className="text-sm text-muted-foreground">Currently Owned</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {statistics.territoriesContested}
                  </div>
                  <div className="text-sm text-muted-foreground">Contested</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {statistics.territoriesLost}
                  </div>
                  <div className="text-sm text-muted-foreground">Lost</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatArea(statistics.averageTerritorySize)}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Size</div>
                </div>
              </div>

              {/* Territory Size Distribution */}
              {statistics.territorySizeDistribution && (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={statistics.territorySizeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="size" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4">
          {showAchievements && achievements && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Achievement Progress
                  <Badge variant="outline" className="ml-auto">
                    {achievements.completed}/{achievements.total}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Overall Progress</span>
                      <span>{Math.round((achievements.completed / achievements.total) * 100)}%</span>
                    </div>
                    <Progress 
                      value={(achievements.completed / achievements.total) * 100} 
                      className="h-3"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {achievements.categories?.map((category) => (
                      <div key={category.name} className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-lg font-semibold">
                          {category.completed}/{category.total}
                        </div>
                        <div className="text-sm text-muted-foreground">{category.name}</div>
                        <Progress 
                          value={(category.completed / category.total) * 100} 
                          className="h-2 mt-2"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Recent Achievements */}
                  {achievements.recent && achievements.recent.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Recent Achievements</h4>
                      <div className="space-y-2">
                        {achievements.recent.map((achievement) => (
                          <div key={achievement.id} className="flex items-center gap-3 p-2 bg-background rounded border">
                            <Trophy className="w-4 h-4 text-yellow-500" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{achievement.name}</p>
                              <p className="text-xs text-muted-foreground">{achievement.description}</p>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {achievement.points} pts
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserStatisticsEnhanced;