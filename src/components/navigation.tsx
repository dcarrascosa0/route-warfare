import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Map, Route, Trophy, User, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const Navigation = () => {
  const location = useLocation();
  
  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/territory", icon: Map, label: "Territory", badge: "47" },
    { path: "/routes", icon: Route, label: "Routes" },
    { path: "/leaderboard", icon: Trophy, label: "Leaderboard" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/50">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center">
              <Map className="w-5 h-5 text-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              Route Wars
            </span>
          </Link>
          
          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={`flex items-center gap-2 ${
                      isActive ? "bg-gradient-hero shadow-glow" : "hover:bg-primary/10"
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-1 bg-primary/20 text-primary text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;