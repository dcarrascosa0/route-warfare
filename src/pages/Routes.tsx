import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Route, 
  MapPin, 
  Play, 
  Clock, 
  TrendingUp, 
  Search,
  Filter,
  Star,
  Target,
  Navigation
} from "lucide-react";

const Routes = () => {
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    document.title = "Route Selection - Route Wars";
  }, []);

  const availableRoutes = [
    {
      id: "1",
      name: "Central Park Loop",
      distance: "3.2 km",
      difficulty: "Easy",
      estimatedTime: "18 min",
      territoryPotential: "2.1 km²",
      currentOwner: "None",
      status: "available",
      rating: 4.8,
      completions: 1247
    },
    {
      id: "2",
      name: "Downtown Circuit",
      distance: "5.7 km",
      difficulty: "Hard",
      estimatedTime: "32 min",
      territoryPotential: "4.3 km²",
      currentOwner: "Alex_Runner",
      status: "occupied",
      rating: 4.6,
      completions: 892
    },
    {
      id: "3",
      name: "Riverside Path",
      distance: "2.8 km",
      difficulty: "Medium",
      estimatedTime: "15 min",
      territoryPotential: "1.8 km²",
      currentOwner: "None",
      status: "available",
      rating: 4.9,
      completions: 2156
    },
    {
      id: "4",
      name: "University Campus",
      distance: "4.1 km",
      difficulty: "Medium",
      estimatedTime: "24 min",
      territoryPotential: "3.2 km²",
      currentOwner: "FastTracker",
      status: "contested",
      rating: 4.4,
      completions: 634
    },
    {
      id: "5",
      name: "Historic District",
      distance: "6.2 km",
      difficulty: "Hard",
      estimatedTime: "38 min",
      territoryPotential: "5.1 km²",
      currentOwner: "None",
      status: "available",
      rating: 4.7,
      completions: 445
    },
    {
      id: "6",
      name: "Industrial Zone",
      distance: "3.9 km",
      difficulty: "Easy",
      estimatedTime: "22 min",
      territoryPotential: "2.7 km²",
      currentOwner: "You",
      status: "owned",
      rating: 4.2,
      completions: 889
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "territory-neutral";
      case "occupied": return "destructive";
      case "contested": return "territory-contested";
      case "owned": return "territory-claimed";
      default: return "muted";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "territory-neutral";
      case "Medium": return "territory-contested";
      case "Hard": return "destructive";
      default: return "muted";
    }
  };

  const filteredRoutes = availableRoutes.filter(route =>
    route.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Route Selection</h1>
          <p className="text-xl text-muted-foreground">
            Choose your path to conquest. Each route offers unique territorial opportunities.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search routes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="border-primary/30">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Routes List */}
          <div className="lg:col-span-2 space-y-4">
            {filteredRoutes.map((route) => (
              <Card 
                key={route.id} 
                className={`cursor-pointer transition-all duration-300 hover:shadow-glow ${
                  selectedRoute === route.id ? 'ring-2 ring-primary shadow-glow' : 'bg-card/80 border-border/50'
                }`}
                onClick={() => setSelectedRoute(route.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-2">{route.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Route className="w-4 h-4" />
                          {route.distance}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {route.estimatedTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4" />
                          {route.rating}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge className={`bg-${getStatusColor(route.status)}/20 text-${getStatusColor(route.status)} border-${getStatusColor(route.status)}/30`}>
                        {route.status}
                      </Badge>
                      <Badge variant="outline" className={`border-${getDifficultyColor(route.difficulty)}/30`}>
                        {route.difficulty}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Territory Potential</p>
                      <p className="font-semibold text-primary">{route.territoryPotential}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Current Owner</p>
                      <p className="font-semibold">{route.currentOwner}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {route.completions} completions
                    </span>
                    <Button 
                      size="sm" 
                      className={
                        route.status === 'available' ? 'bg-gradient-hero hover:shadow-glow' :
                        route.status === 'owned' ? 'bg-territory-claimed/20 hover:bg-territory-claimed/30' :
                        'bg-destructive/20 hover:bg-destructive/30'
                      }
                      disabled={route.status === 'occupied'}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {route.status === 'available' ? 'Claim' :
                       route.status === 'owned' ? 'Defend' :
                       route.status === 'contested' ? 'Contest' : 'Occupied'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Route Details Sidebar */}
          <div className="space-y-6">
            {selectedRoute ? (
              <>
                <Card className="bg-card/80 border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Target className="w-5 h-5 text-primary" />
                      Route Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-square bg-background/20 rounded-lg mb-4 relative overflow-hidden">
                      {/* Mock route preview */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
                      <svg className="absolute inset-0 w-full h-full">
                        <path
                          d="M 40 40 Q 120 20 160 80 Q 180 140 120 180 Q 60 160 40 120 Z"
                          fill="hsl(var(--primary) / 0.1)"
                          stroke="hsl(var(--primary))"
                          strokeWidth="3"
                          strokeDasharray="5,3"
                          className="animate-pulse"
                        />
                      </svg>
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-primary/20 text-primary text-xs">
                          Preview
                        </Badge>
                      </div>
                    </div>
                    <Button className="w-full bg-gradient-hero hover:shadow-glow">
                      <Navigation className="w-4 h-4 mr-2" />
                      Start Route
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-card/80 border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <TrendingUp className="w-5 h-5 text-territory-contested" />
                      Strategic Value
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Territory Gain</span>
                      <span className="text-lg font-bold text-primary">+2.1 km²</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Strategic Score</span>
                      <span className="text-lg font-bold text-territory-contested">8.4/10</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Risk Level</span>
                      <Badge variant="outline" className="border-territory-neutral/30">
                        Low
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="bg-card/80 border-border/50">
                <CardContent className="p-6 text-center">
                  <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Select a Route</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose a route to see detailed information and strategic analysis.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card className="bg-card/80 border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Today's Opportunities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Available Routes</span>
                  <span className="font-bold text-territory-neutral">3</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Contested Zones</span>
                  <span className="font-bold text-territory-contested">1</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Max Potential</span>
                  <span className="font-bold text-primary">5.1 km²</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Routes;