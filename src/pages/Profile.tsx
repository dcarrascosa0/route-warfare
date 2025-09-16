import { useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  User, 
  MapPin, 
  Route, 
  Trophy, 
  Target, 
  Calendar,
  Activity,
  Crown,
  Shield,
  Zap,
  TrendingUp
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { GatewayAPI } from "@/lib/api";

const Profile = () => {
  useEffect(() => {
    document.title = "Profile - Route Wars";
  }, []);

  const userId = useMemo(() => localStorage.getItem("user_id"), []);
  const { data: me } = useQuery({
    queryKey: ["me", userId],
    queryFn: () => (userId ? GatewayAPI.me(userId) : Promise.resolve({ ok: false } as any)),
    enabled: !!userId,
  });

  const achievements = [
    { id: 1, name: "First Blood", description: "Claim your first territory", icon: Target, earned: true },
    { id: 2, name: "Zone Master", description: "Control 25+ territories", icon: Crown, earned: true },
    { id: 3, name: "Route Runner", description: "Complete 100 routes", icon: Route, earned: true },
    { id: 4, name: "Conqueror", description: "Take over enemy territory", icon: Shield, earned: true },
    { id: 5, name: "Speed Demon", description: "Complete route in under 10 min", icon: Zap, earned: false },
    { id: 6, name: "Empire Builder", description: "Control 100+ km² of territory", icon: MapPin, earned: false },
  ];

  const recentActivity = [
    { id: 1, type: "territory", description: "Claimed Riverside Park Zone", time: "2 hours ago", points: "+45" },
    { id: 2, type: "route", description: "Completed Downtown Circuit", time: "5 hours ago", points: "+32" },
    { id: 3, type: "defense", description: "Successfully defended Central Zone", time: "1 day ago", points: "+28" },
    { id: 4, type: "conquest", description: "Conquered Alex_Runner's territory", time: "2 days ago", points: "+67" },
    { id: 5, type: "route", description: "Completed University Loop", time: "3 days ago", points: "+41" },
  ];

  const stats = [
    { label: "Total Territory", value: "31.2 km²", icon: MapPin, color: "territory-claimed" },
    { label: "Routes Completed", value: "87", icon: Route, color: "primary" },
    { label: "Global Rank", value: "#12", icon: Trophy, color: "territory-contested" },
    { label: "Win Rate", value: "76%", icon: Target, color: "territory-neutral" },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "territory": return <MapPin className="w-4 h-4 text-territory-claimed" />;
      case "route": return <Route className="w-4 h-4 text-primary" />;
      case "defense": return <Shield className="w-4 h-4 text-territory-neutral" />;
      case "conquest": return <Crown className="w-4 h-4 text-territory-contested" />;
      default: return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Profile Header */}
        <div className="mb-8">
          <Card className="bg-gradient-hero/10 border-primary/30">
            <CardContent className="p-8">
              <div className="flex items-center gap-6">
                <Avatar className="w-20 h-20">
                  <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                    YU
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-2">Your Profile</h1>
                  <div className="flex items-center gap-4 text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Member since March 2024
                    </span>
                    <span className="flex items-center gap-1">
                      <Activity className="w-4 h-4" />
                      Last active: Today
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Badge className="bg-territory-claimed/20 text-territory-claimed">
                      Territory Expert
                    </Badge>
                    <Badge variant="outline" className="border-primary/30">
                      Level 23
                    </Badge>
                    <Badge variant="outline" className="border-territory-neutral/30">
                      Rising Star
                    </Badge>
                  </div>
                </div>
                <Button className="bg-gradient-hero hover:shadow-glow">
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  {recentActivity.map((activity) => (
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
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card className="bg-card/80 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-territory-contested" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {achievements.map((achievement) => {
                    const IconComponent = achievement.icon;
                    return (
                      <div
                        key={achievement.id}
                        className={`flex items-center gap-3 p-4 rounded-lg transition-all duration-300 ${
                          achievement.earned 
                            ? 'bg-gradient-hero/10 border border-primary/30' 
                            : 'bg-background/50 opacity-60'
                        }`}
                      >
                        <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                          achievement.earned ? 'bg-primary/20' : 'bg-muted/20'
                        }`}>
                          <IconComponent className={`w-5 h-5 ${
                            achievement.earned ? 'text-primary' : 'text-muted-foreground'
                          }`} />
                        </div>
                        <div>
                          <h4 className="font-semibold">{achievement.name}</h4>
                          <p className="text-sm text-muted-foreground">{achievement.description}</p>
                        </div>
                        {achievement.earned && (
                          <Badge className="ml-auto bg-territory-claimed/20 text-territory-claimed text-xs">
                            Earned
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress */}
            <Card className="bg-card/80 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="w-5 h-5 text-territory-contested" />
                  Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Level Progress</span>
                    <span className="text-sm text-muted-foreground">Level 23</span>
                  </div>
                  <Progress value={74} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">2,340 / 3,000 XP</p>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Weekly Goal</span>
                    <span className="text-sm text-muted-foreground">5/7 routes</span>
                  </div>
                  <Progress value={71} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">Complete 2 more routes</p>
                </div>
              </CardContent>
            </Card>

            {/* Territory Summary */}
            <Card className="bg-card/80 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="w-5 h-5 text-territory-claimed" />
                  Territory Empire
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Active Zones</span>
                  <span className="text-lg font-bold text-territory-claimed">23</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Under Attack</span>
                  <span className="text-lg font-bold text-destructive">2</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Largest Zone</span>
                  <span className="text-lg font-bold text-primary">4.7 km²</span>
                </div>
                <div className="pt-2">
                  <Button className="w-full bg-gradient-hero hover:shadow-glow" size="sm">
                    View Territory Map
                  </Button>
                </div>
              </CardContent>
            </Card>

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