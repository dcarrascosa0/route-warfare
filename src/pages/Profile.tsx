import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  MapPin,
  Route,
  Trophy,
  Target,
  Calendar,
  Activity,
  Crown,
  Shield,
  Edit,
  User,
  Zap,
  Star,
  Award,
  MoreVertical,
  UserPlus,
  Flag,
  TrendingUp,
  Clock,
  Flame,
  Filter,
  Search,
  ChevronRight,
  Settings,
  Eye,
  Info,
  Users,
  BarChart3,
  ArrowUpDown
} from "lucide-react";
import { UnitsFormatter } from "@/lib/format/units";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys, invalidateQueries } from "@/lib/query";
import { GatewayAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate, useParams } from "react-router-dom";
import { useWebSocketManager } from "@/hooks/useWebSocketManager";
import { useGamificationProfile } from "@/hooks/useGamification";
import { useUserAchievements } from "@/hooks/useAchievements";
import { AchievementCard } from "@/components/features/gamification/AchievementCard";
import { motion, AnimatePresence } from "framer-motion";

interface UserData {
  id: string;
  email: string;
  username: string;
  profile_picture?: string;
  created_at: string;
  last_login?: string;
  is_verified?: boolean;
  is_active?: boolean;
  bio?: string;
}

const Profile = () => {
  const { user: paramUser, section: paramSection } = useParams<{ user?: string; section?: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { onMessage } = useWebSocketManager({ autoConnect: true });

  // Determine if this is own profile or another user's profile
  const isOwnProfile = !paramUser || paramUser === currentUser?.id;
  const resolvedUserId = isOwnProfile ? currentUser?.id : paramUser;

  // Persist active tab in localStorage
  const [tab, setTab] = useState(() => {
    const savedTab = localStorage.getItem('rw.profile.tab');
    return (paramSection as string | undefined) ?? savedTab ?? 'overview';
  });

  const onTab = (t: string) => {
    setTab(t);
    localStorage.setItem('rw.profile.tab', t);

    // Track tab changes
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'profile_tab_change', {
        tab: t,
        user_id: resolvedUserId,
        is_own_profile: isOwnProfile
      });
    }

    if (t === 'overview') {
      navigate(isOwnProfile ? '/profile' : `/profile/${paramUser}`);
    } else {
      navigate(isOwnProfile ? `/profile/${currentUser?.id}/${t}` : `/profile/${paramUser}/${t}`);
    }
  };

  // State for achievement filters
  const [achievementFilter, setAchievementFilter] = useState<'all' | 'earned' | 'locked'>('earned');
  const [achievementTypeFilter, setAchievementTypeFilter] = useState<string>('all');
  const [achievementTierFilter, setAchievementTierFilter] = useState<string>('all');
  const [achievementSearch, setAchievementSearch] = useState('');
  const [achievementPage, setAchievementPage] = useState(1);
  const [routeSort, setRouteSort] = useState<'date' | 'distance' | 'territory'>('date');
  const achievementsPerPage = 12;

  // Track profile view
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'profile_view', {
        user_id: resolvedUserId,
        is_own_profile: isOwnProfile
      });
    }
  }, [resolvedUserId, isOwnProfile]);

  // Real-time updates for profile data
  useEffect(() => {
    if (!resolvedUserId) return;
    const subs: Array<() => void | undefined> = [];

    subs.push(onMessage('route_completed', () => {
      invalidateQueries.userProfile(queryClient, resolvedUserId);
      invalidateQueries.routes(queryClient, resolvedUserId);
    }));

    subs.push(onMessage('territory_claimed', () => {
      invalidateQueries.territories(queryClient, resolvedUserId);
      invalidateQueries.territoryStatistics(queryClient, resolvedUserId);
    }));

    return () => { subs.forEach(off => off?.()); };
  }, [onMessage, queryClient, resolvedUserId]);

  // Data queries
  const {
    data: profileData,
    isLoading: profileIsLoading,
    isError: profileIsError,
  } = useQuery({
    queryKey: queryKeys.userProfile(resolvedUserId as string),
    queryFn: () => GatewayAPI.userProfile(resolvedUserId as string),
    enabled: !!resolvedUserId,
    select: (res: any) => {
      if (res && typeof res === 'object' && 'ok' in res) {
        return res.ok ? res.data : undefined;
      }
      return res;
    },
  });

  const { data: userRoutes } = useQuery({
    queryKey: queryKeys.routesForUser(resolvedUserId as string, 50, "all"),
    queryFn: () => GatewayAPI.routesForUser(resolvedUserId as string, 50, "all"),
    enabled: !!resolvedUserId,
    select: (res: any) => {
      if (res && typeof res === 'object' && 'ok' in res) {
        return res.ok && res.data ? res.data : [];
      }
      return Array.isArray(res) ? res : [];
    },
  });

  const { data: userTerritories } = useQuery({
    queryKey: queryKeys.userTerritories(resolvedUserId as string),
    queryFn: () => GatewayAPI.getUserTerritories(resolvedUserId as string),
    enabled: !!resolvedUserId,
    select: (res: any) => {
      if (res && typeof res === 'object' && 'ok' in res) {
        return res.ok && res.data ? res.data : [];
      }
      return Array.isArray(res) ? res : [];
    },
  });

  // Gamification data
  const { data: gamificationProfile, isLoading: gamificationLoading } = useGamificationProfile(resolvedUserId || '', !!resolvedUserId);
  const { data: gamificationAchievements } = useUserAchievements(resolvedUserId || '');

  const profile = profileData;

  // Calculate statistics
  const totalRoutes = Array.isArray(userRoutes) ? userRoutes.length : 0;
  const completedRoutes = Array.isArray(userRoutes) ? userRoutes.filter((r: any) => r.status === 'completed').length : 0;
  const activeRoutes = Array.isArray(userRoutes) ? userRoutes.filter((r: any) => r.status === 'active').length : 0;
  const totalTerritories = Array.isArray(userTerritories) ? userTerritories.length : 0;
  const totalTerritoryArea = Array.isArray(userTerritories) ? userTerritories.reduce((sum: number, t: any) => sum + (t.area_km2 || 0), 0) : 0;
  const winRate = totalRoutes > 0 ? Math.round((completedRoutes / totalRoutes) * 100) : 0;
  // Mock streak value - would come from streak service
  const currentStreak = Math.floor(Math.random() * 10); // Random value for demo
  const totalDistance = Array.isArray(userRoutes) ? userRoutes.reduce((sum: number, r: any) => sum + (r.stats?.distance_m || 0), 0) : 0;

  // Mock percentile calculation (would come from backend)
  const globalPercentile = Math.max(1, Math.min(99, Math.round(85 - (gamificationProfile?.level || 1) * 2)));

  // Recent achievements (last 3)
  const recentAchievements = useMemo(() => {
    if (!gamificationAchievements) return [];
    return gamificationAchievements
      .filter((ua: any) => ua.earned_at)
      .sort((a: any, b: any) => new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime())
      .slice(0, 3);
  }, [gamificationAchievements]);

  // Recent routes (last 3)
  const recentRoutes = useMemo(() => {
    if (!userRoutes) return [];
    return userRoutes
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3);
  }, [userRoutes]);

  // Filter achievements for the achievements tab
  const filteredAchievements = useMemo(() => {
    if (!gamificationAchievements) return [];

    let filtered = gamificationAchievements;

    // Filter by earned/locked status
    if (achievementFilter === 'earned') {
      filtered = filtered.filter((ua: any) => ua.earned_at);
    } else if (achievementFilter === 'locked') {
      filtered = filtered.filter((ua: any) => !ua.earned_at);
    }

    // Filter by type
    if (achievementTypeFilter !== 'all') {
      filtered = filtered.filter((ua: any) => ua.achievement?.category === achievementTypeFilter);
    }

    // Filter by tier
    if (achievementTierFilter !== 'all') {
      filtered = filtered.filter((ua: any) => ua.achievement?.tier === achievementTierFilter);
    }

    // Filter by search
    if (achievementSearch) {
      filtered = filtered.filter((ua: any) =>
        ua.achievement?.name?.toLowerCase().includes(achievementSearch.toLowerCase()) ||
        ua.achievement?.description?.toLowerCase().includes(achievementSearch.toLowerCase())
      );
    }

    return filtered;
  }, [gamificationAchievements, achievementFilter, achievementTypeFilter, achievementTierFilter, achievementSearch]);

  // Paginated achievements
  const paginatedAchievements = useMemo(() => {
    const startIndex = (achievementPage - 1) * achievementsPerPage;
    return filteredAchievements.slice(startIndex, startIndex + achievementsPerPage);
  }, [filteredAchievements, achievementPage]);

  // Sorted routes
  const sortedRoutes = useMemo(() => {
    if (!userRoutes) return [];

    const sorted = [...userRoutes];
    switch (routeSort) {
      case 'date':
        return sorted.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'distance':
        return sorted.sort((a: any, b: any) => (b.stats?.distance_m || 0) - (a.stats?.distance_m || 0));
      case 'territory':
        return sorted.sort((a: any, b: any) => (b.stats?.territory_area_km2 || 0) - (a.stats?.territory_area_km2 || 0));
      default:
        return sorted;
    }
  }, [userRoutes, routeSort]);

  const totalPages = Math.ceil(filteredAchievements.length / achievementsPerPage);

  // Get unique achievement types and tiers for filters
  const achievementTypes = useMemo(() => {
    if (!gamificationAchievements) return [];
    const types = new Set(gamificationAchievements.map((ua: any) => ua.achievement?.category).filter(Boolean));
    return Array.from(types);
  }, [gamificationAchievements]);

  const achievementTiers = useMemo(() => {
    if (!gamificationAchievements) return [];
    const tiers = new Set(gamificationAchievements.map((ua: any) => ua.achievement?.tier).filter(Boolean));
    return Array.from(tiers);
  }, [gamificationAchievements]);

  // Determine CTA text based on active routes
  const ctaText = useMemo(() => {
    if (activeRoutes > 0) {
      return "Continue Route";
    }
    return "Start Route";
  }, [activeRoutes]);

  if (!resolvedUserId || !currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-6">
          <CardContent>
            <p className="text-center text-muted-foreground">Please log in to view your profile.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (profileIsLoading || gamificationLoading) {
    return <ProfileSkeleton />;
  }

  if (profileIsError || (!profileIsLoading && !profile)) {
    const title = isOwnProfile ? "Could not load your profile" : "Profile not found";
    const description = isOwnProfile
      ? "There was an issue fetching your profile data. Please try again later."
      : "The user profile you are looking for does not exist.";

    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">{title}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">

          {/* Compact Hero Section - Reduced height by ~32px */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10" />
            <CardContent className="relative p-5 md:p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                      {profile?.username ? profile.username.substring(0, 2).toUpperCase() : "??"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-2xl font-bold mb-1">{profile?.username}</h1>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <span>Joined {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : "Unknown"}</span>
                      <span>•</span>
                      <span>Last active 2 days ago</span>
                    </div>
                    <Badge className="bg-green-500/20 text-green-600 text-xs">
                      Top {globalPercentile}% global
                    </Badge>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  {isOwnProfile ? (
                    <>
                      <Button variant="outline" size="sm" className="min-h-[44px]">
                        <Settings className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                      <Button variant="outline" size="sm" className="min-h-[44px]">
                        <Eye className="w-4 h-4 mr-2" />
                        Privacy
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" className="min-h-[44px]">
                        Challenge
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="min-h-[44px]">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Follow
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Compare
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Flag className="w-4 h-4 mr-2" />
                            Report
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                </div>
              </div>

              {/* Stat strip with fixed spacing */}
              <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground mb-4">
                <li>
                  <Tooltip>
                    <TooltipTrigger>
                      <span><span className="font-medium">Level</span> {gamificationProfile?.level || 1}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Current player level based on XP earned</p>
                    </TooltipContent>
                  </Tooltip>
                </li>
                <li><span className="font-medium">XP</span> {gamificationProfile?.total_xp?.toLocaleString() || 0}</li>
                <li>
                  <Tooltip>
                    <TooltipTrigger>
                      <span><span className="font-medium">Territory</span> {totalTerritoryArea.toFixed(2)} km²</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total territory area claimed: {totalTerritoryArea.toFixed(2)} km²</p>
                    </TooltipContent>
                  </Tooltip>
                </li>
                <li>
                  <Tooltip>
                    <TooltipTrigger>
                      <span><span className="font-medium">Win rate</span> {winRate}%</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Percentage of routes completed successfully</p>
                    </TooltipContent>
                  </Tooltip>
                </li>
                <li>
                  <Tooltip>
                    <TooltipTrigger>
                      <span className="flex items-center gap-1">
                        <span className="font-medium">Streak</span> {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Current consecutive days of activity</p>
                    </TooltipContent>
                  </Tooltip>
                </li>
                <li><span className="font-medium">Distance</span> {UnitsFormatter.distance(totalDistance)}</li>
              </ul>

              {/* Primary CTA */}
              <Button
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:shadow-lg min-h-[44px]"
                onClick={() => {
                  if (typeof window !== 'undefined' && (window as any).gtag) {
                    (window as any).gtag('event', 'cta_continue_route', {
                      user_id: resolvedUserId,
                      is_own_profile: isOwnProfile,
                      has_active_routes: activeRoutes > 0
                    });
                  }
                  navigate('/routes');
                }}
              >
                <Route className="w-4 h-4 mr-2" />
                {isOwnProfile ? ctaText : "Challenge Player"}
              </Button>
            </CardContent>
          </Card>

          {/* Tabs with mb-4 spacing */}
          <nav className="mb-4">
            <Tabs value={tab} onValueChange={onTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview" className="min-h-[44px] focus:ring-2 focus:ring-primary focus:ring-offset-2">Overview</TabsTrigger>
                <TabsTrigger value="achievements" className="min-h-[44px] focus:ring-2 focus:ring-primary focus:ring-offset-2">Achievements</TabsTrigger>
                <TabsTrigger value="stats" className="min-h-[44px] focus:ring-2 focus:ring-primary focus:ring-offset-2">Stats</TabsTrigger>
                <TabsTrigger value="activity" className="min-h-[44px] focus:ring-2 focus:ring-primary focus:ring-offset-2">Activity</TabsTrigger>
                <TabsTrigger value="routes" className="min-h-[44px] focus:ring-2 focus:ring-primary focus:ring-offset-2">Routes</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview">
                <section className="grid gap-4 md:gap-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                    {/* Main content */}
                    <div className="lg:col-span-2 space-y-4 md:space-y-6">
                      {/* Recent Achievements */}
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <Trophy className="w-5 h-5" />
                            Recent Achievements
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="min-h-[44px] focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            onClick={() => {
                              if (typeof window !== 'undefined' && (window as any).gtag) {
                                (window as any).gtag('event', 'profile_view_all_achievements', {
                                  user_id: resolvedUserId,
                                  is_own_profile: isOwnProfile
                                });
                              }
                              onTab('achievements');
                            }}
                          >
                            View all <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </CardHeader>
                        <CardContent>
                          {recentAchievements.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {recentAchievements.map((userAchievement: any, index: number) => (
                                <AchievementCard
                                  key={userAchievement.achievement_id || `achievement-${index}`}
                                  achievement={userAchievement.achievement}
                                  userAchievement={userAchievement}
                                  variant="list"
                                  showProgress={false}
                                  showRarity={false}
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                              <p className="text-muted-foreground">No achievements yet</p>
                              <Button className="mt-2 min-h-[44px]" onClick={() => navigate('/routes')}>
                                Earn your first achievement
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Recent Routes */}
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <Route className="w-5 h-5" />
                            Recent Routes
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="min-h-[44px] focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            onClick={() => onTab('routes')}
                          >
                            View all <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </CardHeader>
                        <CardContent>
                          {recentRoutes.length > 0 ? (
                            <div className="space-y-3">
                              {recentRoutes.map((route: any) => (
                                <div key={route.id} className="flex items-center justify-between p-3 rounded-lg border">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${route.status === 'completed' ? 'bg-green-500' : route.status === 'active' ? 'bg-blue-500' : 'bg-gray-400'}`} />
                                    <div>
                                      <Tooltip>
                                        <TooltipTrigger>
                                          <p className="font-medium text-left truncate max-w-[200px]">
                                            {route.name || `Route ${route.id.slice(0, 8)}`}
                                          </p>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>{route.name || `Route ${route.id.slice(0, 8)}`}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                      <p className="text-sm text-muted-foreground">
                                        {new Date(route.created_at).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-medium">{route.stats?.territory_area_km2 ? UnitsFormatter.areaKm2(route.stats.territory_area_km2) : '0 km²'}</p>
                                    <p className="text-xs text-muted-foreground capitalize">{route.status}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <Route className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                              <p className="text-muted-foreground">No routes yet</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4 md:space-y-6">
                      {/* Mini activity chart */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Activity (Last 4 weeks)</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-24 bg-muted/20 rounded flex items-center justify-center">
                            <p className="text-sm text-muted-foreground">No activity in the last 4 weeks</p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Quick stats */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Quick Stats</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Routes completed</span>
                            <span className="font-medium">{completedRoutes}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Total achievements</span>
                            <span className="font-medium">{gamificationAchievements?.filter((ua: any) => ua.earned_at).length || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Territory claimed</span>
                            <span className="font-medium">{UnitsFormatter.areaKm2(totalTerritoryArea)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </section>
              </TabsContent>

              {/* Achievements Tab */}
              <TabsContent value="achievements">
                <section className="grid gap-4 md:gap-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>All Achievements</CardTitle>
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                            <Input
                              placeholder="Search achievements..."
                              value={achievementSearch}
                              onChange={(e) => setAchievementSearch(e.target.value)}
                              className="pl-9 w-64"
                            />
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Filter className="w-4 h-4 mr-2" />
                                {achievementFilter === 'all' ? 'All' : achievementFilter === 'earned' ? 'Earned' : 'Locked'}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => setAchievementFilter('earned')}>
                                Earned ({gamificationAchievements?.filter((ua: any) => ua.earned_at).length || 0})
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setAchievementFilter('locked')}>
                                Locked ({gamificationAchievements?.filter((ua: any) => !ua.earned_at).length || 0})
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setAchievementFilter('all')}>
                                All ({gamificationAchievements?.length || 0})
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                Type
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => setAchievementTypeFilter('all')}>
                                All Types
                              </DropdownMenuItem>
                              {achievementTypes.map((type) => (
                                <DropdownMenuItem key={type} onClick={() => setAchievementTypeFilter(type)}>
                                  {type}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                Tier
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => setAchievementTierFilter('all')}>
                                All Tiers
                              </DropdownMenuItem>
                              {achievementTiers.map((tier) => (
                                <DropdownMenuItem key={tier} onClick={() => setAchievementTierFilter(tier)}>
                                  {tier}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {paginatedAchievements.length > 0 ? (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                            {paginatedAchievements.map((userAchievement: any, index: number) => (
                              <AchievementCard
                                key={userAchievement.achievement_id || `achievement-${index}`}
                                achievement={userAchievement.achievement}
                                userAchievement={userAchievement}
                                variant="grid"
                                showProgress={!userAchievement.earned_at} // Only show progress on locked items
                                showRarity={true}
                              />
                            ))}
                          </div>

                          {/* Pagination */}
                          {totalPages > 1 && (
                            <div className="flex items-center justify-between pb-6">
                              <p className="text-sm text-muted-foreground">
                                Showing {((achievementPage - 1) * achievementsPerPage) + 1} to {Math.min(achievementPage * achievementsPerPage, filteredAchievements.length)} of {filteredAchievements.length} achievements
                              </p>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setAchievementPage(p => Math.max(1, p - 1))}
                                  disabled={achievementPage === 1}
                                  className="min-h-[44px]"
                                >
                                  Previous
                                </Button>
                                <span className="text-sm">
                                  Page {achievementPage} of {totalPages}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setAchievementPage(p => Math.min(totalPages, p + 1))}
                                  disabled={achievementPage === totalPages}
                                  className="min-h-[44px]"
                                >
                                  Next
                                </Button>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-12">
                          <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                          <h3 className="font-semibold mb-2">No achievements found</h3>
                          <p className="text-muted-foreground">
                            {achievementFilter === 'earned'
                              ? "You haven't earned any achievements yet. Start exploring to unlock your first achievement!"
                              : "No achievements match your search criteria."
                            }
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </section>
              </TabsContent>

              {/* Stats Tab */}
              <TabsContent value="stats">
                <section className="grid gap-4 md:gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {/* Route Performance */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Route Performance</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Total routes</span>
                          <span className="font-medium">{totalRoutes}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Completed</span>
                          <span className="font-medium">{completedRoutes}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Success rate</span>
                          <span className="font-medium">{winRate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Total distance</span>
                          <span className="font-medium">{UnitsFormatter.distance(totalDistance)}</span>
                        </div>
                        {/* Tiny sparkline placeholder */}
                        <div className="mt-4">
                          <div className="h-8 bg-muted/20 rounded flex items-center justify-center">
                            <p className="text-xs text-muted-foreground">No activity data</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Territory */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Territory</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Areas claimed</span>
                          <span className="font-medium">{totalTerritories}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Total area</span>
                          <span className="font-medium">{UnitsFormatter.areaKm2(totalTerritoryArea)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Avg per route</span>
                          <span className="font-medium">{completedRoutes > 0 ? UnitsFormatter.areaKm2(totalTerritoryArea / completedRoutes) : '0 km²'}</span>
                        </div>
                        {/* Tiny sparkline placeholder */}
                        <div className="mt-4">
                          <div className="h-8 bg-muted/20 rounded flex items-center justify-center">
                            <p className="text-xs text-muted-foreground">No territory data</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* XP */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">XP</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Total XP</span>
                          <span className="font-medium">{gamificationProfile?.total_xp?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Current level</span>
                          <span className="font-medium">{gamificationProfile?.level || 1}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">To next level</span>
                          <span className="font-medium">{gamificationProfile?.xp_to_next_level || 0}</span>
                        </div>
                        {/* Tiny sparkline placeholder */}
                        <div className="mt-4">
                          <div className="h-8 bg-muted/20 rounded flex items-center justify-center">
                            <p className="text-xs text-muted-foreground">No XP data</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </section>
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity">
                <section className="grid gap-4 md:gap-6">
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Activity Timeline</h3>
                      <p className="text-muted-foreground">
                        Activity timeline feature coming soon! This will show your daily activities, achievements unlocked, and progress over time.
                      </p>
                    </CardContent>
                  </Card>
                </section>
              </TabsContent>

              {/* Routes Tab */}
              <TabsContent value="routes">
                <section className="grid gap-4 md:gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>All Routes</CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <ArrowUpDown className="w-4 h-4 mr-2" />
                            Sort by {routeSort}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => setRouteSort('date')}>
                            Date (newest first)
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setRouteSort('distance')}>
                            Distance (longest first)
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setRouteSort('territory')}>
                            Territory gained (most first)
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardHeader>
                    <CardContent>
                      {sortedRoutes && sortedRoutes.length > 0 ? (
                        <div className="space-y-3">
                          {sortedRoutes.map((route: any) => (
                            <div key={route.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/20 transition-colors">
                              <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${route.status === 'completed' ? 'bg-green-500' : route.status === 'active' ? 'bg-blue-500' : 'bg-gray-400'}`} />
                                <div className="min-w-0 flex-1">
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <p className="font-medium text-left truncate">
                                        {route.name || `Route ${route.id.slice(0, 8)}`}
                                      </p>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{route.name || `Route ${route.id.slice(0, 8)}`}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(route.created_at).toLocaleDateString()} • {route.stats?.distance_m ? UnitsFormatter.distance(route.stats.distance_m) : '0 m'} • {route.stats?.territory_area_km2 ? UnitsFormatter.areaKm2(route.stats.territory_area_km2) : '0 km²'} territory gained
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <Badge variant={route.status === 'completed' ? 'default' : route.status === 'active' ? 'secondary' : 'outline'}>
                                  {route.status}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="min-h-[44px]"
                                  onClick={() => {
                                    if (typeof window !== 'undefined' && (window as any).gtag) {
                                      (window as any).gtag('event', 'routes_row_view', {
                                        route_id: route.id,
                                        route_status: route.status,
                                        user_id: resolvedUserId
                                      });
                                    }
                                    navigate(`/routes/history/${route.id}`);
                                  }}
                                >
                                  View
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Route className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                          <h3 className="text-lg font-semibold mb-2">No routes yet</h3>
                          <p className="text-muted-foreground mb-4">
                            Start your first route to begin tracking your progress and claiming territory.
                          </p>
                          <Button onClick={() => navigate('/routes')} className="min-h-[44px]">
                            Start Your First Route
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </section>
              </TabsContent>
            </Tabs>
          </nav>

          {/* Mobile sticky action bar */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t md:hidden">
            <Button
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 min-h-[44px]"
              onClick={() => {
                if (typeof window !== 'undefined' && (window as any).gtag) {
                  (window as any).gtag('event', 'cta_continue_route', {
                    user_id: resolvedUserId,
                    is_own_profile: isOwnProfile,
                    has_active_routes: activeRoutes > 0,
                    source: 'mobile_sticky'
                  });
                }
                navigate('/routes');
              }}
            >
              <Route className="w-4 h-4 mr-2" />
              {isOwnProfile ? ctaText : "Challenge Player"}
            </Button>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
};

// Loading skeleton component
const ProfileSkeleton = () => (
  <div className="min-h-screen bg-background">
    <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <Card>
        <CardContent className="p-5 md:p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <Skeleton className="w-16 h-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
          <Skeleton className="h-4 w-full mb-4" />
          <Skeleton className="h-8 w-32" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-48 mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4 md:space-y-6">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-32 mb-4" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  </div>
);

export default Profile;