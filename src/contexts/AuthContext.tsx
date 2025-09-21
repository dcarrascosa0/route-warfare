import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from 'react';
import { GatewayAPI } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  username: string;
  profile_picture?: string;
  created_at: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Token management utilities
class TokenManager {
  static getAccessToken(): string | null {
    try {
      return localStorage.getItem('access_token');
    } catch {
      return null;
    }
  }

  static getRefreshToken(): string | null {
    try {
      return localStorage.getItem('refresh_token');
    } catch {
      return null;
    }
  }

  static getUserId(): string | null {
    try {
      return localStorage.getItem('user_id');
    } catch {
      return null;
    }
  }

  static setTokens(accessToken: string, refreshToken: string, userId?: string): void {
    try {
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      if (userId) {
        localStorage.setItem('user_id', userId);
      }
    } catch (error) {
      console.error('Failed to store tokens:', error);
    }
  }

  static clearTokens(): void {
    try {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_id');
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }

  static getTokenExpirationTime(token: string): number | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000; // Convert to milliseconds
    } catch {
      return null;
    }
  }
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  const navigate = useNavigate();

  // Memoize the refreshToken function to prevent infinite re-renders
  const refreshToken = useCallback(async (): Promise<boolean> => {
    const refreshTokenValue = TokenManager.getRefreshToken();
    
    if (!refreshTokenValue) {
      return false;
    }

    try {
      // Note: This endpoint might need to be implemented in the backend
      const response = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshTokenValue }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      const newAccessToken = data.access_token;
      const newRefreshToken = data.refresh_token;

      if (!newAccessToken || !newRefreshToken) {
        return false;
      }

      TokenManager.setTokens(newAccessToken, newRefreshToken);
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }, []);

  // Auto-refresh timer
  useEffect(() => {
    let refreshTimer: NodeJS.Timeout;

    const scheduleTokenRefresh = () => {
      const token = TokenManager.getAccessToken();
      if (!token) return;

      const expirationTime = TokenManager.getTokenExpirationTime(token);
      if (!expirationTime) return;

      // Refresh 5 minutes before expiration
      const refreshTime = expirationTime - Date.now() - 5 * 60 * 1000;
      
      if (refreshTime > 0) {
        refreshTimer = setTimeout(async () => {
          const success = await refreshToken();
          if (success) {
            scheduleTokenRefresh(); // Schedule next refresh
          }
        }, refreshTime);
      }
    };

    if (authState.isAuthenticated) {
      scheduleTokenRefresh();
    }

    return () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
    };
  }, [authState.isAuthenticated, refreshToken]);

  // Initialize authentication state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = TokenManager.getAccessToken();
      const userId = TokenManager.getUserId();

      if (!token || !userId) {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // Check if token is expired
      if (TokenManager.isTokenExpired(token)) {
        const refreshSuccess = await refreshToken();
        if (!refreshSuccess) {
          TokenManager.clearTokens();
          setAuthState(prev => ({ ...prev, isLoading: false }));
          return;
        }
      }

      // Fetch user profile to validate session
      try {
        const response = await GatewayAPI.me();
        if (response.ok && response.data) {
          const userData = response.data as any;
          setAuthState({
            user: userData.user || userData,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } else {
          // Invalid session, try to refresh
          const refreshSuccess = await refreshToken();
          if (!refreshSuccess) {
            TokenManager.clearTokens();
            setAuthState(prev => ({ ...prev, isLoading: false }));
          }
        }
      } catch (error) {
        console.error('Failed to validate session:', error);
        TokenManager.clearTokens();
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initializeAuth();
  }, [refreshToken]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await GatewayAPI.login(email, password);
      
      if (!response.ok) {
        const errorData = response.error as any;
        let errorMessage = 'Invalid email or password';
        
        if (errorData?.detail) {
          if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          } else if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail.map((err: any) => err.msg || err.message || err).join(', ');
          }
        }
        
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        return false;
      }

      const data = response.data as any;
      const accessToken = data?.tokens?.access_token;
      const refreshTokenValue = data?.tokens?.refresh_token;
      const user = data?.user;

      if (!accessToken || !refreshTokenValue || !user) {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Invalid response from server',
        }));
        return false;
      }

      TokenManager.setTokens(accessToken, refreshTokenValue, user.id);
      
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      toast.success('Successfully logged in!');
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Login failed. Please try again.',
      }));
      return false;
    }
  }, []);

  const logout = useCallback((): void => {
    TokenManager.clearTokens();
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    toast.info('You have been logged out');
    navigate('/login');
  }, [navigate]);

  const clearError = useCallback((): void => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  const contextValue: AuthContextType = useMemo(() => ({
    ...authState,
    login,
    logout,
    refreshToken,
    clearError,
  }), [authState, login, logout, refreshToken, clearError]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export token manager for use in API client
export { TokenManager };