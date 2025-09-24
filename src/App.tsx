import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner, toast } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes as RouterRoutes, Route, useLocation, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { NotificationProvider, Notification } from "@/contexts/NotificationContext";
import { TerritoryProvider } from "@/contexts/TerritoryContext";
import { createQueryClient } from "@/lib/query/query-client";
import { initializeOfflineSync } from "@/lib/network/offline-sync";
import { Navigation } from "@/components/layout";
import { LoadingSpinner } from "@/components/common";
import RequireAuth from "@/components/features/auth/RequireAuth";
import AnimatedPage from "@/components/common/AnimatedPage";
import { AnimatePresence } from "framer-motion";
import { GlobalControlsProvider } from "@/contexts/GlobalControlsContext";

// Lazy load page components for better performance
const Index = lazy(() => import("./pages/Index"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Territory = lazy(() => import("./pages/Territory"));
const Routes = lazy(() => import("./pages/Routes"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Profile = lazy(() => import("./pages/Profile"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = createQueryClient();

// Initialize offline sync
initializeOfflineSync(queryClient);

const TerritoryProviderWrapper = ({ children }: { children: React.ReactNode }) => {
  const { user, token } = useAuth();
  return (
    <TerritoryProvider userId={user?.id} token={token}>
      {children}
    </TerritoryProvider>
  );
};

const RouteDefinitions = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <RouterRoutes location={location} key={location.pathname}>
        <Route path="/" element={<AnimatedPage><Suspense fallback={<LoadingSpinner />}><Index /></Suspense></AnimatedPage>} />
        <Route path="/dashboard" element={<RequireAuth><AnimatedPage><Suspense fallback={<LoadingSpinner />}><Dashboard /></Suspense></AnimatedPage></RequireAuth>} />
        {/* Territory */}
        <Route path="/territory" element={<Navigate to="/territory/map" replace />} />
        <Route path="/territory/map" element={<RequireAuth><AnimatedPage><Suspense fallback={<LoadingSpinner />}><Territory /></Suspense></AnimatedPage></RequireAuth>} />
        <Route path="/territory/stats" element={<RequireAuth><AnimatedPage><Suspense fallback={<LoadingSpinner />}><Territory /></Suspense></AnimatedPage></RequireAuth>} />
        {/* Routes */}
        <Route path="/routes" element={<Navigate to="/routes/active" replace />} />
        <Route path="/routes/active" element={<RequireAuth><AnimatedPage><Suspense fallback={<LoadingSpinner />}><Routes /></Suspense></AnimatedPage></RequireAuth>} />
        <Route path="/routes/history" element={<RequireAuth><AnimatedPage><Suspense fallback={<LoadingSpinner />}><Routes /></Suspense></AnimatedPage></RequireAuth>} />
        <Route path="/routes/history/:id" element={<RequireAuth><AnimatedPage><Suspense fallback={<LoadingSpinner />}><Routes /></Suspense></AnimatedPage></RequireAuth>} />
        <Route path="/leaderboard" element={<AnimatedPage><Suspense fallback={<LoadingSpinner />}><Leaderboard /></Suspense></AnimatedPage>} />
        <Route path="/profile" element={<RequireAuth><AnimatedPage><Suspense fallback={<LoadingSpinner />}><Profile /></Suspense></AnimatedPage></RequireAuth>} />
        <Route path="/profile/:user" element={<RequireAuth><AnimatedPage><Suspense fallback={<LoadingSpinner />}><Profile /></Suspense></AnimatedPage></RequireAuth>} />
        <Route path="/profile/:user/:section" element={<RequireAuth><AnimatedPage><Suspense fallback={<LoadingSpinner />}><Profile /></Suspense></AnimatedPage></RequireAuth>} />
        <Route path="/login" element={<AnimatedPage><Suspense fallback={<LoadingSpinner />}><Login /></Suspense></AnimatedPage>} />
        <Route path="/register" element={<AnimatedPage><Suspense fallback={<LoadingSpinner />}><Register /></Suspense></AnimatedPage>} />
        <Route path="*" element={<AnimatedPage><Suspense fallback={<LoadingSpinner />}><NotFound /></Suspense></AnimatedPage>} />
      </RouterRoutes>
    </AnimatePresence>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <TerritoryProviderWrapper>
            <GlobalControlsProvider>
            <NotificationProvider
              onNotification={(notification: Notification) => {
                toast.info(notification.title, {
                  description: notification.message,
                });
              }}
            >
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <Navigation />
                <RouteDefinitions />
              </TooltipProvider>
            </NotificationProvider>
            </GlobalControlsProvider>
          </TerritoryProviderWrapper>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
