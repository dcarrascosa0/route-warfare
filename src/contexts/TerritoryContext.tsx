import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Territory, TerritoryEvent } from '@/types/territory';
import { getNotificationsWsUrl } from '@/lib/api';
import { toast } from 'sonner';

interface TerritoryContextType {
  territories: Territory[];
  setTerritories: React.Dispatch<React.SetStateAction<Territory[]>>;
  isConnected: boolean;
  connectionError: string | null;
  lastUpdate: Date | null;
  isLoading: boolean;
  error: string | null;
  updateTerritory: (territory: Territory) => void;
  removeTerritory: (territoryId: string) => void;
  addTerritory: (territory: Territory) => void;
  reconnect: () => void;
}

const TerritoryContext = createContext<TerritoryContextType | undefined>(undefined);

interface TerritoryProviderProps {
  children: React.ReactNode;
  userId?: string;
  token?: string;
  enableWebSocket?: boolean;
}

export const TerritoryProvider: React.FC<TerritoryProviderProps> = ({
  children,
  userId,
  token,
  enableWebSocket = true,
}) => {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 1000;

  // Territory management functions
  const updateTerritory = useCallback((updatedTerritory: Territory) => {
    setTerritories(prev => 
      prev.map(territory => 
        territory.id === updatedTerritory.id ? updatedTerritory : territory
      )
    );
    setLastUpdate(new Date());
  }, []);

  const removeTerritory = useCallback((territoryId: string) => {
    setTerritories(prev => prev.filter(territory => territory.id !== territoryId));
    setLastUpdate(new Date());
  }, []);

  const addTerritory = useCallback((newTerritory: Territory) => {
    setTerritories(prev => {
      // Check if territory already exists
      const exists = prev.some(territory => territory.id === newTerritory.id);
      if (exists) {
        return prev.map(territory => 
          territory.id === newTerritory.id ? newTerritory : territory
        );
      }
      return [...prev, newTerritory];
    });
    setLastUpdate(new Date());
  }, []);

  // Enhanced WebSocket event handlers with better error handling and notifications
  const handleWebSocketMessage = useCallback((event: MessageEvent) => {
    try {
      const data: TerritoryEvent = JSON.parse(event.data);
      
      // Validate event data
      if (!data.type || !data.territory) {
        console.warn('Invalid territory event data:', data);
        return;
      }

      // Update last activity timestamp
      setLastUpdate(new Date());
      
      switch (data.type) {
        case 'territory_claimed':
          addTerritory(data.territory);
          
          // Enhanced notifications with territory details
          if (data.territory.owner_id === userId) {
            toast.success('Territory Claimed!', {
              description: `You successfully claimed ${data.territory.area_km2.toFixed(2)} km² of territory`,
              duration: 5000,
            });
          } else {
            toast.info('New Territory Claimed', {
              description: `${data.username || 'A player'} claimed a ${data.territory.area_km2.toFixed(2)} km² territory`,
              duration: 3000,
            });
          }
          break;

        case 'territory_attacked':
          // Update territory status to contested
          const attackedTerritory = { 
            ...data.territory, 
            status: 'contested' as const,
            last_activity: new Date().toISOString(),
            contest_count: (data.territory.contest_count || 0) + 1
          };
          updateTerritory(attackedTerritory);
          
          if (data.territory.owner_id === userId) {
            toast.error('Territory Under Attack!', {
              description: `Your ${data.territory.area_km2.toFixed(2)} km² territory "${data.territory.name || 'Unknown'}" is being contested by ${data.username || 'another player'}`,
              duration: 8000,
            });
          } else {
            toast.info('Territory Battle Started', {
              description: `Territory "${data.territory.name || 'Unknown'}" is now contested`,
              duration: 4000,
            });
          }
          break;

        case 'territory_lost':
          // Update territory with new owner
          updateTerritory(data.territory);
          
          if (data.territory.owner_id === userId) {
            // This shouldn't happen if we lost the territory, but handle gracefully
            console.warn('Received territory_lost event but territory owner is still current user');
          } else {
            toast.error('Territory Lost!', {
              description: `You lost control of "${data.territory.name || 'Unknown'}" (${data.territory.area_km2.toFixed(2)} km²) to ${data.username || 'another player'}`,
              duration: 8000,
            });
          }
          break;

        case 'territory_contested':
          // Add or update contested territory
          const contestedTerritory = {
            ...data.territory,
            status: 'contested' as const,
            last_activity: new Date().toISOString(),
            contest_count: (data.territory.contest_count || 0) + 1
          };
          addTerritory(contestedTerritory);
          
          if (data.territory.owner_id === userId) {
            toast.warning('Territory Contested!', {
              description: `Your territory "${data.territory.name || 'Unknown'}" is being challenged by ${data.username || 'another player'}`,
              duration: 6000,
            });
          } else {
            toast.info('Territory Contest', {
              description: `Territory "${data.territory.name || 'Unknown'}" is now being contested`,
              duration: 4000,
            });
          }
          break;

        case 'territory_ownership_changed':
          // Handle ownership changes (different from territory_lost)
          updateTerritory(data.territory);
          
          if (data.territory.owner_id === userId) {
            toast.success('Territory Acquired!', {
              description: `You gained control of "${data.territory.name || 'Unknown'}" (${data.territory.area_km2.toFixed(2)} km²)`,
              duration: 6000,
            });
          } else {
            toast.info('Territory Ownership Changed', {
              description: `"${data.territory.name || 'Unknown'}" is now controlled by ${data.username || 'another player'}`,
              duration: 4000,
            });
          }
          break;

        case 'territory_conflict_resolved':
          // Handle conflict resolution
          updateTerritory(data.territory);
          
          if (data.territory.owner_id === userId) {
            toast.success('Conflict Resolved - Victory!', {
              description: `You successfully defended "${data.territory.name || 'Unknown'}"`,
              duration: 6000,
            });
          } else {
            toast.info('Territory Conflict Resolved', {
              description: `Conflict for "${data.territory.name || 'Unknown'}" has been resolved`,
              duration: 4000,
            });
          }
          break;

        default:
          console.log('Unknown territory event type:', data.type, data);
          // Still emit the event for custom handlers
          break;
      }

      // Emit custom event for external listeners
      window.dispatchEvent(new CustomEvent('territory-update', {
        detail: { type: data.type, territory: data.territory, username: data.username }
      }));

    } catch (error) {
      console.error('Error parsing WebSocket territory message:', error, event.data);
      setConnectionError('Failed to process territory update');
    }
  }, [userId, addTerritory, updateTerritory]);

  const handleWebSocketOpen = useCallback(() => {
    setIsConnected(true);
    setConnectionError(null);
    reconnectAttemptsRef.current = 0;
    console.log('Territory WebSocket connected');
  }, []);

  const handleWebSocketClose = useCallback((event: CloseEvent) => {
    setIsConnected(false);
    wsRef.current = null;
    
    if (!event.wasClean && enableWebSocket && userId && token) {
      // Attempt to reconnect if the connection was not closed intentionally
      const attempts = reconnectAttemptsRef.current;
      if (attempts < maxReconnectAttempts) {
        const delay = baseReconnectDelay * Math.pow(2, attempts);
        setConnectionError(`Connection lost. Reconnecting in ${delay / 1000}s...`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current++;
          connectWebSocket();
        }, delay);
      } else {
        setConnectionError('Connection failed. Please refresh the page.');
      }
    }
  }, [enableWebSocket, userId, token]);

  const handleWebSocketError = useCallback((error: Event) => {
    console.error('Territory WebSocket error:', error);
    setConnectionError('WebSocket connection error');
  }, []);

  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    if (!enableWebSocket || !userId || !token) {
      return;
    }

    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      const wsUrl = getNotificationsWsUrl(userId, token);
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = handleWebSocketOpen;
      ws.onmessage = handleWebSocketMessage;
      ws.onclose = handleWebSocketClose;
      ws.onerror = handleWebSocketError;
      
      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionError('Failed to establish WebSocket connection');
    }
  }, [
    enableWebSocket,
    userId,
    token,
    handleWebSocketOpen,
    handleWebSocketMessage,
    handleWebSocketClose,
    handleWebSocketError,
  ]);

  const reconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    reconnectAttemptsRef.current = 0;
    setConnectionError(null);
    connectWebSocket();
  }, [connectWebSocket]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (enableWebSocket && userId && token) {
      connectWebSocket();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket, enableWebSocket, userId, token]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const value: TerritoryContextType = {
    territories,
    setTerritories,
    isConnected,
    connectionError,
    lastUpdate,
    isLoading,
    error,
    updateTerritory,
    removeTerritory,
    addTerritory,
    reconnect,
  };

  return (
    <TerritoryContext.Provider value={value}>
      {children}
    </TerritoryContext.Provider>
  );
};

export const useTerritoryContext = (): TerritoryContextType => {
  const context = useContext(TerritoryContext);
  if (context === undefined) {
    throw new Error('useTerritoryContext must be used within a TerritoryProvider');
  }
  return context;
};