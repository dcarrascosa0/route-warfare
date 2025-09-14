import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Target, Activity } from "lucide-react";
import { Link } from "react-router-dom";

const MapPreview = () => {
  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4 bg-territory-neutral/20 text-territory-neutral border-territory-neutral/30">
            Interactive Map
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Your <span className="bg-gradient-hero bg-clip-text text-transparent">Battle</span> Map
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Real-time territory visualization with GPS precision. See your conquests and plan your next strategic move.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map Interface */}
          <div className="lg:col-span-2">
            <Card className="bg-gradient-map border-border/50 shadow-glow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Territory Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="aspect-video bg-background/20 relative overflow-hidden rounded-b-lg">
                  {/* Mock map interface */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,hsl(var(--territory-claimed)/0.4)_20%,transparent_50%)]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,hsl(var(--territory-neutral)/0.3)_15%,transparent_40%)]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_80%,hsl(var(--territory-contested)/0.3)_10%,transparent_30%)]" />
                  
                  {/* Mock GPS route */}
                  <svg className="absolute inset-0 w-full h-full">
                    <path
                      d="M 100 150 Q 200 100 300 150 T 500 200 Q 400 250 300 200 Z"
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="3"
                      strokeDasharray="10,5"
                      className="animate-pulse"
                    />
                  </svg>
                  
                  {/* Territory markers */}
                  <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-territory-claimed rounded-full shadow-territory animate-pulse" />
                  <div className="absolute top-1/2 right-1/3 w-3 h-3 bg-territory-neutral rounded-full shadow-territory animate-pulse" style={{ animationDelay: '0.5s' }} />
                  <div className="absolute bottom-1/3 left-1/2 w-3 h-3 bg-territory-contested rounded-full shadow-territory animate-pulse" style={{ animationDelay: '1s' }} />
                  
                  {/* Overlay UI */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <Badge className="bg-territory-claimed/20 text-territory-claimed border-territory-claimed/30">
                      Your Territory
                    </Badge>
                    <Badge variant="outline" className="border-muted/30">
                      Live GPS
                    </Badge>
                  </div>
                  
                  <div className="absolute bottom-4 right-4">
                    <Button size="sm" className="bg-primary/20 hover:bg-primary/30" asChild>
                      <Link to="/routes">
                        <Navigation className="w-4 h-4 mr-2" />
                        Start Route
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Stats Panel */}
          <div className="space-y-6">
            <Card className="bg-card/80 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="w-5 h-5 text-territory-claimed" />
                  Territory Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Claimed Zones</span>
                  <span className="text-2xl font-bold text-territory-claimed">47</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Area</span>
                  <span className="text-2xl font-bold text-primary">12.3 km²</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Rank</span>
                  <span className="text-2xl font-bold text-territory-neutral">#87</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/80 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="w-5 h-5 text-territory-contested" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-territory-claimed rounded-full" />
                  <span>Zone captured in Central Park</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-territory-contested rounded-full" />
                  <span>Territory under attack!</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-territory-neutral rounded-full" />
                  <span>New route discovered</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MapPreview;