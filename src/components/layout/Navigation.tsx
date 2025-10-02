
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, Route, Trophy, User, LogOut, Home, UserPlus, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { GamificationNavStatus } from "@/components/features/gamification/GamificationNavStatus";



export default function Navigation() {
  const { isAuthenticated, logout, user } = useAuth();
  const location = useLocation();




  // Essential navigation items for authenticated users - logically grouped by functionality
  const authenticatedNavItems = [
    // Core Actions - Primary user activities
    { name: "Dashboard", href: "/dashboard", icon: Home, group: "core", priority: 1, description: "Overview and quick actions" },
    { name: "Routes", href: "/routes/active", icon: Route, group: "core", priority: 2, description: "Track and manage routes" },
    
    // Competition & Social - Competitive features
    { name: "Territory", href: "/territory/map", icon: MapPin, group: "competition", priority: 3, description: "View and manage territories" },
    { name: "Leaderboard", href: "/leaderboard", icon: Trophy, group: "competition", priority: 4, description: "Rankings and achievements" },
    
    // Account Management - User settings and profile
    { name: "Profile", href: user ? `/profile/${user.id}/overview` : "/profile", icon: User, group: "account", priority: 5, description: "Account settings and stats" },
  ];

  // Essential navigation items for unauthenticated users - minimal but clear
  const unauthenticatedNavItems = [
    { name: "Home", href: "/", icon: Home, group: "main", description: "Welcome and overview" },
    { name: "Leaderboard", href: "/leaderboard", icon: Trophy, group: "main", description: "View top players" },
  ];

  const navItems = isAuthenticated ? authenticatedNavItems : unauthenticatedNavItems;

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:block sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-foreground" />
              </div>
              <span className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Route Wars
              </span>
            </Link>

            {/* Navigation Links - Grouped by functionality */}
            <div className="flex items-center gap-1">
              {/* Core Features Group */}
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted/30">
                {navItems.filter(item => item.group === 'core' || item.group === 'main').map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href || (item.name === "Profile" && location.pathname.startsWith("/profile"));
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                      title={item.description}
                    >
                      <Icon className="w-4 h-4" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>

              {/* Competition Group (only for authenticated users) */}
              {isAuthenticated && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted/30">
                  {navItems.filter(item => item.group === 'competition').map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                        title={item.description}
                      >
                        <Icon className="w-4 h-4" />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Account Group (only for authenticated users) */}
              {isAuthenticated && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted/30">
                  {navItems.filter(item => item.group === 'account').map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.href || (item.name === "Profile" && location.pathname.startsWith("/profile"));
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                        title={item.description}
                      >
                        <Icon className="w-4 h-4" />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              )}

            </div>

            {/* Auth Section */}
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <GamificationNavStatus compact />
                  <span className="text-sm text-muted-foreground">
                    Welcome, {user?.username || user?.email}
                  </span>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/login">
                      <LogIn className="w-4 h-4 mr-2" />
                      Login
                    </Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link to="/register">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Sign Up
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Top Bar - Simplified */}
      <nav className="md:hidden sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/50">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 min-h-[44px]">
              <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-foreground" />
              </div>
              <span className="text-lg font-bold bg-gradient-hero bg-clip-text text-transparent">
                Route Wars
              </span>
            </Link>

            {/* Auth Section for Mobile */}
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              ) : (
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/login">
                      <LogIn className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link to="/register">
                      <UserPlus className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}