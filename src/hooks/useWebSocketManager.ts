/**
 * React hook for managing WebSocket connections with automatic reconnection
 * and route-territory event subscriptions.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { WebSocketManager, WebSocketMessage, ConnectionState, createWebSocketManager } from '../lib/websocket/websocket-manager';
import { useAuth } from './useAuth';
import { TokenManager } from '../contexts/AuthContext';
import { useGlobalControls } from '@/contexts/GlobalControlsContext';

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
  health: 'good' | 'ok' | 'poor';
}

export const useWebSocketManager = (options: UseWebSocketManagerOptions = {}) => {
  const { user } = useAuth();
  const { live } = useGlobalControls();
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
    stats: {},
    health: 'poor'
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
      ? `wss://api.routewars.com/api/v1/notifications/ws/${user.id}`
      : `ws://localhost:8000/api/v1/notifications/ws/${user.id}`;
    
    wsManagerRef.current = createWebSocketManager({
      url: wsUrl,
      token,
      userId: user.id
    });

    const wsManager = wsManagerRef.current;

    // Set up event listeners
    const onStateChange = (newState: ConnectionState) => {
      let health: 'good' | 'ok' | 'poor' = 'poor';
      if (newState.isConnected) {
        if ((newState.latency || 0) < 200) {
          health = 'good';
        } else {
          health = 'ok';
        }
      }

      setState(prevState => ({
        ...prevState,
        connectionState: newState,
        isConnected: newState.isConnected,
        isConnecting: newState.isConnecting,
        stats: {
          reconnectAttempts: newState.reconnectAttempts,
          connectionDuration: newState.connectionDuration,
          totalReconnects: newState.totalReconnects,
          latency: newState.latency
        },
        health
      }));
    };

    const onMessage = (message: WebSocketMessage) => {
        setState(prevState => ({ ...prevState, lastMessage: message }));
        const handler = messageHandlers.get(message.type);
        if (handler) {
            handler(message);
        }
    };
    
    wsManager.on('statechange', onStateChange);
    wsManager.on('message', onMessage);

    // Respect global live toggle for auto connection
    if (options.autoConnect !== false && live) {
      wsManager.connect();
    }
    
    return () => {
      wsManager.removeListener('statechange', onStateChange);
      wsManager.removeListener('message', onMessage);
      wsManager.disconnect();
    };
  }, [user, options.autoConnect, live]);

  // React to changes in global live toggle
  useEffect(() => {
    const wsManager = wsManagerRef.current;
    if (!wsManager) return;

    if (live && !state.isConnected && !state.isConnecting) {
      wsManager.connect();
    }
    if (!live && (state.isConnected || state.isConnecting)) {
      wsManager.disconnect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live]);

  // Send message
  const sendMessage = useCallback((message: WebSocketMessage) => {
    wsManagerRef.current?.send(message);
  }, []);

  // Subscribe to events
  const subscribeToEvents = useCallback((
    eventTypes: string[],
    territoryIds?: string[],
    routeIds?: string[]
  ) => {
    sendMessage({
        type: 'subscribe',
        data: {
            event_types: eventTypes,
            territory_ids: territoryIds,
            route_ids: routeIds,
        }
    });
  }, [sendMessage]);

  // Unsubscribe from events
  const unsubscribeFromEvents = useCallback((
    eventTypes?: string[],
    territoryIds?: string[],
    routeIds?: string[]
  ) => {
    sendMessage({
        type: 'unsubscribe',
        data: {
            event_types: eventTypes,
            territory_ids: territoryIds,
            route_ids: routeIds,
        }
    });
  }, [sendMessage]);

  // Register message handler
  const onMessageHandler = useCallback((messageType: string, handler: (message: WebSocketMessage) => void) => {
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
    onMessage: onMessageHandler,
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
    wsHook.subscribeToEvents(['coordinate_added', 'route_stats_updated'], undefined, [routeId]);

    return () => {
      console.log('Unsubscribing from route updates for:', routeId);
      wsHook.unsubscribeFromEvents(['coordinate_added', 'route_stats_updated'], undefined, [routeId]);
    };
  }, [routeId, wsHook.wsManager, wsHook.subscribeToEvents, wsHook.unsubscribeFromEvents]);

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