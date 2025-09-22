import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { GatewayAPI } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth as useAuthContext } from '@/contexts/AuthContext';
import { User } from '@/contexts/AuthContext';
import { queryKeys } from '@/lib/query';

// Re-export the useAuth hook from context for convenience
export { useAuth } from '@/contexts/AuthContext';

// Enhanced authentication hooks with React Query integration
export const useAuthMutation = () => {
  const auth = useAuthContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  if (!auth) {
    throw new Error('useAuthMutation must be used within an AuthProvider');
  }

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const success = await auth.login(email, password);
      if (!success) {
        throw new Error(auth.error || 'Login failed');
      }
      return success;
    },
    onSuccess: () => {
      // Invalidate and refetch user-related queries
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      auth.logout();
    },
    onSuccess: () => {
      // Clear all cached data on logout
      queryClient.clear();
      navigate('/login');
    },
  });

  return {
    login: loginMutation,
    logout: logoutMutation,
    isLoading: loginMutation.isPending || logoutMutation.isPending,
  };
};

// Hook for fetching current user profile
export const useCurrentUser = () => {
  const { user, isAuthenticated, isLoading } = useAuthStatus();

  return useQuery({
    queryKey: queryKeys.me(),
    queryFn: async () => {
      // If auth says we're authenticated, but we don't have a user object, fetch it
      if (isAuthenticated && !user) {
        const response = await GatewayAPI.me();
        if (response.ok) {
          return response.data;
        }
        // This case might indicate a token issue. The AuthProvider will handle logout on failed refresh.
        return null;
      }
      return user;
    },
    enabled: isAuthenticated && !user, // Only run if we think we're auth'd but are missing user data
    staleTime: Infinity, // This data is stable within a session
    initialData: user, // Seed with initial data from context
  });
};

// Hook for checking authentication status
export const useAuthStatus = () => {
  const auth = useAuthContext();

  if (!auth) {
    throw new Error('useAuthStatus must be used within an AuthProvider');
  }

  return {
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    user: auth.user,
    error: auth.error,
  };
};

// Hook for handling authentication errors
export const useAuthError = () => {
  const auth = useAuthContext();

  if (!auth) {
    throw new Error('useAuthError must be used within an AuthProvider');
  }

  return {
    error: auth.error,
    clearError: auth.clearError,
  };
};