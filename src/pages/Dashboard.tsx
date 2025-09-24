import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { GatewayAPI, type ApiResult, type UserStatistics, type Territory } from '@/lib/api';
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
import { UnitsFormatter } from '@/lib/format/units';
import { UserStats } from '@/components/features/user-profile';
import { queryKeys, invalidateQueries } from '@/lib/query';
import { useWebSocketManager } from '@/hooks/useWebSocketManager';

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { onMessage } = useWebSocketManager({ autoConnect: true });

  // Real-time updates for dashboard data
  useEffect(() => {
    if (!user?.id) return;
    const subs: Array<() => void | undefined> = [];

    subs.push(onMessage('route_completed', () => {
      invalidateQueries.userProfile(queryClient, user.id);
      invalidateQueries.routes(queryClient, user.id);
    }));

    subs.push(onMessage('territory_claimed', () => {
      invalidateQueries.territories(queryClient, user.id);
      invalidateQueries.territoryStatistics(queryClient, user.id);
    }));

    return () => { subs.forEach(off => off?.()); };
  }, [onMessage, queryClient, user?.id]);

  // Fetch user profile and statistics (with graceful fallback)
  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: queryKeys.userProfile(user!.id),
    queryFn: () => GatewayAPI.userProfile(user!.id),
    enabled: !!user,
  });

  const { data: statistics, isLoading: statsLoading } = useQuery<ApiResult<UserStatistics>, ApiResult<unknown>, UserStatistics | undefined>({
    queryKey: queryKeys.userStatistics(user!.id),
    queryFn: () => GatewayAPI.userStatistics(user!.id),
    enabled: !!user,
    select: (res) => (res.ok ? res.data : undefined),
  });

  // Fetch user territories (with graceful fallback)
  const { data: territories, isLoading: territoriesLoading } = useQuery<ApiResult<Territory[]>, ApiResult<unknown>, Territory[]>({
    queryKey: queryKeys.userTerritories(user!.id),
    queryFn: () => GatewayAPI.getUserTerritories(user!.id),
    enabled: !!user,
    select: (res) => (res.ok && res.data ? res.data : []),
  });

  // Fetch active route for resume banner
  const { data: activeRoute } = useQuery({
    queryKey: queryKeys.activeRoute(user!.id),
    queryFn: () => GatewayAPI.getActiveRoute(user!.id),
    enabled: !!user,
    refetchInterval: 30000,
  });

  const isLoading = profileLoading || statsLoading;

  // Mock recent activity for now (would come from notification service)
  const recentActivity: any[] = [
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
      description: 'Unlocked "First Steps" achievement',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      data: { achievementName: 'First Steps' }
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
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user?.username}!</h1>
            <p className="text-muted-foreground">Jump back in and claim more territory.</p>
          </div>
          <Button asChild size="lg" className="bg-gradient-hero hover:shadow-glow">
            <Link to="/routes" className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              Start Run
            </Link>
          </Button>
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

        {/* Resume Banner (above the fold) */}
        {activeRoute && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-semibold text-green-800">Active run in progress</div>
                  <div className="text-sm text-green-700">Resume tracking to complete your loop and claim territory.</div>
                </div>
              </div>
              <Button asChild size="sm" variant="outline" className="border-green-300 text-green-700">
                <Link to="/routes">Resume</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Minimal Overview Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Territory</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {UnitsFormatter.areaKm2(statistics?.total_territory_area_km2 || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">{statistics?.total_territories || 0} zones</p>
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
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {statistics?.total_routes || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {((statistics?.completion_rate || 0) * 100).toFixed(1)}% success rate
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
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">#{statistics?.rank || '—'}</div>
                  <p className="text-xs text-muted-foreground">{(statistics?.total_distance_km || 0).toFixed(1)} km</p>
                </>
              )}
            </CardContent>
          </Card>
          {/* Keep one more tile minimal to avoid clutter */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{((statistics?.completion_rate || 0) * 100).toFixed(0)}%</div>
                  <p className="text-xs text-muted-foreground">of routes completed</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Compact content to keep focus on Start Run */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-4 h-4" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">{new Date(activity.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Territories Overview (trimmed) */}
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
                      {UnitsFormatter.areaKm2(territory.area_km2)}
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
                  Finish a closed loop to claim your first territory.
                </p>
                <Button asChild className="bg-gradient-hero hover:shadow-glow">
                  <Link to="/routes">Start Run</Link>
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