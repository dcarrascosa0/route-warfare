import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, MapPin, Route, Trophy, User, LogOut, Home, UserPlus, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import SyncStatusIndicator from "@/components/common/network/SyncStatusIndicator";

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, logout, user } = useAuth();
  const location = useLocation();

  // Navigation items for authenticated users
  const authenticatedNavItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Territory", href: "/territory", icon: MapPin },
    { name: "Routes", href: "/routes", icon: Route },
    { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
    { name: "Profile", href: "/profile", icon: User },
  ];

  // Navigation items for unauthenticated users
  const unauthenticatedNavItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Leaderboard", href: "/leaderboard", icon: Trophy }, // Public leaderboard
  ];

  const navItems = isAuthenticated ? authenticatedNavItems : unauthenticatedNavItems;

  const handleLogout = () => {
    logout();
    setIsOpen(false);
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

            {/* Navigation Links */}
            <div className="flex items-center gap-6">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>

            {/* Auth Section */}
            <div className="flex items-center gap-4">
              <SyncStatusIndicator />

              {isAuthenticated ? (
                <div className="flex items-center gap-3">
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

      {/* Mobile Navigation */}
      <nav className="md:hidden sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-hero rounded-lg flex items-center justify-center">
                <MapPin className="w-4 h-4 text-foreground" />
              </div>
              <span className="text-lg font-bold bg-gradient-hero bg-clip-text text-transparent">
                Route Wars
              </span>
            </Link>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="p-2"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>

          {/* Mobile Menu */}
          {isOpen && (
            <div className="mt-4 pb-4 border-t border-border/50">
              <div className="flex flex-col gap-2 mt-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.name}
                    </Link>
                  );
                })}

                {/* Mobile Auth Section */}
                <div className="mt-4 pt-4 border-t border-border/50">
                  <SyncStatusIndicator className="mb-3" />

                  {isAuthenticated ? (
                    <div className="space-y-2">
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        Welcome, {user?.username || user?.email}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLogout}
                        className="w-full justify-start"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Button variant="ghost" size="sm" asChild className="w-full justify-start">
                        <Link to="/login" onClick={() => setIsOpen(false)}>
                          <LogIn className="w-4 h-4 mr-2" />
                          Login
                        </Link>
                      </Button>
                      <Button size="sm" asChild className="w-full justify-start">
                        <Link to="/register" onClick={() => setIsOpen(false)}>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Sign Up
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}