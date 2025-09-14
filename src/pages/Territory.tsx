import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Navigation, 
  Target, 
  Shield, 
  Crown, 
  Activity,
  Users,
  AlertTriangle
} from "lucide-react";

const Territory = () => {
  const [selectedTerritory, setSelectedTerritory] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Territory Map - Route Wars";
  }, []);

  const territories = [
    { id: "1", owner: "You", area: "2.4 km²", status: "claimed", color: "territory-claimed", position: { top: "20%", left: "30%" } },
    { id: "2", owner: "Alex_Runner", area: "1.8 km²", status: "enemy", color: "destructive", position: { top: "40%", left: "60%" } },
    { id: "3", owner: "FastTracker", area: "3.1 km²", status: "enemy", color: "destructive", position: { top: "60%", left: "20%" } },
    { id: "4", owner: "Unknown", area: "0.9 km²", status: "neutral", color: "territory-neutral", position: { top: "30%", left: "70%" } },
    { id: "5", owner: "You", area: "1.2 km²", status: "claimed", color: "territory-claimed", position: { top: "70%", left: "45%" } },
    { id: "6", owner: "SpeedDemon", area: "2.7 km²", status: "contested", color: "territory-contested", position: { top: "15%", left: "80%" } },
  ];

  const activeRoutes = [
    { id: "1", user: "MikeRuns", target: "Your Central Park Zone", eta: "12 min", threat: "high" },
    { id: "2", user: "You", target: "Alex_Runner's Downtown", eta: "8 min", threat: "none" },
    { id: "3", user: "RouteKing", target: "Neutral Riverside", eta: "15 min", threat: "medium" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Territory Control</h1>
          <p className="text-xl text-muted-foreground">
            Monitor your zones, track enemy movements, and plan your next conquest.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Map */}
          <div className="lg:col-span-3">
            <Card className="bg-gradient-map border-border/50 shadow-glow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Live Territory Map
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge className="bg-territory-claimed/20 text-territory-claimed border-territory-claimed/30">
                      Your Zones: 3
                    </Badge>
                    <Badge variant="outline" className="border-muted/30">
                      Live GPS
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="aspect-[4/3] bg-background/20 relative overflow-hidden rounded-b-lg">
                  {/* Territory zones */}
                  {territories.map((territory) => (
                    <div
                      key={territory.id}
                      className={`absolute w-16 h-16 rounded-full cursor-pointer transition-all duration-300 ${
                        selectedTerritory === territory.id ? 'scale-110 shadow-territory' : 'hover:scale-105'
                      }`}
                      style={{ 
                        top: territory.position.top, 
                        left: territory.position.left,
                        backgroundColor: `hsl(var(--${territory.color}) / 0.3)`,
                        border: `2px solid hsl(var(--${territory.color}))`
                      }}
                      onClick={() => setSelectedTerritory(territory.id)}
                    >
                      <div className="absolute inset-0 rounded-full animate-pulse"
                           style={{ backgroundColor: `hsl(var(--${territory.color}) / 0.2)` }} />
                      <div className="absolute inset-2 rounded-full flex items-center justify-center">
                        {territory.status === 'claimed' && <Shield className="w-4 h-4 text-territory-claimed" />}
                        {territory.status === 'enemy' && <Target className="w-4 h-4 text-destructive" />}
                        {territory.status === 'neutral' && <MapPin className="w-4 h-4 text-territory-neutral" />}
                        {territory.status === 'contested' && <AlertTriangle className="w-4 h-4 text-territory-contested" />}
                      </div>
                    </div>
                  ))}

                  {/* Active routes visualization */}
                  <svg className="absolute inset-0 w-full h-full">
                    <path
                      d="M 150 100 Q 300 150 450 200"
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                      className="animate-pulse"
                    />
                    <path
                      d="M 200 300 Q 350 200 500 250"
                      fill="none"
                      stroke="hsl(var(--destructive))"
                      strokeWidth="2"
                      strokeDasharray="8,4"
                      className="animate-pulse"
                      style={{ animationDelay: '0.5s' }}
                    />
                  </svg>

                  {/* Control buttons */}
                  <div className="absolute bottom-4 left-4 flex gap-2">
                    <Button size="sm" className="bg-primary/20 hover:bg-primary/30">
                      <Navigation className="w-4 h-4 mr-2" />
                      Plan Route
                    </Button>
                    <Button size="sm" variant="outline" className="border-muted/30">
                      <Activity className="w-4 h-4 mr-2" />
                      Live View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Territory Details */}
            <Card className="bg-card/80 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Crown className="w-5 h-5 text-territory-claimed" />
                  Your Empire
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Zones</span>
                  <span className="text-2xl font-bold text-territory-claimed">3</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Area</span>
                  <span className="text-2xl font-bold text-primary">4.7 km²</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Empire Rank</span>
                  <span className="text-2xl font-bold text-territory-neutral">#12</span>
                </div>
                <div className="pt-2">
                  <Button className="w-full bg-gradient-hero hover:shadow-glow">
                    Expand Territory
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Active Routes */}
            <Card className="bg-card/80 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="w-5 h-5 text-territory-contested" />
                  Active Routes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeRoutes.map((route) => (
                  <div key={route.id} className="flex items-center justify-between p-2 rounded-lg bg-background/50">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        route.threat === 'high' ? 'bg-destructive' :
                        route.threat === 'medium' ? 'bg-territory-contested' :
                        'bg-territory-neutral'
                      }`} />
                      <div>
                        <p className="text-xs font-medium">{route.user}</p>
                        <p className="text-xs text-muted-foreground">{route.target}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {route.eta}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Enemy Territories */}
            <Card className="bg-card/80 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="w-5 h-5 text-destructive" />
                  Nearby Enemies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">FastTracker</span>
                  <Badge variant="destructive" className="text-xs">3.1 km²</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Alex_Runner</span>
                  <Badge variant="destructive" className="text-xs">1.8 km²</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">SpeedDemon</span>
                  <Badge className="bg-territory-contested/20 text-territory-contested text-xs">Contested</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Territory;