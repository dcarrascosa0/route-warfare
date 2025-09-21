import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NotificationProvider, useNotifications } from '../NotificationContext';

// Mock the auth hook
const mockUser = { id: 'user123', email: 'test@example.com' };
const mockToken = 'mock-jwt-token';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    token: mockToken,
    isAuthenticated: true,
  }),
}));

// Mock the API function
vi.mock('@/lib/api', () => ({
  getNotificationsWsUrl: (userId: string, token?: string) => 
    `ws://localhost:8000/api/v1/notifications/ws/${userId}?token=${token}`,
}));

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(public url: string) {
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(new Event('open'));
    }, 10);
  }

  send(data: string) {
    // Mock send functionality
  }

  close(code?: number, reason?: string) {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close', { code: code || 1000, reason }));
  }
}

// Test component that uses the notification context
const TestComponent: React.FC = () => {
  const {
    isConnected,
    connectionError,
    connectionId,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  } = useNotifications();

  return (
    <div>
      <div data-testid="connection-status">
        {isConnected ? 'connected' : 'disconnected'}
      </div>
      <div data-testid="connection-error">{connectionError || 'no-error'}</div>
      <div data-testid="connection-id">{connectionId || 'no-id'}</div>
      <div data-testid="notification-count">{notifications.length}</div>
      <div data-testid="unread-count">{unreadCount}</div>
      <button onClick={() => markAsRead('test-id')}>Mark Read</button>
      <button onClick={markAllAsRead}>Mark All Read</button>
      <button onClick={clearNotifications}>Clear All</button>
    </div>
  );
};

describe('NotificationContext', () => {
  let mockWebSocket: MockWebSocket;

  beforeEach(() => {
    // Mock WebSocket globally
    global.WebSocket = vi.fn().mockImplementation((url: string) => {
      mockWebSocket = new MockWebSocket(url);
      return mockWebSocket;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should establish WebSocket connection when user is authenticated', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
    });

    expect(global.WebSocket).toHaveBeenCalledWith(
      'ws://localhost:8000/api/v1/notifications/ws/user123?token=mock-jwt-token'
    );
  });

  it('should handle connection established message', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
    });

    // Simulate connection established message
    act(() => {
      mockWebSocket.onmessage?.(new MessageEvent('message', {
        data: JSON.stringify({
          type: 'connection_established',
          data: { connection_id: 'conn-123', user_id: 'user123' },
          timestamp: new Date().toISOString(),
        }),
      }));
    });

    await waitFor(() => {
      expect(screen.getByTestId('connection-id')).toHaveTextContent('conn-123');
    });
  });

  it('should handle incoming notifications', async () => {
    const onNotification = vi.fn();

    render(
      <NotificationProvider onNotification={onNotification}>
        <TestComponent />
      </NotificationProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
    });

    const mockNotification = {
      id: 'notif-123',
      user_id: 'user123',
      type: 'TERRITORY_CLAIMED',
      title: 'Territory Claimed!',
      message: 'You have claimed a new territory',
      priority: 'NORMAL',
      status: 'DELIVERED',
      data: { territory_id: 'territory-456' },
      channels: ['websocket'],
      delivery_attempts: 1,
      max_attempts: 3,
      created_at: new Date().toISOString(),
    };

    // Simulate notification message
    act(() => {
      mockWebSocket.onmessage?.(new MessageEvent('message', {
        data: JSON.stringify({
          type: 'notification',
          data: mockNotification,
          timestamp: new Date().toISOString(),
        }),
      }));
    });

    await waitFor(() => {
      expect(screen.getByTestId('notification-count')).toHaveTextContent('1');
      expect(screen.getByTestId('unread-count')).toHaveTextContent('1');
    });

    expect(onNotification).toHaveBeenCalledWith(mockNotification);
  });
});