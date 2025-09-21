import { QueryClient, MutationCache, QueryCache } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiResult } from '../api';

// Enhanced error handling for React Query
const handleQueryError = (error: unknown, query: any) => {
  console.error('Query error:', error, { queryKey: query.queryKey });
  
  // Don't show toast for background refetches
  if (query.state.fetchStatus === 'fetching' && query.state.data !== undefined) {
    return;
  }

  const apiError = error as ApiResult<unknown>;
  if (apiError?.status === 401) {
    // Authentication errors are handled by the auth context
    return;
  }

  if (apiError?.status === 403) {
    toast.error('You don\'t have permission to access this resource');
    return;
  }

  if (apiError?.status >= 500) {
    toast.error('Server error. Please try again later.');
    return;
  }

  // Generic error message
  toast.error('Something went wrong. Please try again.');
};

const handleMutationError = (error: unknown, variables: unknown, context: unknown, mutation: any) => {
  console.error('Mutation error:', error, { 
    mutationKey: mutation.options.mutationKey,
    variables,
    context 
  });

  const apiError = error as ApiResult<unknown>;
  
  if (apiError?.status === 401) {
    toast.error('Please log in to continue');
    return;
  }

  if (apiError?.status === 403) {
    toast.error('You don\'t have permission to perform this action');
    return;
  }

  if (apiError?.status === 409) {
    toast.error('This action conflicts with current data. Please refresh and try again.');
    return;
  }

  if (apiError?.status >= 500) {
    toast.error('Server error. Please try again later.');
    return;
  }

  // Extract error message from API response
  let errorMessage = 'Operation failed. Please try again.';
  if (apiError?.error && typeof apiError.error === 'object') {
    const errorObj = apiError.error as any;
    if (errorObj.detail) {
      errorMessage = typeof errorObj.detail === 'string' 
        ? errorObj.detail 
        : 'Validation error occurred';
    } else if (errorObj.message) {
      errorMessage = errorObj.message;
    }
  }

  toast.error(errorMessage);
};

// Create enhanced query client
export const createQueryClient = () => new QueryClient({
  queryCache: new QueryCache({
    onError: handleQueryError,
  }),
  mutationCache: new MutationCache({
    onError: handleMutationError,
  }),
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on authentication or permission errors
        if (error?.status === 401 || error?.status === 403) return false;
        
        // Don't retry on client errors (except timeout and rate limit)
        if (error?.status >= 400 && error?.status < 500 && 
            ![408, 429].includes(error?.status)) return false;
        
        // Retry up to 3 times for server errors and network issues
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry mutations on client errors
        if (error?.status >= 400 && error?.status < 500) return false;
        
        // Retry once for server errors
        return failureCount < 1;
      },
      retryDelay: 1000,
    },
  },
});

// Query key factories for consistent cache management
export const queryKeys = {
  // Auth
  me: () => ['auth', 'me'] as const,
  
  // Users
  userProfile: (userId: string) => ['users', 'profile', userId] as const,
  userStatistics: (userId: string) => ['users', 'statistics', userId] as const,
  userStatisticsComparison: (userId: string) => ['users', 'statistics', 'comparison', userId] as const,
  userStatisticsHistory: (userId: string, period: string) => ['users', 'statistics', 'history', userId, period] as const,
  userAchievements: (userId: string) => ['users', 'achievements', userId] as const,
  achievementProgress: (userId: string, achievementId: string) => ['users', 'achievements', 'progress', userId, achievementId] as const,
  
  // Routes
  routesForUser: (userId: string, limit?: number) => ['routes', 'user', userId, { limit }] as const,
  activeRoute: (userId: string) => ['routes', 'active', userId] as const,
  route: (routeId: string, userId: string) => ['routes', 'detail', routeId, userId] as const,
  routeStatistics: (routeId: string, userId: string) => ['routes', 'statistics', routeId, userId] as const,
  
  // Territories
  territoriesMap: (params?: Record<string, any>) => ['territories', 'map', params] as const,
  userTerritories: (userId: string) => ['territories', 'user', userId] as const,
  territory: (territoryId: string) => ['territories', 'detail', territoryId] as const,
  contestedTerritories: () => ['territories', 'contested'] as const,
  nearbyTerritories: (lat: number, lng: number, radius: number) => ['territories', 'nearby', lat, lng, radius] as const,
  
  // Leaderboard
  leaderboard: (category: string, period: string, start: number, limit: number) => 
    ['leaderboard', category, period, start, limit] as const,
  leaderboardStats: (category: string) => ['leaderboard', 'stats', category] as const,
} as const;

// Cache invalidation helpers
export const invalidateQueries = {
  userProfile: (queryClient: QueryClient, userId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.userProfile(userId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.userStatistics(userId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.userAchievements(userId) });
  },
  
  routes: (queryClient: QueryClient, userId: string) => {
    queryClient.invalidateQueries({ queryKey: ['routes'] });
    queryClient.invalidateQueries({ queryKey: queryKeys.routesForUser(userId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.activeRoute(userId) });
  },
  
  territories: (queryClient: QueryClient, userId?: string) => {
    queryClient.invalidateQueries({ queryKey: ['territories'] });
    if (userId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.userTerritories(userId) });
    }
  },
  
  leaderboard: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
  },
  
  all: (queryClient: QueryClient) => {
    queryClient.invalidateQueries();
  },
};