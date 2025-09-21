import { useContext } from 'react';
import { NotificationContext, NotificationContextType } from '@/contexts/NotificationContext';

/**
 * Hook for subscribing to real-time game events via WebSocket notifications.
 * 
 * Provides access to:
 * - Connection state and management
 * - Real-time notifications
 * - Event handlers for territory attacks, route completions, and achievements
 * - Notification management (mark as read, clear, etc.)
 * 
 * @returns NotificationContextType with all notification functionality
 */
export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

/**
 * Hook for subscribing to specific notification types with custom handlers.
 * 
 * @param handlers - Object with optional event handlers
 * @returns Notification context with connection state and actions
 */
export const useNotificationHandlers = (handlers: {
  onNotification?: (notification: any) => void;
  onTerritoryUpdate?: (data: any) => void;
  onRouteComplete?: (data: any) => void;
  onAchievementUnlocked?: (data: any) => void;
}) => {
  const notifications = useNotifications();
  
  // Set up handlers if provided
  if (handlers.onNotification) {
    notifications.onNotification = handlers.onNotification;
  }
  if (handlers.onTerritoryUpdate) {
    notifications.onTerritoryUpdate = handlers.onTerritoryUpdate;
  }
  if (handlers.onRouteComplete) {
    notifications.onRouteComplete = handlers.onRouteComplete;
  }
  if (handlers.onAchievementUnlocked) {
    notifications.onAchievementUnlocked = handlers.onAchievementUnlocked;
  }
  
  return notifications;
};

/**
 * Hook for connection status monitoring and retry logic.
 * 
 * @returns Connection state and management functions
 */
export const useNotificationConnection = () => {
  const { isConnected, connectionError, connectionId, connect, disconnect } = useNotifications();
  
  return {
    isConnected,
    connectionError,
    connectionId,
    connect,
    disconnect,
    hasError: !!connectionError,
    canRetry: !isConnected && !!connectionError,
  };
};