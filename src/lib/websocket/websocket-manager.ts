/**
 * Enhanced WebSocket connection manager with automatic reconnection,
 * exponential backoff, and state synchronization for route-territory integration.
 */

class EventEmitter {
  private listeners: { [key: string]: Function[] } = {};

  on(event: string, fn: Function) {
    this.listeners[event] = this.listeners[event] || [];
    this.listeners[event].push(fn);
  }

  emit(event: string, ...args: any[]) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(fn => fn(...args));
    }
  }

  removeListener(event: string, fn: Function) {
    let lis = this.listeners[event];
    if (!lis) return;
    for (let i = lis.length - 1; i >= 0; i--) {
      if (lis[i] === fn) {
        lis.splice(i, 1);
      }
    }
  }
}

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp?: string;
}

export interface TerritoryWebSocketMessage extends WebSocketMessage {
  type: 'territory_preview_update' | 'territory_claimed' | 'leaderboard_update' | 'territory_map_update' | 'global_territory_updates';
  data: {
    user_id?: string;
    preview?: any;
    territory?: any;
    leaderboard?: any;
    affected_area?: any;
    timestamp: string;
  };
}

export interface ConnectionConfig {
  url: string;
  token: string;
  userId: string;
  maxReconnectAttempts?: number;
  initialReconnectDelay?: number;
  maxReconnectDelay?: number;
  reconnectBackoffFactor?: number;
  heartbeatInterval?: number;
  connectionTimeout?: number;
}

export interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  reconnectAttempts: number;
  lastConnectedAt?: Date;
  lastDisconnectedAt?: Date;
  connectionDuration: number;
  totalReconnects: number;
  latency?: number;
}

export class WebSocketManager extends EventEmitter {
  private config: ConnectionConfig;
  private ws: WebSocket | null = null;
  private state: ConnectionState;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private lastPong: number = 0;

  constructor(config: ConnectionConfig) {
    super();
    this.config = {
      ...config,
      maxReconnectAttempts: config.maxReconnectAttempts ?? 10,
      initialReconnectDelay: config.initialReconnectDelay ?? 1000,
      maxReconnectDelay: config.maxReconnectDelay ?? 30000,
      reconnectBackoffFactor: config.reconnectBackoffFactor ?? 1.5,
    };
    this.state = {
      isConnected: false,
      isConnecting: false,
      reconnectAttempts: 0,
      connectionDuration: 0,
      totalReconnects: 0,
    };
  }

  connect(): void {
    if (this.ws || this.state.isConnecting) return;

    this.state.isConnecting = true;
    this.emit('statechange', this.state);

    const url = `${this.config.url}?token=${this.config.token}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.state.isConnected = true;
      this.state.isConnecting = false;
      this.state.reconnectAttempts = 0;
      this.state.lastConnectedAt = new Date();
      this.emit('open');
      this.emit('statechange', this.state);
      this.startPing();
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'pong' && message.data) {
        this.lastPong = Date.now();
        this.state.latency = this.lastPong - (message.data.timestamp || this.lastPong);
        this.emit('statechange', this.state);
      }
      this.emit('message', message);
    };

    this.ws.onclose = () => {
      this.ws = null;
      this.state.isConnected = false;
      this.state.isConnecting = false;
      this.state.lastDisconnectedAt = new Date();
      this.emit('close');
      this.emit('statechange', this.state);
      this.stopPing();
      this.reconnect();
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      this.emit('error', error);
    };
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopPing();
    if (this.ws) {
      this.ws.close();
    }
  }

  send(message: WebSocketMessage): void {
    if (this.ws && this.state.isConnected) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private startPing(): void {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.state.isConnected) {
        this.ws.send(JSON.stringify({ type: 'ping', data: { timestamp: Date.now() } }));
      }
    }, 5000);
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private reconnect(): void {
    if (this.state.reconnectAttempts < (this.config.maxReconnectAttempts ?? 10)) {
      this.state.reconnectAttempts++;
      const delay = Math.min(
        this.config.initialReconnectDelay! * Math.pow(this.config.reconnectBackoffFactor!, this.state.reconnectAttempts),
        this.config.maxReconnectDelay!
      );
      this.reconnectTimer = setTimeout(() => {
        this.state.totalReconnects++;
        this.connect();
      }, delay);
      this.emit('statechange', this.state);
    } else {
      console.error("WebSocket max reconnect attempts reached.");
    }
  }

  getState(): ConnectionState {
    return this.state;
  }

  // Territory-specific WebSocket methods
  subscribeTo(eventTypes: string[]): void {
    if (this.ws && this.state.isConnected) {
      this.send({
        type: 'subscribe',
        data: { event_types: eventTypes },
        timestamp: new Date().toISOString()
      });
    }
  }

  unsubscribeFrom(eventTypes: string[]): void {
    if (this.ws && this.state.isConnected) {
      this.send({
        type: 'unsubscribe',
        data: { event_types: eventTypes },
        timestamp: new Date().toISOString()
      });
    }
  }

  // Territory event handlers
  onTerritoryPreviewUpdate(callback: (data: any) => void): void {
    this.on('message', (message: WebSocketMessage) => {
      if (message.type === 'territory_preview_update') {
        callback(message.data);
      }
    });
  }

  onTerritoryClaimed(callback: (data: any) => void): void {
    this.on('message', (message: WebSocketMessage) => {
      if (message.type === 'territory_claimed') {
        callback(message.data);
      }
    });
  }

  onLeaderboardUpdate(callback: (data: any) => void): void {
    this.on('message', (message: WebSocketMessage) => {
      if (message.type === 'leaderboard_update') {
        callback(message.data);
      }
    });
  }

  onTerritoryMapUpdate(callback: (data: any) => void): void {
    this.on('message', (message: WebSocketMessage) => {
      if (message.type === 'territory_map_update') {
        callback(message.data);
      }
    });
  }
}

export const createWebSocketManager = (config: ConnectionConfig): WebSocketManager => {
  return new WebSocketManager(config);
};