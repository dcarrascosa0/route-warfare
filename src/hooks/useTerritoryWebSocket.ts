/**
 * Territory WebSocket hook for real-time territory updates
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { WebSocketManager, createWebSocketManager } from '@/lib/websocket/websocket-manager';
import { getTerritoryWsUrl, getGlobalTerritoryWsUrl } from '@/lib/api/utils/websocket-utils';
import { useAuth, TokenManager } from '@/contexts/AuthContext';

export interface TerritoryWebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastUpdate: Date | null;
}

export interface TerritoryWebSocketCallbacks {
  onTerritoryPreviewUpdate?: (data: any) => void;
  onTerritoryClaimed?: (data: any) => void;
  onLeaderboardUpdate?: (data: any) => void;
  onTerritoryMapUpdate?: (data: any) => void;
}

export function useTerritoryWebSocket(callbacks: TerritoryWebSocketCallbacks = {}) {
  const { user } = useAuth();
  const token = TokenManager.getAccessToken();
  const [state, setState] = useState<TerritoryWebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    lastUpdate: null,
  });

  const wsManagerRef = useRef<WebSocketManager | null>(null);
  const callbacksRef = useRef(callbacks);

  // Update callbacks ref when callbacks change
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  const updateState = useCallback((updates: Partial<TerritoryWebSocketState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const connect = useCallback(() => {
    if (!user?.id || !token || wsManagerRef.current) return;

    try {
      updateState({ isConnecting: true, error: null });

      const wsUrl = getTerritoryWsUrl(user.id, token);
      const manager = createWebSocketManager({
        url: wsUrl,
        token: token,
        userId: user.id,
      });

      // Set up event listeners
      manager.on('open', () => {
        updateState({ isConnected: true, isConnecting: false });
        
        // Subscribe to territory events
        manager.subscribeTo([
          'territory_preview',
          'territory_claimed',
          'leaderboard_update',
          'territory_map_update'
        ]);
      });

      manager.on('close', () => {
        updateState({ isConnected: false, isConnecting: false });
      });

      manager.on('error', (error: any) => {
        updateState({ 
          error: error?.message || 'WebSocket connection error',
          isConnecting: false 
        });
      });

      // Territory-specific event handlers
      manager.onTerritoryPreviewUpdate((data) => {
        updateState({ lastUpdate: new Date() });
        callbacksRef.current.onTerritoryPreviewUpdate?.(data);
      });

      manager.onTerritoryClaimed((data) => {
        updateState({ lastUpdate: new Date() });
        callbacksRef.current.onTerritoryClaimed?.(data);
      });

      manager.onLeaderboardUpdate((data) => {
        updateState({ lastUpdate: new Date() });
        callbacksRef.current.onLeaderboardUpdate?.(data);
      });

      manager.onTerritoryMapUpdate((data) => {
        updateState({ lastUpdate: new Date() });
        callbacksRef.current.onTerritoryMapUpdate?.(data);
      });

      wsManagerRef.current = manager;
      manager.connect();

    } catch (error) {
      updateState({ 
        error: error instanceof Error ? error.message : 'Failed to connect',
        isConnecting: false 
      });
    }
  }, [user?.id, token, updateState]);

  const disconnect = useCallback(() => {
    if (wsManagerRef.current) {
      wsManagerRef.current.disconnect();
      wsManagerRef.current = null;
    }
    updateState({ isConnected: false, isConnecting: false });
  }, [updateState]);

  // Auto-connect when user and token are available
  useEffect(() => {
    if (user?.id && token && !wsManagerRef.current) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [user?.id, token, connect, disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    manager: wsManagerRef.current,
  };
}

export function useGlobalTerritoryWebSocket(callbacks: Pick<TerritoryWebSocketCallbacks, 'onLeaderboardUpdate' | 'onTerritoryMapUpdate'> = {}) {
  const token = TokenManager.getAccessToken();
  const [state, setState] = useState<TerritoryWebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    lastUpdate: null,
  });

  const wsManagerRef = useRef<WebSocketManager | null>(null);
  const callbacksRef = useRef(callbacks);

  // Update callbacks ref when callbacks change
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  const updateState = useCallback((updates: Partial<TerritoryWebSocketState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const connect = useCallback(() => {
    if (!token || wsManagerRef.current) return;

    try {
      updateState({ isConnecting: true, error: null });

      const wsUrl = getGlobalTerritoryWsUrl(token);
      const manager = createWebSocketManager({
        url: wsUrl,
        token: token,
        userId: 'global',
      });

      // Set up event listeners
      manager.on('open', () => {
        updateState({ isConnected: true, isConnecting: false });
        
        // Subscribe to global territory events
        manager.subscribeTo([
          'global_territory_updates',
          'leaderboard_update',
          'territory_map_update'
        ]);
      });

      manager.on('close', () => {
        updateState({ isConnected: false, isConnecting: false });
      });

      manager.on('error', (error: any) => {
        updateState({ 
          error: error?.message || 'WebSocket connection error',
          isConnecting: false 
        });
      });

      // Global territory event handlers
      manager.onLeaderboardUpdate((data) => {
        updateState({ lastUpdate: new Date() });
        callbacksRef.current.onLeaderboardUpdate?.(data);
      });

      manager.onTerritoryMapUpdate((data) => {
        updateState({ lastUpdate: new Date() });
        callbacksRef.current.onTerritoryMapUpdate?.(data);
      });

      wsManagerRef.current = manager;
      manager.connect();

    } catch (error) {
      updateState({ 
        error: error instanceof Error ? error.message : 'Failed to connect',
        isConnecting: false 
      });
    }
  }, [token, updateState]);

  const disconnect = useCallback(() => {
    if (wsManagerRef.current) {
      wsManagerRef.current.disconnect();
      wsManagerRef.current = null;
    }
    updateState({ isConnected: false, isConnecting: false });
  }, [updateState]);

  // Auto-connect when token is available
  useEffect(() => {
    if (token && !wsManagerRef.current) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [token, connect, disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    manager: wsManagerRef.current,
  };
}