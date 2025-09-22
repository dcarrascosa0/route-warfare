import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useWebSocketManager, WebSocketMessage } from '@/hooks/useWebSocketManager';
import { useAuth } from '@/hooks/useAuth';

// Notification types based on backend schemas
export interface Notification {
  id: string;
  user_id: string;
  type: 'TERRITORY_CLAIMED' | 'TERRITORY_ATTACKED' | 'ROUTE_COMPLETED' | 'ACHIEVEMENT_UNLOCKED' | 'SYSTEM_ANNOUNCEMENT';
  title: string;
  message: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  data?: { [key: string]: string | number | boolean };
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
  connectionHealth: 'good' | 'ok' | 'poor';
  
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
  onTerritoryUpdate?: (data: { [key: string]: string | number | boolean }) => void;
  onRouteComplete?: (data: { [key: string]: string | number | boolean }) => void;
  onAchievementUnlocked?: (data: { [key: string]: string | number | boolean }) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: React.ReactNode;
  onNotification?: (notification: Notification) => void;
  onTerritoryUpdate?: (data: { [key: string]: string | number | boolean }) => void;
  onRouteComplete?: (data: { [key: string]: string | number | boolean }) => void;
  onAchievementUnlocked?: (data: { [key: string]: string | number | boolean }) => void;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  onNotification,
  onTerritoryUpdate,
  onRouteComplete,
  onAchievementUnlocked,
}) => {
  const { user } = useAuth();
  const wsHook = useWebSocketManager({ autoConnect: !!user });

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handleNewNotification = (message: WebSocketMessage) => {
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
    };

    const cleanup = wsHook.onMessage('notification', handleNewNotification);
    return cleanup;
  }, [wsHook.onMessage, onNotification, onTerritoryUpdate, onRouteComplete, onAchievementUnlocked]);

  const markAsRead = useCallback(async (notificationId: string) => {
    // This should now be an API call, but for now we'll keep it client-side
    // and send a websocket message.
    wsHook.sendMessage({
      type: 'mark_read',
      data: { notification_id: notificationId },
    });
    
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, status: 'READ' as const } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, [wsHook.sendMessage]);

  const markAllAsRead = useCallback(async () => {
    wsHook.sendMessage({ type: 'mark_all_read', data: {} });
    setNotifications(prev => 
      prev.map(n => n.status !== 'READ' ? { ...n, status: 'READ' as const } : n)
    );
    setUnreadCount(0);
  }, [wsHook.sendMessage]);

  const clearNotifications = useCallback(() => {
    // This should also be an API call
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const contextValue: NotificationContextType = {
    isConnected: wsHook.isConnected,
    connectionError: wsHook.connectionState.error || null,
    connectionId: null, // This is not available in the new hook
    connectionHealth: wsHook.health,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    connect: wsHook.connect,
    disconnect: wsHook.disconnect,
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