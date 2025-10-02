import { Link, useLocation } from "react-router-dom";
import { Home, Route, MapPin, Trophy, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function BottomNavigation() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // Don't show bottom nav if not authenticated
  if (!isAuthenticated) return null;

  const navItems = [
    { 
      name: "Dashboard", 
      href: "/dashboard", 
      icon: Home,
      isActive: location.pathname === "/dashboard"
    },
    { 
      name: "Routes", 
      href: "/routes/active", 
      icon: Route,
      isActive: location.pathname.startsWith("/routes")
    },
    { 
      name: "Territory", 
      href: "/territory/map", 
      icon: MapPin,
      isActive: location.pathname.startsWith("/territory")
    },
    { 
      name: "Leaderboard", 
      href: "/leaderboard", 
      icon: Trophy,
      isActive: location.pathname === "/leaderboard"
    },
    { 
      name: "Profile", 
      href: user ? `/profile/${user.id}/overview` : "/profile", 
      icon: User,
      isActive: location.pathname.startsWith("/profile")
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t border-border/50 bottom-nav-mobile">
      <div className="pb-safe">
        <div className="flex items-center justify-around py-3 min-h-[72px]">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-colors min-w-[64px] min-h-[56px] ${
                item.isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              aria-label={`Navigate to ${item.name}`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          );
        })}
        </div>
      </div>
    </nav>
  );
}