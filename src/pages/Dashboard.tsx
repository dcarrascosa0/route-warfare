import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { GatewayAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MapPin,
  Route,
  Trophy,
  TrendingUp,
  Activity,
  Clock,
  AlertCircle,
  Play,
  Map
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { UserStats } from '@/components/features/user-profile';
import type { UserProfile, UserStatistics, UserAchievement } from '@/lib/api/types';

interface DashboardData {
  user: UserProfile;
  statistics: UserStatistics;
  achievements: UserAchievement[];
}

interface Territory {
  id: string;
  name: string;
  area: number;
  status: 'claimed' | 'contested' | 'neutral';
  claimed_at: string;
}

interface RecentActivity {
  id: string;
  type: 'route_completed' | 'territory_claimed' | 'achievement_unlocked';
  description: string;
  timestamp: string;
  data?: any;
}

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();

  // Fetch user profile and statistics (with graceful fallback)
  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['user', 'profile', user?.id],
    queryFn: async (): Promise<DashboardData> => {
      if (!user?.id) {
        return {
          user: {
            id: user?.id || '',
            email: user?.email || '',
            username: user?.username || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          statistics: {
            total_routes: 0,
            total_distance_km: 0,
            total_duration_hours: 0,
            total_territories: 0,
            total_territory_area_km2: 0,
            average_speed_kmh: 0,
            completion_rate: 0,
            rank: 0,
          },
          achievements: [],
        };
      }

      try {
        // Fetch profile, statistics, and achievements separately
        const [profileRes, statsRes, achievementsRes] = await Promise.allSettled([
          GatewayAPI.userProfile(user.id),
          GatewayAPI.userStatistics(user.id),
          GatewayAPI.userAchievements(user.id),
        ]);

        const userProfile = profileRes.status === 'fulfilled' && profileRes.value.ok
          ? profileRes.value.data as UserProfile
          : {
            id: user.id,
            email: user.email || '',
            username: user.username || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

        const statistics = statsRes.status === 'fulfilled' && statsRes.value.ok
          ? statsRes.value.data as UserStatistics
          : {
            total_routes: 0,
            total_distance_km: 0,
            total_duration_hours: 0,
            total_territories: 0,
            total_territory_area_km2: 0,
            average_speed_kmh: 0,
            completion_rate: 0,
            rank: 0,
          };

        const achievements = achievementsRes.status === 'fulfilled' && achievementsRes.value.ok
          ? achievementsRes.value.data as UserAchievement[]
          : [];

        return {
          user: userProfile,
          statistics,
          achievements,
        };
      } catch (error) {
        console.warn('Dashboard profile API unavailable, using fallback data');
        return {
          user: {
            id: user.id,
            email: user.email || '',
            username: user.username || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          statistics: {
            total_routes: 0,
            total_distance_km: 0,
            total_duration_hours: 0,
            total_territories: 0,
            total_territory_area_km2: 0,
            average_speed_kmh: 0,
            completion_rate: 0,
            rank: 0,
          },
          achievements: [],
        };
      }
    },
    enabled: !!user?.id,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Fetch user territories (with graceful fallback)
  const { data: territories, isLoading: territoriesLoading } = useQuery({
    queryKey: ['territories', 'user', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      try {
        const response = await GatewayAPI.getUserTerritories(user.id);
        if (!response.ok) return []; // Return empty array on failure
        return (response.data as any)?.territories || response.data || [];
      } catch (error) {
        console.warn('Dashboard territories API unavailable, using empty data');
        return [];
      }
    },
    enabled: !!user?.id,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Fetch active route (with graceful fallback)
  const { data: activeRoute, isLoading: routeLoading } = useQuery({
    queryKey: ['route', 'active', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      try {
        const response = await GatewayAPI.getActiveRoute(user.id);
        if (!response.ok) return null;
        return response.data;
      } catch (error) {
        console.warn('Dashboard active route API unavailable');
        return null;
      }
    },
    enabled: !!user?.id,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Mock recent activity for now (would come from notification service)
  const recentActivity: RecentActivity[] = [
    {
      id: '1',
      type: 'route_completed',
      description: 'Completed morning jog route',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      type: 'territory_claimed',
      description: 'Claimed Central Park territory',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      type: 'achievement_unlocked',
      description: 'Unlocked "Explorer" achievement',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please log in to view your dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Remove error blocking - we now handle errors gracefully with fallback data
  // Show a warning if there are API issues but still display the dashboard
  const hasApiIssues = profileError;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Welcome back, {user?.username}!
            </h1>
            <p className="text-muted-foreground">
              Here's what's happening in your territory conquest journey.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild className="bg-gradient-hero hover:shadow-glow">
              <Link to="/routes" className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                Start Route
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/territory" className="flex items-center gap-2">
                <Map className="w-4 h-4" />
                View Map
              </Link>
            </Button>
          </div>
        </div>

        {/* API Issues Warning */}
        {hasApiIssues && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Some features may be limited due to backend connectivity issues. Data shown may be incomplete.
            </AlertDescription>
          </Alert>
        )}

        {/* Active Route Alert */}
        {activeRoute && (
          <Alert className="border-green-200 bg-green-50">
            <Activity className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              You have an active route in progress!
              <Link to="/routes" className="ml-2 underline font-medium">
                Continue tracking →
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Territory</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {profileLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {profile?.statistics.total_territory_area_km2?.toFixed(2) || '0'} km²
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {profile?.statistics.total_territories || 0} zones claimed
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Routes Completed</CardTitle>
              <Route className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {profileLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {profile?.statistics.total_routes || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {((profile?.statistics.completion_rate || 0) * 100).toFixed(1)}% success rate
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Rank</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {profileLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    #{profile?.statistics.rank || 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {profile?.statistics.total_distance_km?.toFixed(1) || 0} km total
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Speed</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {profileLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {profile?.statistics.average_speed_kmh?.toFixed(1) || 0} km/h
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Keep exploring!
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Statistics */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                {profile ? (
                  <UserStats statistics={{
                    total_territory_area: profile.statistics.total_territory_area_km2,
                    total_zones: profile.statistics.total_territories,
                    routes_completed: profile.statistics.total_routes,
                    win_rate: profile.statistics.completion_rate,
                    current_rank: profile.statistics.rank || 0,
                    level: Math.floor((profile.statistics.total_routes || 0) / 10) + 1, // Calculate level based on routes
                    experience: (profile.statistics.total_routes || 0) * 100 + (profile.statistics.total_territory_area_km2 || 0) * 50, // Calculate XP
                  }} />
                ) : (
                  <div className="space-y-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Territories Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Your Territories</CardTitle>
          </CardHeader>
          <CardContent>
            {territoriesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : territories && territories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {territories.slice(0, 6).map((territory) => (
                  <div
                    key={territory.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{territory.name}</h4>
                      <Badge
                        variant={
                          territory.status === 'claimed'
                            ? 'default'
                            : territory.status === 'contested'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {territory.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {territory.area.toFixed(2)} km²
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Claimed {new Date(territory.claimed_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No territories yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start tracking routes to claim your first territory!
                </p>
                <Button asChild className="bg-gradient-hero hover:shadow-glow">
                  <Link to="/routes">Start Your First Route</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;