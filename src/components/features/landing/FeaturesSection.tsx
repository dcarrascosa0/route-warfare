import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Map, Route, Shield, Crown, Users, Smartphone } from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: Route,
      title: "GPS Route Tracking",
      description: "Complete closed GPS routes to claim the enclosed territory as your zone",
      badge: "Core Mechanic",
      color: "primary"
    },
    {
      icon: Map,
      title: "Territory Control",
      description: "Visualize your conquered zones on the map. Overlapping routes transfer ownership to the latest finisher",
      badge: "Strategic",
      color: "territory-claimed"
    },
    {
      icon: Shield,
      title: "Zone Defense",
      description: "Defend your territory by completing routes that reinforce your boundaries",
      badge: "Tactical",
      color: "territory-contested"
    },
    {
      icon: Crown,
      title: "Leaderboards",
      description: "Compete for the largest territory, most routes completed, and strategic dominance",
      badge: "Competitive",
      color: "territory-neutral"
    },
    {
      icon: Users,
      title: "Social Warfare",
      description: "Join alliances, coordinate attacks, and build territorial empires with friends",
      badge: "Multiplayer",
      color: "primary"
    },
    {
      icon: Smartphone,
      title: "Real-time Updates",
      description: "Get instant notifications when your territory is under attack or when new zones become available",
      badge: "Live",
      color: "territory-contested"
    }
  ];

  return (
    <section className="py-20 px-6 bg-card/50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4 bg-primary/20 text-primary border-primary/30">
            Game Features
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Conquer Through <span className="bg-gradient-hero bg-clip-text text-transparent">Movement</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Every step you take is a strategic move. Build your empire one route at a time.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card key={index} className="bg-card/80 border-border/50 hover:shadow-glow transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-lg bg-${feature.color}/20 group-hover:shadow-territory transition-all duration-300`}>
                      <IconComponent className={`w-6 h-6 text-${feature.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{feature.title}</h3>
                        <Badge variant="outline" className="text-xs border-primary/30">
                          {feature.badge}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;