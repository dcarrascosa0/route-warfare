import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TerritoryDetailsModal from "@/components/territory-details-modal";
import { toast } from "sonner";
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
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    document.title = "Territory Map - Route Wars";
  }, []);

  const handleTerritoryClick = (territoryId: string) => {
    setSelectedTerritory(territoryId);
    setIsModalOpen(true);
    toast("Territory selected", { description: "View details and plan your strategy" });
  };

  const handlePlanRoute = () => {
    toast("Route planner opened", { description: "Select your starting point and destination" });
  };

  const handleLiveView = () => {
    toast("Live GPS activated", { description: "Real-time territory updates enabled" });
  };

  const territories = [
    { 
      id: "1", 
      owner: "You", 
      area: "2.4 km²", 
      status: "claimed", 
      color: "territory-claimed", 
      path: "M 120 80 L 180 95 L 200 140 L 170 180 L 130 185 L 100 150 L 105 110 Z",
      center: { x: 150, y: 135 }
    },
    { 
      id: "2", 
      owner: "Alex_Runner", 
      area: "1.8 km²", 
      status: "enemy", 
      color: "destructive", 
      path: "M 320 160 L 380 170 L 400 220 L 360 250 L 310 240 L 300 190 Z",
      center: { x: 350, y: 205 }
    },
    { 
      id: "3", 
      owner: "FastTracker", 
      area: "3.1 km²", 
      status: "enemy", 
      color: "destructive", 
      path: "M 80 280 L 160 270 L 180 320 L 140 380 L 90 390 L 60 350 L 70 310 Z",
      center: { x: 120, y: 330 }
    },
    { 
      id: "4", 
      owner: "Unknown", 
      area: "0.9 km²", 
      status: "neutral", 
      color: "territory-neutral", 
      path: "M 420 120 L 460 130 L 470 160 L 450 180 L 410 175 L 405 145 Z",
      center: { x: 440, y: 150 }
    },
    { 
      id: "5", 
      owner: "You", 
      area: "1.2 km²", 
      status: "claimed", 
      color: "territory-claimed", 
      path: "M 220 340 L 280 330 L 300 370 L 270 400 L 230 395 L 210 365 Z",
      center: { x: 255, y: 365 }
    },
    { 
      id: "6", 
      owner: "SpeedDemon", 
      area: "2.7 km²", 
      status: "contested", 
      color: "territory-contested", 
      path: "M 380 60 L 450 70 L 480 110 L 460 150 L 400 160 L 370 120 L 375 90 Z",
      center: { x: 425, y: 110 }
    },
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
                  {/* Territory zones as irregular polygons */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 500 400">
                    {/* Territory polygons */}
                    {territories.map((territory) => (
                      <g key={territory.id}>
                        <path
                          d={territory.path}
                          fill={`hsl(var(--${territory.color}) / 0.3)`}
                          stroke={`hsl(var(--${territory.color}))`}
                          strokeWidth="2"
                          className={`cursor-pointer transition-all duration-300 ${
                            selectedTerritory === territory.id ? 'drop-shadow-territory' : 'hover:brightness-110'
                          }`}
                          onClick={() => handleTerritoryClick(territory.id)}
                        />
                        <circle
                          cx={territory.center.x}
                          cy={territory.center.y}
                          r="8"
                          fill={`hsl(var(--${territory.color}))`}
                          className="cursor-pointer"
                          onClick={() => handleTerritoryClick(territory.id)}
                        >
                          <animate
                            attributeName="r"
                            values="8;12;8"
                            dur="2s"
                            repeatCount="indefinite"
                          />
                        </circle>
                        {/* Territory icon */}
                        <g transform={`translate(${territory.center.x - 6}, ${territory.center.y - 6})`}>
                          {territory.status === 'claimed' && (
                            <path d="M2 8l4-4 4 4v6H2V8z" fill="white" stroke="none" />
                          )}
                          {territory.status === 'enemy' && (
                            <circle cx="6" cy="6" r="4" fill="white" stroke="none" />
                          )}
                          {territory.status === 'neutral' && (
                            <rect x="3" y="3" width="6" height="6" fill="white" stroke="none" />
                          )}
                          {territory.status === 'contested' && (
                            <path d="M6 2 L10 6 L6 10 L2 6 Z" fill="white" stroke="none" />
                          )}
                        </g>
                      </g>
                    ))}

                    {/* Active routes - showing conquest paths */}
                    <path
                      d="M 150 135 Q 250 180 350 205"
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="3"
                      strokeDasharray="8,4"
                      className="animate-pulse"
                    />
                    <path
                      d="M 255 365 Q 300 280 440 150"
                      fill="none"
                      stroke="hsl(var(--destructive))"
                      strokeWidth="3"
                      strokeDasharray="12,6"
                      className="animate-pulse"
                      style={{ animationDelay: '0.8s' }}
                    />
                    
                    {/* Overlapping territory indicator */}
                    <path
                      d="M 160 270 L 200 260 L 220 290 L 190 310 L 150 305 Z"
                      fill="hsl(var(--territory-contested) / 0.6)"
                      stroke="hsl(var(--territory-contested))"
                      strokeWidth="2"
                      strokeDasharray="4,4"
                      className="animate-pulse"
                    />
                  </svg>

                  {/* Control buttons */}
                  <div className="absolute bottom-4 left-4 flex gap-2">
                    <Button size="sm" className="bg-primary/20 hover:bg-primary/30" onClick={handlePlanRoute}>
                      <Navigation className="w-4 h-4 mr-2" />
                      Plan Route
                    </Button>
                    <Button size="sm" variant="outline" className="border-muted/30" onClick={handleLiveView}>
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
      
      <TerritoryDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        territory={territories.find(t => t.id === selectedTerritory) || null}
      />
    </div>
  );
};

export default Territory;