import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Crown, Medal, TrendingUp, MapPin, Route, Target } from "lucide-react";

const Leaderboard = () => {
  useEffect(() => {
    document.title = "Leaderboard - Route Wars";
  }, []);

  const topPlayers = [
    {
      rank: 1,
      name: "TerritoryKing",
      totalArea: "127.3 km²",
      zones: 89,
      routes: 342,
      winRate: "94%",
      trend: "up",
      badge: "Crown"
    },
    {
      rank: 2,
      name: "MapDominator",
      totalArea: "98.7 km²",
      zones: 67,
      routes: 289,
      winRate: "87%",
      trend: "up",
      badge: "Trophy"
    },
    {
      rank: 3,
      name: "RouteConqueror",
      totalArea: "82.1 km²",
      zones: 54,
      routes: 267,
      winRate: "91%",
      trend: "down",
      badge: "Medal"
    },
    {
      rank: 4,
      name: "GPSWarrior",
      totalArea: "76.4 km²",
      zones: 51,
      routes: 234,
      winRate: "83%",
      trend: "up",
      badge: null
    },
    {
      rank: 5,
      name: "ZoneHunter",
      totalArea: "69.8 km²",
      zones: 47,
      routes: 198,
      winRate: "89%",
      trend: "stable",
      badge: null
    },
    {
      rank: 12,
      name: "You",
      totalArea: "31.2 km²",
      zones: 23,
      routes: 87,
      winRate: "76%",
      trend: "up",
      badge: null
    }
  ];

  const getRankIcon = (rank: number, badge: string | null) => {
    if (badge === "Crown") return <Crown className="w-6 h-6 text-territory-contested" />;
    if (badge === "Trophy") return <Trophy className="w-6 h-6 text-primary" />;
    if (badge === "Medal") return <Medal className="w-6 h-6 text-territory-neutral" />;
    return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "up": return "territory-claimed";
      case "down": return "destructive";
      case "stable": return "territory-neutral";
      default: return "muted";
    }
  };

  const getTrendIcon = (trend: string) => {
    const className = `w-4 h-4 text-${getTrendColor(trend)}`;
    return <TrendingUp className={className} style={{ 
      transform: trend === "down" ? "rotate(180deg)" : trend === "stable" ? "rotate(90deg)" : "none" 
    }} />;
  };

  const categories = [
    {
      title: "Most Territory",
      icon: MapPin,
      description: "Total area controlled",
      color: "territory-claimed"
    },
    {
      title: "Most Routes",
      icon: Route,
      description: "Routes completed",
      color: "primary"
    },
    {
      title: "Best Strategist",
      icon: Target,
      description: "Highest win rate",
      color: "territory-contested"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Global Leaderboard</h1>
          <p className="text-xl text-muted-foreground">
            The greatest territory conquerors and strategic masterminds.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Leaderboard */}
          <div className="lg:col-span-3">
            <Card className="bg-card/80 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-primary" />
                  Territory Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-2">
                  {topPlayers.map((player, index) => (
                    <div
                      key={player.rank}
                      className={`flex items-center gap-4 p-4 transition-all duration-300 hover:bg-primary/5 ${
                        player.name === "You" ? "bg-gradient-hero/10 border-l-4 border-primary" : ""
                      } ${index < 3 ? "bg-background/50" : ""}`}
                    >
                      {/* Rank */}
                      <div className="flex items-center justify-center w-12 h-12">
                        {getRankIcon(player.rank, player.badge)}
                      </div>

                      {/* Avatar */}
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-primary/20 text-primary font-bold">
                          {player.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      {/* Player Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-bold ${player.name === "You" ? "text-primary" : ""}`}>
                            {player.name}
                          </h3>
                          {player.name === "You" && (
                            <Badge className="bg-primary/20 text-primary text-xs">You</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{player.zones} zones</span>
                          <span>{player.routes} routes</span>
                          <span>{player.winRate} win rate</span>
                        </div>
                      </div>

                      {/* Territory */}
                      <div className="text-right">
                        <p className="text-2xl font-bold text-territory-claimed">{player.totalArea}</p>
                        <div className="flex items-center gap-1 justify-end">
                          {getTrendIcon(player.trend)}
                          <span className={`text-xs text-${getTrendColor(player.trend)}`}>
                            {player.trend}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Categories */}
            <Card className="bg-card/80 border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {categories.map((category, index) => {
                  const IconComponent = category.icon;
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg bg-background/50 hover:bg-primary/5 transition-colors cursor-pointer"
                    >
                      <div className={`flex items-center justify-center w-10 h-10 rounded-lg bg-${category.color}/20`}>
                        <IconComponent className={`w-5 h-5 text-${category.color}`} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{category.title}</h4>
                        <p className="text-xs text-muted-foreground">{category.description}</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Your Stats */}
            <Card className="bg-gradient-hero/10 border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="w-5 h-5 text-primary" />
                  Your Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Current Rank</span>
                  <span className="text-2xl font-bold text-primary">#12</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Territory</span>
                  <span className="text-lg font-bold text-territory-claimed">31.2 km²</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">This Week</span>
                  <Badge className="bg-territory-claimed/20 text-territory-claimed">
                    +3 zones
                  </Badge>
                </div>
                <div className="pt-2 text-center">
                  <p className="text-xs text-muted-foreground mb-2">
                    Next rank requires 45.8 km²
                  </p>
                  <div className="w-full bg-background/50 rounded-full h-2">
                    <div 
                      className="bg-gradient-hero h-2 rounded-full transition-all duration-500"
                      style={{ width: "68%" }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Challenge */}
            <Card className="bg-card/80 border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Weekly Challenge</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <Trophy className="w-8 h-8 text-territory-contested mx-auto mb-2" />
                  <h4 className="font-semibold mb-1">Territory Expansion</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Gain 10+ km² of new territory
                  </p>
                  <Badge variant="outline" className="border-territory-contested/30">
                    3.2/10 km² completed
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Leaderboard;