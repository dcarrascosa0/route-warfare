import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { createQueryClient } from "@/lib/query/query-client";
import { initializeOfflineSync } from "@/lib/network/offline-sync";
import { Navigation } from "@/components/layout";
import { LoadingSpinner } from "@/components/common";
import RequireAuth from "@/components/features/auth/RequireAuth";

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

const App = () => {

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Navigation />
            <RouterRoutes>
            <Route path="/" element={
              <Suspense fallback={<LoadingSpinner />}>
                <Index />
              </Suspense>
            } />
            <Route path="/dashboard" element={
              <RequireAuth>
                <Suspense fallback={<LoadingSpinner />}>
                  <Dashboard />
                </Suspense>
              </RequireAuth>
            } />
            <Route path="/territory" element={
              <RequireAuth>
                <Suspense fallback={<LoadingSpinner />}>
                  <Territory />
                </Suspense>
              </RequireAuth>
            } />
            <Route path="/routes" element={
              <RequireAuth>
                <Suspense fallback={<LoadingSpinner />}>
                  <Routes />
                </Suspense>
              </RequireAuth>
            } />
            <Route path="/leaderboard" element={
              <Suspense fallback={<LoadingSpinner />}>
                <Leaderboard />
              </Suspense>
            } />
            <Route path="/profile" element={
              <RequireAuth>
                <Suspense fallback={<LoadingSpinner />}>
                  <Profile />
                </Suspense>
              </RequireAuth>
            } />
            <Route path="/login" element={
              <Suspense fallback={<LoadingSpinner />}>
                <Login />
              </Suspense>
            } />
            <Route path="/register" element={
              <Suspense fallback={<LoadingSpinner />}>
                <Register />
              </Suspense>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={
              <Suspense fallback={<LoadingSpinner />}>
                <NotFound />
              </Suspense>
            } />
          </RouterRoutes>
          
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
  );
};

export default App;
