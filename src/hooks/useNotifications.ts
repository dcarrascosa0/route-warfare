import { Notification as CustomNotification, NotificationContextType } from "@/contexts/NotificationContext";

// Export the types for external use
export type { Notification, WebSocketMessage, NotificationContextType } from "@/contexts/NotificationContext";

/**
 * @deprecated This hook is deprecated. Use `useWebSocketManager` for WebSocket logic instead.
 */
module.exports = {};

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
  // Import and re-export the useNotifications from context
  const { useNotifications } = require('@/contexts/NotificationContext');
  return useNotifications();
};

/**
 * Hook for subscribing to specific notification types with custom handlers.
 * 
 * @param handlers - Object with optional event handlers
 * @returns Notification context with connection state and actions
 */
export const useNotificationHandlers = (handlers: {
  onNotification?: (notification: Notification) => void;
  onTerritoryUpdate?: (data: { [key: string]: string | number | boolean }) => void;
  onRouteComplete?: (data: { [key: string]: string | number | boolean }) => void;
  onAchievementUnlocked?: (data: { [key: string]: string | number | boolean }) => void;
}) => {
  const ws = useNotifications();
  
  // Set up handlers if provided
  if (handlers.onNotification) {
    ws.onNotification = handlers.onNotification as unknown as (notification: CustomNotification) => void;
  }
  if (handlers.onTerritoryUpdate) {
    ws.onTerritoryUpdate = handlers.onTerritoryUpdate;
  }
  if (handlers.onRouteComplete) {
    ws.onRouteComplete = handlers.onRouteComplete;
  }
  if (handlers.onAchievementUnlocked) {
    ws.onAchievementUnlocked = handlers.onAchievementUnlocked;
  }
  
  return ws;
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