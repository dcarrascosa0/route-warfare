import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth, TokenManager } from '../AuthContext';
import { GatewayAPI } from '@/lib/api';

// Mock the API
vi.mock('@/lib/api', () => ({
  GatewayAPI: {
    login: vi.fn(),
    me: vi.fn(),
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Test component that uses the auth context
const TestComponent = () => {
  const auth = useAuth();
  return (
    <div>
      <div data-testid="authenticated">{auth.isAuthenticated.toString()}</div>
      <div data-testid="loading">{auth.isLoading.toString()}</div>
      <div data-testid="user">{auth.user?.username || 'null'}</div>
      <div data-testid="error">{auth.error || 'null'}</div>
      <button onClick={() => auth.login('test@example.com', 'password')}>
        Login
      </button>
      <button onClick={() => auth.logout()}>Logout</button>
    </div>
  );
};

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>{component}</AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('TokenManager', () => {
    it('should get access token from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('test-token');
      
      const token = TokenManager.getAccessToken();
      
      expect(token).toBe('test-token');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('access_token');
    });

    it('should return null when localStorage throws', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      const token = TokenManager.getAccessToken();
      
      expect(token).toBeNull();
    });

    it('should set tokens in localStorage', () => {
      TokenManager.setTokens('access-token', 'refresh-token', 'user-id');
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('access_token', 'access-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('refresh_token', 'refresh-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('user_id', 'user-id');
    });

    it('should clear tokens from localStorage', () => {
      TokenManager.clearTokens();
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('access_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refresh_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user_id');
    });

    it('should detect expired tokens', () => {
      // Create a token that expires in the past
      const expiredPayload = { exp: Math.floor(Date.now() / 1000) - 3600 }; // 1 hour ago
      const expiredToken = `header.${btoa(JSON.stringify(expiredPayload))}.signature`;
      
      expect(TokenManager.isTokenExpired(expiredToken)).toBe(true);
    });

    it('should detect valid tokens', () => {
      // Create a token that expires in the future
      const validPayload = { exp: Math.floor(Date.now() / 1000) + 3600 }; // 1 hour from now
      const validToken = `header.${btoa(JSON.stringify(validPayload))}.signature`;
      
      expect(TokenManager.isTokenExpired(validToken)).toBe(false);
    });

    it('should handle malformed tokens', () => {
      expect(TokenManager.isTokenExpired('invalid-token')).toBe(true);
    });
  });

  describe('AuthProvider', () => {
    it('should initialize with unauthenticated state', async () => {
      renderWithProviders(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
        expect(screen.getByTestId('user')).toHaveTextContent('null');
      });
    });

    it('should handle successful login', async () => {
      const mockUser = { id: '1', username: 'testuser', email: 'test@example.com' };
      const mockResponse = {
        ok: true,
        data: {
          user: mockUser,
          tokens: {
            access_token: 'access-token',
            refresh_token: 'refresh-token',
          },
        },
      };

      vi.mocked(GatewayAPI.login).mockResolvedValue(mockResponse);

      renderWithProviders(<TestComponent />);
      
      const loginButton = screen.getByText('Login');
      
      await act(async () => {
        loginButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
        expect(screen.getByTestId('user')).toHaveTextContent('testuser');
      });

      expect(TokenManager.setTokens).toHaveBeenCalledWith(
        'access-token',
        'refresh-token',
        '1'
      );
    });

    it('should handle login failure', async () => {
      const mockResponse = {
        ok: false,
        error: { detail: 'Invalid credentials' },
      };

      vi.mocked(GatewayAPI.login).mockResolvedValue(mockResponse);

      renderWithProviders(<TestComponent />);
      
      const loginButton = screen.getByText('Login');
      
      await act(async () => {
        loginButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
        expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials');
      });
    });

    it('should handle logout', async () => {
      // First set up authenticated state
      const mockUser = { id: '1', username: 'testuser', email: 'test@example.com' };
      const mockResponse = {
        ok: true,
        data: {
          user: mockUser,
          tokens: {
            access_token: 'access-token',
            refresh_token: 'refresh-token',
          },
        },
      };

      vi.mocked(GatewayAPI.login).mockResolvedValue(mockResponse);

      renderWithProviders(<TestComponent />);
      
      // Login first
      const loginButton = screen.getByText('Login');
      await act(async () => {
        loginButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      });

      // Now logout
      const logoutButton = screen.getByText('Logout');
      await act(async () => {
        logoutButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
        expect(screen.getByTestId('user')).toHaveTextContent('null');
      });

      expect(TokenManager.clearTokens).toHaveBeenCalled();
    });

    it('should validate existing session on mount', async () => {
      const mockUser = { id: '1', username: 'testuser', email: 'test@example.com' };
      
      // Mock existing tokens
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'access_token') return 'existing-token';
        if (key === 'user_id') return '1';
        return null;
      });

      // Mock successful me() call
      vi.mocked(GatewayAPI.me).mockResolvedValue({
        ok: true,
        data: { user: mockUser },
      });

      // Create a valid token (not expired)
      const validPayload = { exp: Math.floor(Date.now() / 1000) + 3600 };
      const validToken = `header.${btoa(JSON.stringify(validPayload))}.signature`;
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'access_token') return validToken;
        if (key === 'user_id') return '1';
        return null;
      });

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
        expect(screen.getByTestId('user')).toHaveTextContent('testuser');
      });
    });
  });
});