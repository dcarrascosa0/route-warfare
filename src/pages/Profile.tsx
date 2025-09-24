import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Save,
  X
} from "lucide-react";
import { UnitsFormatter } from "@/lib/format/units";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys, invalidateQueries } from "@/lib/query";
import { GatewayAPI, type ApiResult, type UserProfile, type UserStatistics, type Territory, type Route as ApiRoute, type UserAchievement } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { UserStats, AchievementGrid } from "@/components/features/user-profile";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate, useParams } from "react-router-dom";
import { useWebSocketManager } from "@/hooks/useWebSocketManager";

interface UserData {
  id: string;
  email: string;
  username: string;
  profile_picture?: string;
  created_at: string;
  last_login?: string;
  is_verified?: boolean;
  is_active?: boolean;
}


const Profile = () => {
  const { user: paramUser, section: paramSection } = useParams<{ user?: string; section?: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { onMessage } = useWebSocketManager({ autoConnect: true });
  const resolvedUserId = (paramUser as string | undefined) ?? currentUser?.id;

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
  const isOwnProfile = !paramUser;
  const section = (paramSection as string | undefined) ?? "overview";

  const {
    data: profileData,
    isLoading: profileIsLoading,
    isError: profileIsError,
    error: profileError,
  } = useQuery({
    queryKey: queryKeys.userProfile(resolvedUserId as string),
    queryFn: () => GatewayAPI.userProfile(resolvedUserId as string),
    enabled: !!resolvedUserId,
    select: (res: any) => {
      // Handle ApiResult wrapper
      if (res && typeof res === 'object' && 'ok' in res) {
        return res.ok ? res.data : undefined;
      }
      // Handle direct data
      return res;
    },
  });

  const { data: userRoutes } = useQuery({
    queryKey: queryKeys.routesForUser(resolvedUserId as string, 10, "completed"),
    queryFn: () => GatewayAPI.routesForUser(resolvedUserId as string, 10, "completed"),
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

  const { data: userStats } = useQuery({
    queryKey: queryKeys.userStatistics(resolvedUserId as string),
    queryFn: () => GatewayAPI.userStatistics(resolvedUserId as string),
    enabled: !!resolvedUserId,
    select: (res: any) => {
      if (res && typeof res === 'object' && 'ok' in res) {
        return res.ok ? res.data : undefined;
      }
      return res;
    },
  });

  const { data: userAchievements } = useQuery({
    queryKey: queryKeys.userAchievements(resolvedUserId as string),
    queryFn: () => GatewayAPI.userAchievements(resolvedUserId as string),
    enabled: !!resolvedUserId,
    select: (res: any) => {
      if (res && typeof res === 'object' && 'ok' in res) {
        return res.ok && res.data ? res.data : [];
      }
      return Array.isArray(res) ? res : [];
    },
  });

  const profile = profileData;
  const statistics = userStats;
  const achievements = userAchievements;

  // Generate recent activity from routes and territories
  const recentActivity = useMemo(() => {
    const activities: Array<{ id: string; type: string; description: string; time: string; points: string }> = [];
    
    // Add recent routes
    if (Array.isArray(userRoutes)) {
      userRoutes.slice(0, 5).forEach((route: any) => {
        activities.push({
          id: route.id,
          type: route.status === 'completed' ? 'route' : 'route_active',
          description: route.status === 'completed' 
            ? `Completed route: ${route.name || `Route ${route.id.slice(0, 8)}`}`
            : `Started route: ${route.name || `Route ${route.id.slice(0, 8)}`}`,
          time: new Date(route.created_at).toLocaleDateString(),
          points: route.stats?.territory_area_km2 ? `+${Math.round(route.stats.territory_area_km2 * 10)} pts` : '+0 pts'
        });
      });
    }
    
    // Add recent territories
    if (Array.isArray(userTerritories)) {
      userTerritories.slice(0, 3).forEach((territory: any) => {
        activities.push({
          id: territory.id,
          type: 'territory',
          description: `Claimed territory: ${territory.name || `Territory ${territory.id.slice(0, 8)}`}`,
          time: new Date(territory.claimed_at).toLocaleDateString(),
          points: `+${Math.round(territory.area_km2 * 10)} pts`
        });
      });
    }
    
    // Sort by most recent and limit to 5
    return activities
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5);
  }, [userRoutes, userTerritories]);
  // State for editable profile fields
  const [isEditing, setIsEditing] = useState(false);
  const [editedUsername, setEditedUsername] = useState(profile?.username || '');
  const [editedEmail, setEditedEmail] = useState(profile?.email || '');

  const updateProfileMutation = useMutation({
    mutationFn: (updatedProfile: { username: string, email: string }) => GatewayAPI.updateUserProfile(resolvedUserId as string, updatedProfile),
    onSuccess: () => {
      toast.success("Profile updated successfully!");
      invalidateQueries.userProfile(queryClient, resolvedUserId as string);
      setIsEditing(false);
    },
    onError: () => {
      toast.error("Failed to update profile.");
    }
  });

  useEffect(() => {
    if (profile) {
      setEditedUsername(profile.username);
      setEditedEmail(profile.email);
    }
  }, [profile]);

  if (!resolvedUserId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-6"><CardContent><p className="text-center text-muted-foreground">Please log in to view your profile.</p></CardContent></Card>
      </div>
    );
  }

  if (profileIsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center text-muted-foreground">Loading profile...</div>
      </div>
    );
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

  const handleEditSubmit = () => {
    updateProfileMutation.mutate({ username: editedUsername, email: editedEmail });
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    if (profile) {
      setEditedUsername(profile.username);
      setEditedEmail(profile.email);
    }
  };

  

  // Calculate real statistics from API data
  const totalRoutes = Array.isArray(userRoutes) ? userRoutes.length : 0;
  const completedRoutes = Array.isArray(userRoutes) ? userRoutes.filter((r: any) => r.status === 'completed').length : 0;
  const totalTerritories = Array.isArray(userTerritories) ? userTerritories.length : 0;
  const totalTerritoryArea = Array.isArray(userTerritories) ? userTerritories.reduce((sum: number, t: any) => sum + (t.area_km2 || 0), 0) : 0;

  const stats: Array<{ label: string; value: string; icon: any; color: string }> = [
    {
      label: "Total Routes",
      value: totalRoutes.toString(),
      icon: Route,
      color: "blue-500"
    },
    {
      label: "Completed Routes",
      value: completedRoutes.toString(),
      icon: Target,
      color: "green-500"
    },
    {
      label: "Territories",
      value: totalTerritories.toString(),
      icon: MapPin,
      color: "purple-500"
    },
    {
      label: "Territory Area",
      value: UnitsFormatter.areaKm2(totalTerritoryArea),
      icon: Crown,
      color: "orange-500"
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "territory": return <MapPin className="w-4 h-4 text-territory-claimed" />;
      case "route": return <Route className="w-4 h-4 text-primary" />;
      case "route_active": return <Activity className="w-4 h-4 text-blue-500" />;
      case "defense": return <Shield className="w-4 h-4 text-territory-neutral" />;
      case "conquest": return <Crown className="w-4 h-4 text-territory-contested" />;
      default: return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (!currentUser) {
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

  // Show warning if there are API issues but still display the profile
  const hasApiIssues = !profileIsLoading && (!profile || !statistics || !achievements);

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* API Issues Warning */}
        {hasApiIssues && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>
              Some profile data may be incomplete due to backend connectivity issues.
            </AlertDescription>
          </Alert>
        )}

        {/* Profile Header */}
        <div className="mb-6 lg:mb-8">
          <Card className="bg-gradient-hero/10 border-primary/30">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              {isEditing ? (
                <form onSubmit={handleEditSubmit} className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
                    <Avatar className="w-16 h-16 sm:w-20 sm:h-20 mx-auto sm:mx-0">
                      <AvatarFallback className="bg-primary/20 text-primary text-xl sm:text-2xl font-bold">
                        {editedUsername ? editedUsername.substring(0, 2).toUpperCase() : "??"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="username">Username</Label>
                          <Input
                            id="username"
                            value={editedUsername}
                            onChange={(e) => setEditedUsername(e.target.value)}
                            placeholder="Enter username"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={editedEmail}
                            onChange={(e) => setEditedEmail(e.target.value)}
                            placeholder="Enter email"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          value={profile?.bio || ''} // Assuming bio is part of UserData
                          onChange={(e) => { /* No direct update for bio, as it's not in the UserData interface */ }}
                          placeholder="Tell us about yourself..."
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleEditCancel}
                      disabled={updateProfileMutation.isPending}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-gradient-hero hover:shadow-glow"
                      disabled={updateProfileMutation.isPending}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                  <Avatar className="w-16 h-16 sm:w-20 sm:h-20 mx-auto sm:mx-0">
                    <AvatarFallback className="bg-primary/20 text-primary text-xl sm:text-2xl font-bold">
                      {profile?.username ? profile.username.substring(0, 2).toUpperCase() : "??"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-center sm:text-left">
                    <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                      {profile?.username || "Loading..."}
                    </h1>
                    <p className="text-muted-foreground mb-4">{profile?.email}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-muted-foreground mb-4">
                      <span className="flex items-center justify-center sm:justify-start gap-1">
                        <Calendar className="w-4 h-4" />
                        Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "Unknown"}
                      </span>
                      <span className="flex items-center justify-center sm:justify-start gap-1">
                        <Activity className="w-4 h-4" />
                        Last login: {(profile as any)?.last_login ? new Date((profile as any).last_login).toLocaleDateString() : "Never"}
                      </span>
                    </div>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                      {(profile as any)?.is_verified && (
                        <Badge className="bg-green-500/20 text-green-600">
                          <Shield className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                      {(profile as any)?.is_active !== false && (
                        <Badge variant="outline" className="border-primary/30">
                          <Activity className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      )}
                      {statistics?.level && statistics.level > 1 && (
                        <Badge variant="outline" className="border-territory-neutral/30">
                          Level {statistics.level}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button 
                    className="bg-gradient-hero hover:shadow-glow w-full sm:w-auto"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs value={section} onValueChange={(v) => navigate(`/profile/${resolvedUserId}/${v}`)}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6 lg:space-y-8">
                {/* Stats Overview */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                  {stats.map((stat, index) => {
                    const IconComponent = stat.icon;
                    return (
                      <Card key={index} className="bg-card/80 border-border/50 hover:shadow-glow transition-all duration-300">
                        <CardContent className="p-4 text-center">
                          <div className={`flex items-center justify-center w-12 h-12 rounded-lg bg-${stat.color}/20 mx-auto mb-3`}>
                            <IconComponent className={`w-6 h-6 text-${stat.color}`} />
                          </div>
                          <p className="text-2xl font-bold mb-1">{stat.value}</p>
                          <p className="text-sm text-muted-foreground">{stat.label}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Recent Activity */}
                <Card className="bg-card/80 border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-primary" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.length > 0 ? (
                        recentActivity.map((activity) => (
                          <div key={activity.id} className="flex items-center gap-4 p-3 rounded-lg bg-background/50">
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-background/50">
                              {getActivityIcon(activity.type)}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{activity.description}</p>
                              <p className="text-sm text-muted-foreground">{activity.time}</p>
                            </div>
                            <Badge className="bg-primary/20 text-primary">
                              {activity.points}
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                          <h3 className="font-semibold mb-2">No Recent Activity</h3>
                          <p className="text-sm text-muted-foreground">
                            Start a route or claim territory to see your activity here!
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Statistics */}
                {statistics && (
                  <Card className="bg-card/80 border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-primary" />
                        Performance Statistics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <UserStats statistics={statistics} />
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card className="bg-card/80 border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full" variant="outline">
                      <Route className="w-4 h-4 mr-2" />
                      Start New Route
                    </Button>
                    <Button className="w-full" variant="outline">
                      <Shield className="w-4 h-4 mr-2" />
                      Defend Territory
                    </Button>
                    <Button className="w-full" variant="outline">
                      <Trophy className="w-4 h-4 mr-2" />
                      View Leaderboard
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="achievements">
            <Card className="bg-card/80 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-territory-contested" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AchievementGrid achievements={achievements || []} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="bg-card/80 border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Profile settings will be available here.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Profile;