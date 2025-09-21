/**
 * React hook for managing WebSocket connections with automatic reconnection
 * and route-territory event subscriptions.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { WebSocketManager, WebSocketMessage, ConnectionState, createWebSocketManager } from '../lib/websocket/websocket-manager';
import { useAuth } from './useAuth';
import { TokenManager } from '../contexts/AuthContext';

export interface UseWebSocketManagerOptions {
  autoConnect?: boolean;
  subscribeToEvents?: string[];
  watchTerritories?: string[];
  watchRoutes?: string[];
}

export interface WebSocketHookState {
  connectionState: ConnectionState;
  isConnected: boolean;
  isConnecting: boolean;
  lastMessage: WebSocketMessage | null;
  stats: any;
}

export const useWebSocketManager = (options: UseWebSocketManagerOptions = {}) => {
  const { user } = useAuth();
  const wsManagerRef = useRef<WebSocketManager | null>(null);
  const [state, setState] = useState<WebSocketHookState>({
    connectionState: {
      isConnected: false,
      isConnecting: false,
      reconnectAttempts: 0,
      connectionDuration: 0,
      totalReconnects: 0
    },
    isConnected: false,
    isConnecting: false,
    lastMessage: null,
    stats: {}
  });

  // Message handlers
  const [messageHandlers, setMessageHandlers] = useState<Map<string, (message: WebSocketMessage) => void>>(new Map());

  // Initialize WebSocket manager
  useEffect(() => {
    const token = TokenManager.getAccessToken();

    if (!user || !token) {
      return;
    }

    const wsUrl = process.env.NODE_ENV === 'production'
      ? 'wss://api.routewars.com/notifications'
      : 'ws://localhost:8006/notifications';

    wsManagerRef.current = createWebSocketManager({
      url: wsUrl,
      token,
      userId: user.id
    });

    const wsManager = wsManagerRef.current;

    // Set up event listeners
    const updateState = () => {
      const state = wsManager.getState();
      setState(prevState => ({
        ...prevState,
        connectionState: state,
        isConnected: state.isConnected,
        isConnecting: state.isConnecting,
        stats: {
          reconnectAttempts: state.reconnectAttempts,
          connectionDuration: state.connectionDuration,
          totalReconnects: state.totalReconnects
        }
      }));
    };

    // TODO: Add event listeners when WebSocketManager is fully implemented
    // For now, just update state periodically
    const interval = setInterval(updateState, 1000);

    // Initial state update
    updateState();

    return () => {
      clearInterval(interval);
      wsManager.disconnect();
    };
  }, [user, options.subscribeToEvents, options.watchTerritories, options.watchRoutes]);

  // Send message
  const sendMessage = useCallback((message: WebSocketMessage) => {
    wsManagerRef.current?.send(message);
  }, []);

  // Subscribe to events (placeholder)
  const subscribeToEvents = useCallback((
    eventTypes: string[],
    territoryIds?: string[],
    routeIds?: string[]
  ) => {
    console.log('Subscribe to events:', { eventTypes, territoryIds, routeIds });
    // TODO: Implement when WebSocketManager supports subscriptions
  }, []);

  // Unsubscribe from events (placeholder)
  const unsubscribeFromEvents = useCallback((
    eventTypes?: string[],
    territoryIds?: string[],
    routeIds?: string[]
  ) => {
    console.log('Unsubscribe from events:', { eventTypes, territoryIds, routeIds });
    // TODO: Implement when WebSocketManager supports subscriptions
  }, []);

  // Register message handler
  const onMessage = useCallback((messageType: string, handler: (message: WebSocketMessage) => void) => {
    setMessageHandlers(prev => new Map(prev.set(messageType, handler)));

    // Return cleanup function
    return () => {
      setMessageHandlers(prev => {
        const newMap = new Map(prev);
        newMap.delete(messageType);
        return newMap;
      });
    };
  }, []);

  // Force reconnect (placeholder implementation)
  const forceReconnect = useCallback(() => {
    // Since forceReconnect doesn't exist, simulate it with disconnect + connect
    if (wsManagerRef.current) {
      wsManagerRef.current.disconnect();
      wsManagerRef.current.connect();
    }
  }, []);

  // Disconnect
  const disconnect = useCallback(() => {
    wsManagerRef.current?.disconnect();
  }, []);

  // Connect
  const connect = useCallback(() => {
    wsManagerRef.current?.connect();
  }, []);

  return {
    ...state,
    sendMessage,
    subscribeToEvents,
    unsubscribeFromEvents,
    onMessage,
    forceReconnect,
    disconnect,
    connect,
    wsManager: wsManagerRef.current
  };
};

// Specialized hooks for route-territory events
export const useRouteEvents = () => {
  const wsHook = useWebSocketManager({
    subscribeToEvents: ['route_completed', 'route_progress']
  });

  const onRouteCompleted = useCallback((handler: (data: any) => void) => {
    return wsHook.onMessage('route_completed', (message) => handler(message.data));
  }, [wsHook.onMessage]);

  const onRouteProgress = useCallback((handler: (data: any) => void) => {
    return wsHook.onMessage('route_progress', (message) => handler(message.data));
  }, [wsHook.onMessage]);

  return {
    ...wsHook,
    onRouteCompleted,
    onRouteProgress
  };
};

export const useTerritoryEvents = () => {
  const wsHook = useWebSocketManager({
    subscribeToEvents: ['territory_update', 'territory_conflict', 'territory_map_update']
  });

  const onTerritoryUpdate = useCallback((handler: (data: any) => void) => {
    return wsHook.onMessage('territory_update', (message) => handler(message.data));
  }, [wsHook.onMessage]);

  const onTerritoryConflict = useCallback((handler: (data: any) => void) => {
    return wsHook.onMessage('territory_conflict', (message) => handler(message.data));
  }, [wsHook.onMessage]);

  const onTerritoryMapUpdate = useCallback((handler: (data: any) => void) => {
    return wsHook.onMessage('territory_map_update', (message) => handler(message.data));
  }, [wsHook.onMessage]);

  return {
    ...wsHook,
    onTerritoryUpdate,
    onTerritoryConflict,
    onTerritoryMapUpdate
  };
};

export const useRouteTerritoryEvents = () => {
  const wsHook = useWebSocketManager({
    subscribeToEvents: [
      'route_completed',
      'route_progress',
      'territory_update',
      'territory_conflict',
      'territory_map_update'
    ]
  });

  // Combined event handlers
  const onRouteCompleted = useCallback((handler: (data: any) => void) => {
    return wsHook.onMessage('route_completed', (message) => handler(message.data));
  }, [wsHook.onMessage]);

  const onTerritoryUpdate = useCallback((handler: (data: any) => void) => {
    return wsHook.onMessage('territory_update', (message) => handler(message.data));
  }, [wsHook.onMessage]);

  const onTerritoryConflict = useCallback((handler: (data: any) => void) => {
    return wsHook.onMessage('territory_conflict', (message) => handler(message.data));
  }, [wsHook.onMessage]);

  const onMapUpdate = useCallback((handler: (data: any) => void) => {
    return wsHook.onMessage('territory_map_update', (message) => handler(message.data));
  }, [wsHook.onMessage]);

  return {
    ...wsHook,
    onRouteCompleted,
    onTerritoryUpdate,
    onTerritoryConflict,
    onMapUpdate
  };
};

// Specialized hook for real-time route tracking with enhanced connection monitoring
export const useRealTimeRouteTracking = (routeId?: string) => {
  const wsHook = useWebSocketManager();
  const [routeData, setRouteData] = useState<{
    coordinates: any[];
    stats: any;
    territoryPreview: any;
  }>({
    coordinates: [],
    stats: null,
    territoryPreview: null
  });

  const [connectionHealth, setConnectionHealth] = useState<{
    isHealthy: boolean;
    quality: 'excellent' | 'good' | 'poor' | 'critical';
    lastUpdate: Date | null;
    updateCount: number;
    missedUpdates: number;
  }>({
    isHealthy: false,
    quality: 'critical',
    lastUpdate: null,
    updateCount: 0,
    missedUpdates: 0
  });

  // Subscribe to route updates when routeId changes
  useEffect(() => {
    if (!routeId || !wsHook.wsManager) return;

    console.log('Subscribing to route updates for:', routeId);
    // TODO: Implement route subscription when WebSocketManager supports it

    return () => {
      console.log('Unsubscribing from route updates for:', routeId);
      // TODO: Implement cleanup when WebSocketManager supports it
    };
  }, [routeId, wsHook.wsManager]);

  // Monitor connection health
  useEffect(() => {
    if (!wsHook.wsManager) return;

    // Simulate connection health monitoring
    const interval = setInterval(() => {
      setConnectionHealth(prev => ({
        ...prev,
        isHealthy: wsHook.isConnected,
        quality: wsHook.isConnected ? 'good' : 'critical'
      }));
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [wsHook.wsManager, wsHook.isConnected, routeId]);

  // Enhanced coordinate addition handler with deduplication
  const onCoordinateAdded = useCallback((handler: (data: {
    routeId: string;
    coordinate: any;
    routeStats: any;
    coordinates: any[];
  }) => void) => {
    return wsHook.onMessage('coordinate_added', (message) => {
      const data = message.data;

      // Update route data with deduplication
      setRouteData(prev => {
        const newCoordinates = data.coordinates || [...prev.coordinates, data.coordinate];

        // Deduplicate coordinates by timestamp
        const uniqueCoordinates = newCoordinates.filter((coord, index, arr) =>
          arr.findIndex(c => c.timestamp === coord.timestamp) === index
        );

        // Sort by timestamp
        uniqueCoordinates.sort((a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        return {
          ...prev,
          coordinates: uniqueCoordinates,
          stats: data.routeStats || prev.stats
        };
      });

      handler(data);
    });
  }, [wsHook.onMessage]);

  // Handle route path updates (batch coordinate updates)
  const onRoutePathUpdated = useCallback((handler: (data: {
    routeId: string;
    coordinates: any[];
    pathSegments: any[];
    routeStats: any;
  }) => void) => {
    return wsHook.onMessage('route_path_updated', (message) => {
      const data = message.data;
      setRouteData(prev => ({
        ...prev,
        coordinates: data.coordinates || prev.coordinates,
        stats: data.routeStats || prev.stats
      }));
      handler(data);
    });
  }, [wsHook.onMessage]);

  // Handle route quality updates
  const onRouteQualityUpdated = useCallback((handler: (data: {
    routeId: string;
    qualityScore: number;
    qualityIssues: string[];
    recommendations: string[];
  }) => void) => {
    return wsHook.onMessage('route_quality_updated', (message) => {
      handler(message.data);
    });
  }, [wsHook.onMessage]);

  // Handle route completion progress
  const onRouteCompletionProgress = useCallback((handler: (data: {
    routeId: string;
    completionPercentage: number;
    closureDistance: number;
    territoryEligible: boolean;
  }) => void) => {
    return wsHook.onMessage('route_completion_progress', (message) => {
      handler(message.data);
    });
  }, [wsHook.onMessage]);

  // Handle route statistics updates
  const onRouteStatsUpdated = useCallback((handler: (data: {
    routeId: string;
    stats: any;
  }) => void) => {
    return wsHook.onMessage('route_stats_updated', (message) => {
      const data = message.data;
      setRouteData(prev => ({
        ...prev,
        stats: data.stats
      }));
      handler(data);
    });
  }, [wsHook.onMessage]);

  // Handle territory preview updates
  const onTerritoryPreviewUpdated = useCallback((handler: (data: {
    routeId: string;
    territoryPreview: any;
  }) => void) => {
    return wsHook.onMessage('territory_preview_updated', (message) => {
      const data = message.data;
      setRouteData(prev => ({
        ...prev,
        territoryPreview: data.territoryPreview
      }));
      handler(data);
    });
  }, [wsHook.onMessage]);

  // Handle route completion
  const onRouteCompleted = useCallback((handler: (data: {
    routeId: string;
    route: any;
    territoryClaimResult: any;
  }) => void) => {
    return wsHook.onMessage('route_completed', (message) => {
      handler(message.data);
    });
  }, [wsHook.onMessage]);

  // Force refresh route data
  const refreshRouteData = useCallback(() => {
    if (routeId && wsHook.wsManager) {
      wsHook.wsManager.send({
        type: 'request_route_sync',
        data: { route_id: routeId }
      });
    }
  }, [routeId, wsHook.wsManager]);

  return {
    ...wsHook,
    routeData,
    connectionHealth,
    onCoordinateAdded,
    onRoutePathUpdated,
    onRouteQualityUpdated,
    onRouteCompletionProgress,
    onRouteStatsUpdated,
    onTerritoryPreviewUpdated,
    onRouteCompleted,
    setRouteData,
    refreshRouteData
  };
};