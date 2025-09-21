import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { getNotificationsWsUrl } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { TokenManager } from './AuthContext';

// Notification types based on backend schemas
export interface Notification {
  id: string;
  user_id: string;
  type: 'TERRITORY_CLAIMED' | 'TERRITORY_ATTACKED' | 'ROUTE_COMPLETED' | 'ACHIEVEMENT_UNLOCKED' | 'SYSTEM_ANNOUNCEMENT';
  title: string;
  message: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  data?: Record<string, any>;
  channels: string[];
  delivery_attempts: number;
  max_attempts: number;
  scheduled_at?: string;
  expires_at?: string;
  created_at: string;
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
}

export interface WebSocketMessage {
  type: string;
  data: Record<string, any>;
  timestamp: string;
}

export interface NotificationContextType {
  // Connection state
  isConnected: boolean;
  connectionError: string | null;
  connectionId: string | null;
  
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  
  // Actions
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotifications: () => void;
  
  // Connection management
  connect: () => void;
  disconnect: () => void;
  
  // Event handlers
  onNotification?: (notification: Notification) => void;
  onTerritoryUpdate?: (data: any) => void;
  onRouteComplete?: (data: any) => void;
  onAchievementUnlocked?: (data: any) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: React.ReactNode;
  onNotification?: (notification: Notification) => void;
  onTerritoryUpdate?: (data: any) => void;
  onRouteComplete?: (data: any) => void;
  onAchievementUnlocked?: (data: any) => void;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  onNotification,
  onTerritoryUpdate,
  onRouteComplete,
  onAchievementUnlocked,
}) => {
  const { user } = useAuth();
  
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  
  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // WebSocket connection
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Connection management
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = useRef(1000);
  const maxReconnectDelay = 30000;
  
  const clearTimeouts = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);
  
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      switch (message.type) {
        case 'connection_established':
          setConnectionId(message.data.connection_id);
          setIsConnected(true);
          setConnectionError(null);
          reconnectAttempts.current = 0;
          reconnectDelay.current = 1000;
          console.log('WebSocket connection established:', message.data.connection_id);
          break;
          
        case 'notification':
          const notification = message.data as Notification;
          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);
          onNotification?.(notification);
          
          // Handle specific notification types
          if (notification.type === 'TERRITORY_CLAIMED' || notification.type === 'TERRITORY_ATTACKED') {
            onTerritoryUpdate?.(notification.data);
          } else if (notification.type === 'ROUTE_COMPLETED') {
            onRouteComplete?.(notification.data);
          } else if (notification.type === 'ACHIEVEMENT_UNLOCKED') {
            onAchievementUnlocked?.(notification.data);
          }
          break;
          
        case 'territory_update':
          onTerritoryUpdate?.(message.data);
          break;
          
        case 'route_completed':
          onRouteComplete?.(message.data);
          break;
          
        case 'achievement_unlocked':
          onAchievementUnlocked?.(message.data);
          break;
          
        case 'ping':
          // Respond to server ping
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: 'pong',
              timestamp: new Date().toISOString()
            }));
          }
          break;
          
        case 'pong':
          // Server responded to our ping
          console.debug('Received pong from server');
          break;
          
        default:
          console.debug('Unknown WebSocket message type:', message.type);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }, [onNotification, onTerritoryUpdate, onRouteComplete, onAchievementUnlocked]);
  
  const handleOpen = useCallback(() => {
    console.log('WebSocket connection opened');
    setIsConnected(true);
    setConnectionError(null);
    reconnectAttempts.current = 0;
    reconnectDelay.current = 1000;
    
    // Start ping interval to keep connection alive
    pingIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'ping',
          timestamp: new Date().toISOString()
        }));
      }
    }, 30000); // Ping every 30 seconds
  }, []);
  
  const handleClose = useCallback((event: CloseEvent) => {
    console.log('WebSocket connection closed:', event.code, event.reason);
    setIsConnected(false);
    setConnectionId(null);
    clearTimeouts();
    
    // Attempt reconnection if not a normal closure and user is authenticated
    if (event.code !== 1000 && user && TokenManager.getAccessToken() && reconnectAttempts.current < maxReconnectAttempts) {
      const delay = Math.min(reconnectDelay.current, maxReconnectDelay);
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
      
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectAttempts.current++;
        reconnectDelay.current *= 2;
        connect();
      }, delay);
    } else if (reconnectAttempts.current >= maxReconnectAttempts) {
      setConnectionError('Failed to reconnect after multiple attempts');
    }
  }, [user]);
  
  const handleError = useCallback((event: Event) => {
    console.error('WebSocket error:', event);
    setConnectionError('WebSocket connection error');
  }, []);
  
  const connect = useCallback(() => {
    const token = TokenManager.getAccessToken();
    if (!user || !token) {
      console.log('Cannot connect WebSocket: user or token not available');
      return;
    }
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }
    
    try {
      const wsUrl = getNotificationsWsUrl(user.id, token);
      console.log('Connecting to WebSocket:', wsUrl);
      
      wsRef.current = new WebSocket(wsUrl);
      wsRef.current.onopen = handleOpen;
      wsRef.current.onmessage = handleMessage;
      wsRef.current.onclose = handleClose;
      wsRef.current.onerror = handleError;
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionError('Failed to create WebSocket connection');
    }
  }, [user, handleOpen, handleMessage, handleClose, handleError]);
  
  const disconnect = useCallback(() => {
    clearTimeouts();
    
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close(1000, 'User disconnected');
      }
      
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionId(null);
    setConnectionError(null);
    reconnectAttempts.current = 0;
    reconnectDelay.current = 1000;
  }, [clearTimeouts]);
  
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      // Send mark as read message via WebSocket
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'mark_read',
          notification_id: notificationId
        }));
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, status: 'READ' as const, read_at: new Date().toISOString() }
            : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);
  
  const markAllAsRead = useCallback(async () => {
    try {
      // Mark all unread notifications as read
      const unreadNotifications = notifications.filter(n => n.status !== 'READ');
      
      for (const notification of unreadNotifications) {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'mark_read',
            notification_id: notification.id
          }));
        }
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.status !== 'READ'
            ? { ...notification, status: 'READ' as const, read_at: new Date().toISOString() }
            : notification
        )
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [notifications]);
  
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);
  
  // Auto-connect when user and token are available
  useEffect(() => {
    if (user && TokenManager.getAccessToken()) {
      connect();
    } else {
      disconnect();
    }
    
    return () => {
      disconnect();
    };
  }, [user, connect, disconnect]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);
  
  const contextValue: NotificationContextType = {
    isConnected,
    connectionError,
    connectionId,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    connect,
    disconnect,
    onNotification,
    onTerritoryUpdate,
    onRouteComplete,
    onAchievementUnlocked,
  };
  
  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};