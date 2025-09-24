import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, MapPin, Route, Trophy, User, LogOut, Home, UserPlus, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import SyncStatusIndicator from "@/components/common/network/SyncStatusIndicator";
import { useGlobalControls } from "@/contexts/GlobalControlsContext";
import { Switch } from "@/components/ui/switch";
import { Calendar, BarChart3, Users as UsersIcon, Radio } from "lucide-react";

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, logout, user } = useAuth();
  const location = useLocation();
  const { period, setPeriod, live, setLive } = useGlobalControls();

  // Navigation items for authenticated users
  const authenticatedNavItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Territory", href: "/territory/map", icon: MapPin },
    { name: "Routes", href: "/routes/active", icon: Route },
    { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
    { name: "Profile", href: user ? `/profile/${user.id}/overview` : "/profile", icon: User },
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
                const isActive = location.pathname === item.href || (item.name === "Profile" && location.pathname.startsWith("/profile"));
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
              {/* Global Period */}
              <div className="hidden lg:flex items-center gap-1 bg-muted rounded-md p-1">
                {([
                  { id: "ALL_TIME", label: "All", icon: BarChart3 },
                  { id: "MONTHLY", label: "Month", icon: Calendar },
                  { id: "WEEKLY", label: "Week", icon: UsersIcon },
                ] as const).map((opt) => {
                  const Icon = opt.icon;
                  const active = period === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setPeriod(opt.id as any)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-sm text-sm ${active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
                      title={`Period: ${opt.label}`}
                    >
                      <Icon className="w-3 h-3" /> {opt.label}
                    </button>
                  );
                })}
              </div>
              {/* Live Toggle */}
              <div className="hidden lg:flex items-center gap-2">
                <Radio className={`w-4 h-4 ${live ? "text-green-500" : "text-muted-foreground"}`} />
                <span className="text-xs text-muted-foreground">Live</span>
                <Switch checked={live} onCheckedChange={setLive} />
              </div>
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
                  const isActive = location.pathname === item.href || (item.name === "Profile" && location.pathname.startsWith("/profile"));
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

                {/* Mobile Global Controls */}
                <div className="mt-2 p-3 rounded-lg bg-muted/50">
                  <div className="text-xs font-medium mb-2">Period</div>
                  <div className="flex items-center gap-2 mb-3">
                    {([
                      { id: "ALL_TIME", label: "All" },
                      { id: "MONTHLY", label: "Month" },
                      { id: "WEEKLY", label: "Week" },
                    ] as const).map((opt) => (
                      <Button key={opt.id} size="sm" variant={period === opt.id ? "default" : "outline"} onClick={() => setPeriod(opt.id as any)}>
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">Live Updates</div>
                    <div className="flex items-center gap-2">
                      <Switch checked={live} onCheckedChange={setLive} />
                    </div>
                  </div>
                </div>

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