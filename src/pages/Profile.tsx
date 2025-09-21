import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GatewayAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { UserStats, AchievementGrid } from "@/components/features/user-profile";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

interface UserProfile {
  user: UserData;
  statistics: {
    total_territory_area: number;
    total_zones: number;
    routes_completed: number;
    win_rate: number;
    current_rank: number;
    level: number;
    experience: number;
  };
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    unlocked_at?: string;
    earned?: boolean;
  }>;
}

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    bio: '',
  });

  const { user: authUser, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    document.title = "Profile - Route Wars";
  }, []);

  // Disable profile API calls entirely and use fallback data
  const userProfile: UserProfile = {
    user: authUser || {
      id: '',
      email: '',
      username: 'User',
      created_at: new Date().toISOString(),
    },
    statistics: {
      total_territory_area: 0,
      total_zones: 0,
      routes_completed: 0,
      win_rate: 0,
      current_rank: 0,
      level: 1,
      experience: 0,
    },
    achievements: [],
  };

  const profileLoading = false;
  const profileError = null;

  // Get user routes for accurate statistics (with graceful fallback)
  const { data: userRoutes } = useQuery({
    queryKey: ["routes", authUser?.id],
    queryFn: async () => {
      if (!authUser?.id) return [];
      
      try {
        const response = await GatewayAPI.routesForUser(authUser.id, 100);
        if (!response.ok) return []; // Return empty array on failure
        return response.data || [];
      } catch (error) {
        // Silently handle errors
        console.warn('Routes API unavailable, using empty data');
        return [];
      }
    },
    enabled: !!authUser?.id,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Get user territories for accurate statistics (with graceful fallback)
  const { data: userTerritories } = useQuery({
    queryKey: ["userTerritories", authUser?.id],
    queryFn: async () => {
      if (!authUser?.id) return { territories: [] };
      
      try {
        const response = await GatewayAPI.getUserTerritories(authUser.id);
        if (!response.ok) return { territories: [] }; // Return empty array on failure
        return response.data || { territories: [] };
      } catch (error) {
        // Silently handle errors
        console.warn('Territories API unavailable, using empty data');
        return { territories: [] };
      }
    },
    enabled: !!authUser?.id,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const user = userProfile?.user || authUser;
  const profile = userProfile;
  const routes = userRoutes || [];
  const territories = (userTerritories as any)?.territories || [];

  // Get user achievements (if available from API) - add missing properties for compatibility
  const achievements = (profile?.achievements || []).map(achievement => ({
    ...achievement,
    category: 'general', // Default category for existing achievements
    points: 10, // Default points for existing achievements
  }));

  // Profile editing mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { username: string; email: string; bio?: string }) => {
      // This would be implemented when the backend supports profile updates
      // For now, just simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      return data;
    },
    onSuccess: () => {
      toast.success('Profile updated successfully!');
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
    onError: () => {
      toast.error('Failed to update profile. Please try again.');
    },
  });

  // Initialize edit form when user data is available
  useEffect(() => {
    if (user && !isEditing) {
      setEditForm({
        username: user.username || '',
        email: user.email || '',
        bio: '', // Would come from profile data
      });
    }
  }, [user, isEditing]);

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(editForm);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    if (user) {
      setEditForm({
        username: user.username || '',
        email: user.email || '',
        bio: '',
      });
    }
  };

  // Generate recent activity from routes and territories
  const recentActivity = useMemo(() => {
    const activities: Array<{ id: string; type: string; description: string; time: string; points: string }> = [];
    
    // Add recent routes
    if (Array.isArray(routes)) {
      routes.slice(0, 5).forEach((route: any) => {
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
    if (Array.isArray(territories)) {
      territories.slice(0, 3).forEach((territory: any) => {
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
  }, [routes, territories, profile]);

  // Calculate real statistics from API data
  const totalRoutes = Array.isArray(routes) ? routes.length : 0;
  const completedRoutes = Array.isArray(routes) ? routes.filter((r: any) => r.status === 'completed').length : 0;
  const totalTerritories = Array.isArray(territories) ? territories.length : 0;
  const totalTerritoryArea = Array.isArray(territories) ? territories.reduce((sum: number, t: any) => sum + (t.area_km2 || 0), 0) : 0;

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
      value: `${totalTerritoryArea.toFixed(1)} km²`,
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

  if (!isAuthenticated) {
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
  const hasApiIssues = profileError;

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
                        {editForm.username ? editForm.username.substring(0, 2).toUpperCase() : "??"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="username">Username</Label>
                          <Input
                            id="username"
                            value={editForm.username}
                            onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                            placeholder="Enter username"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="Enter email"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          value={editForm.bio}
                          onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
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
                      {user?.username ? user.username.substring(0, 2).toUpperCase() : "??"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-center sm:text-left">
                    <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                      {user?.username || "Loading..."}
                    </h1>
                    <p className="text-muted-foreground mb-4">{user?.email}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-muted-foreground mb-4">
                      <span className="flex items-center justify-center sm:justify-start gap-1">
                        <Calendar className="w-4 h-4" />
                        Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "Unknown"}
                      </span>
                      <span className="flex items-center justify-center sm:justify-start gap-1">
                        <Activity className="w-4 h-4" />
                        Last login: {(user as any)?.last_login ? new Date((user as any).last_login).toLocaleDateString() : "Never"}
                      </span>
                    </div>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                      {(user as any)?.is_verified && (
                        <Badge className="bg-green-500/20 text-green-600">
                          <Shield className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                      {(user as any)?.is_active !== false && (
                        <Badge variant="outline" className="border-primary/30">
                          <Activity className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      )}
                      {profile?.statistics?.level && profile.statistics.level > 1 && (
                        <Badge variant="outline" className="border-territory-neutral/30">
                          Level {profile.statistics.level}
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
            {profile?.statistics && (
              <Card className="bg-card/80 border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Performance Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <UserStats statistics={profile.statistics} />
                </CardContent>
              </Card>
            )}

            {/* Achievements */}
            <Card className="bg-card/80 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-territory-contested" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AchievementGrid achievements={achievements} />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress - removed placeholder progress; can be derived from real stats later */}

            {/* Territory Summary - removed mock stats */}

            {/* Quick Actions */}
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
      </main>
    </div>
  );
};

export default Profile;