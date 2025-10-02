import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useMemo } from 'react';
import { GatewayAPI, type ApiResult } from '@/lib/api';
import type { UserStatistics } from '@/lib/api/types/gamification';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  MapPin,
  Activity,
  Clock,
  AlertCircle,
  Play,
  Trophy,
  Route,
  Target,
  ChevronDown,
  ChevronUp,
  X,
  Info
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { queryKeys, invalidateQueries } from '@/lib/query';
import { useWebSocketManager } from '@/hooks/useWebSocketManager';
import { useDashboardMetrics } from '@/components/features/dashboard';
import { useGamificationProfile } from '@/hooks/useGamification';
import { trackDashboard } from '@/lib/utils/tracking';

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { onMessage } = useWebSocketManager({ autoConnect: true });

  // Local state for UI interactions
  const [isGuideExpanded, setIsGuideExpanded] = useState(() => {
    return !localStorage.getItem('dashboard_guide_completed');
  });
  const [showTerritoryInfo, setShowTerritoryInfo] = useState(true);

  // Real-time updates for dashboard data
  useEffect(() => {
    if (!user?.id) return;
    const subs: Array<() => void | undefined> = [];

    subs.push(onMessage('route_completed', () => {
      invalidateQueries.userProfile(queryClient, user.id);
      invalidateQueries.routes(queryClient, user.id);
    }));

    subs.push(onMessage('territory_claimed', () => {
      invalidateQueries.territoryStatistics(queryClient, user.id);
    }));

    return () => { subs.forEach(off => off?.()); };
  }, [onMessage, queryClient, user?.id]);

  // Fetch user statistics with memoized refresh every 60s
  const { data: statistics, isLoading: statsLoading } = useQuery<ApiResult<UserStatistics>, ApiResult<unknown>, UserStatistics | undefined>({
    queryKey: queryKeys.userStatistics(user!.id),
    queryFn: () => GatewayAPI.userStatistics(user!.id),
    enabled: !!user,
    select: (res) => (res.ok ? res.data : undefined),
    refetchInterval: 60000, // Refresh every 60 seconds
    staleTime: 30000, // Consider data stale after 30 seconds
  });

  // Fetch active route for resume banner
  const { data: activeRoute } = useQuery({
    queryKey: queryKeys.activeRoute(user!.id),
    queryFn: () => GatewayAPI.getActiveRoute(user!.id),
    enabled: !!user,
    refetchInterval: 30000,
  });

  // Fetch gamification profile
  const { data: gamificationProfile } = useGamificationProfile(user?.id || '', !!user?.id);

  // Dashboard metrics configuration
  const { metrics, userType } = useDashboardMetrics({
    statistics,
    isLoading: statsLoading
  });

  // Check if user has been inactive for 7+ days (placeholder logic for now)
  const isInactiveUser = false; // This would need to come from a separate last_activity field

  // Memoized calculations for performance
  const isNearLevelUp = useMemo(() => {
    return gamificationProfile && gamificationProfile.xp_to_next_level &&
      gamificationProfile.xp_to_next_level <= 50; // Within 50 XP of next level
  }, [gamificationProfile]);

  // Get suggested route (placeholder for now)
  const suggestedRoute = useMemo(() => "Central Park Loop", []);

  // Track dashboard view
  useEffect(() => {
    trackDashboard.view();
  }, []);

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

  return (
    <div className="min-h-screen bg-background p-2 md:p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Welcome Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold">Welcome back, {user?.username}.</h1>
        </div>

        {/* Primary CTA - Above the fold */}
        <Card className="p-4 md:p-5 rounded-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              {activeRoute ? (
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-green-600" />
                  <div>
                    <h2 className="text-lg font-semibold text-green-800">Continue your run</h2>
                    <p className="text-sm text-green-700">Resume tracking to complete your loop</p>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-lg font-semibold mb-1">Start Run</h2>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">{suggestedRoute}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Begin GPS tracking to claim territory</p>
                </div>
              )}
            </div>
            <Button
              asChild
              size="lg"
              className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-3"
              onClick={() => trackDashboard.ctaStartRun()}
            >
              <Link to="/routes" className="flex items-center justify-center gap-2">
                <Play className="w-4 h-4" />
                {activeRoute ? 'Continue Run' : 'Start Run'}
              </Link>
            </Button>
          </div>
        </Card>

        {/* Inactive user nudge */}
        {isInactiveUser && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              Restart your streak! It's been a while since your last run.
            </AlertDescription>
          </Alert>
        )}

        {/* KPI Strip - Weekly by default */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{statistics?.routes_completed || 0}</div>
            <div className="text-sm text-muted-foreground">Routes</div>
            <Badge variant="outline" className="text-xs mt-1">This week</Badge>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{((statistics?.total_distance || 0) / 1000).toFixed(1)}km</div>
            <div className="text-sm text-muted-foreground">Distance</div>
            <Badge variant="outline" className="text-xs mt-1">This week</Badge>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{((statistics?.territory_area || 0) / 1000000).toFixed(2)}km²</div>
            <div className="text-sm text-muted-foreground">Territory</div>
            <Badge variant="outline" className="text-xs mt-1">This week</Badge>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{statistics?.current_streak || 0}</div>
            <div className="text-sm text-muted-foreground">Streak</div>
            <Badge variant="outline" className="text-xs mt-1">This week</Badge>
          </div>
        </div>

        {/* Next Best Actions */}
        <Card className="p-4 md:p-5 rounded-xl">
          <h3 className="font-semibold mb-3">Next best actions</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild
              onClick={() => trackDashboard.nextBestActionClick('capture_territory')}
            >
              <Link to="/territory">Capture territory near you</Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => trackDashboard.nextBestActionClick('invite_friend')}
            >
              Invite a friend
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
              onClick={() => trackDashboard.nextBestActionClick('check_rank')}
            >
              <Link to="/leaderboard">Check your rank</Link>
            </Button>
          </div>
        </Card>

        {/* Gamification Card - Streamlined */}
        <Card className="p-4 md:p-5 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Trophy className="h-4 w-4 text-purple-500" />
              Level {gamificationProfile?.level || 1}
            </h3>
            <div className="text-sm text-muted-foreground">
              {gamificationProfile?.total_xp || 0} XP
            </div>
          </div>

          {/* Level Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Progress to Level {(gamificationProfile?.level || 1) + 1}</span>
              {isNearLevelUp && (
                <span className="text-purple-600 font-medium">
                  ~1 route to Level {(gamificationProfile?.level || 1) + 1}
                </span>
              )}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                style={{
                  width: `${gamificationProfile ? Math.min(100, ((gamificationProfile.xp || 0) / ((gamificationProfile.xp_to_next_level || 100) + (gamificationProfile.xp || 0))) * 100) : 0}%`
                }}
              />
            </div>
          </div>

          {/* Next 3 Quests */}
          <div className="space-y-2 mb-4">
            <h4 className="text-sm font-medium">Active Quests</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <span className="text-sm">Complete 1 loop</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-xs"
                  onClick={() => trackDashboard.questClick('Complete 1 loop')}
                  asChild
                >
                  <Link to="/routes">Do it</Link>
                </Button>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <span className="text-sm">Invite 1 friend</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-xs"
                  onClick={() => trackDashboard.questClick('Invite 1 friend')}
                >
                  Do it
                </Button>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <span className="text-sm">Claim 0.10 km²</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-xs"
                  onClick={() => trackDashboard.questClick('Claim 0.10 km²')}
                  asChild
                >
                  <Link to="/territory">Do it</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          <div className="flex gap-2 text-sm">
            <Button variant="ghost" size="sm" asChild className="h-auto p-0 text-purple-600">
              <Link to="/achievements">Achievements</Link>
            </Button>
            <span className="text-muted-foreground">•</span>
            <Button variant="ghost" size="sm" asChild className="h-auto p-0 text-purple-600">
              <Link to="/leaderboard">Leaderboard</Link>
            </Button>
          </div>
        </Card>

        {/* Quick Start Guide - Collapsible */}
        {userType === 'new' && (
          <Collapsible open={isGuideExpanded} onOpenChange={(open) => {
            setIsGuideExpanded(open);
            if (open) trackDashboard.guideExpand();
          }}>
            <Card className="p-4 md:p-5 rounded-xl">
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <h3 className="font-semibold">Quick Start Guide</h3>
                {isGuideExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                    <div>
                      <p className="font-medium">Start your first route</p>
                      <p className="text-sm text-muted-foreground">Click "Start Run" to begin GPS tracking</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                    <div>
                      <p className="font-medium">Complete a closed loop</p>
                      <p className="text-sm text-muted-foreground">Return to your starting point to claim territory</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
                    <div>
                      <p className="font-medium">Explore features</p>
                      <p className="text-sm text-muted-foreground">Check leaderboards and manage your territories</p>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 text-xs"
                  onClick={() => {
                    localStorage.setItem('dashboard_guide_completed', 'true');
                    setIsGuideExpanded(false);
                    trackDashboard.dismissEducation();
                  }}
                >
                  Mark as completed
                </Button>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* Territory System - Dismissible Info */}
        {showTerritoryInfo && (
          <Alert className="relative">
            <Info className="h-4 w-4" />
            <AlertDescription className="pr-8">
              Complete closed loops to claim territory and compete with other players.
              <Button variant="ghost" size="sm" asChild className="ml-2 h-auto p-0 text-blue-600">
                <Link to="/territory">Learn more</Link>
              </Button>
            </AlertDescription>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-2 h-auto p-1"
              onClick={() => {
                setShowTerritoryInfo(false);
                trackDashboard.dismissEducation();
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </Alert>
        )}
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t md:hidden">
        <Button
          asChild
          size="lg"
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold"
          onClick={() => trackDashboard.ctaStartRun()}
        >
          <Link to="/routes" className="flex items-center justify-center gap-2">
            <Play className="w-4 h-4" />
            {activeRoute ? 'Continue Run' : 'Start Run'}
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;