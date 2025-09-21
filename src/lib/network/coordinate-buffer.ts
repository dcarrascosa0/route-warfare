/**
 * Enhanced coordinate buffering system for network resilience and offline support.
 */

import { Coordinate } from '../api/types/common';

export interface BufferedCoordinate extends Coordinate {
  id: string;
  routeId: string;
  userId: string;
  bufferedAt: number;
  retryCount: number;
  lastRetryAt?: number;
  networkCondition: 'online' | 'offline' | 'slow';
  deviceType: 'mobile' | 'desktop' | 'unknown';
}

export interface BufferConfig {
  maxBufferSize: number;
  maxRetries: number;
  retryDelayMs: number;
  batchSize: number;
  compressionEnabled: boolean;
  adaptiveBatching: boolean;
}

export interface BufferStats {
  totalBuffered: number;
  pendingSync: number;
  failedCoordinates: number;
  lastSyncTime: number | null;
  bufferSizeBytes: number;
  compressionRatio: number;
}

export interface NetworkCondition {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string;
  effectiveType: string;
  downlink?: number;
  rtt?: number;
}

class CoordinateBuffer {
  private buffer: BufferedCoordinate[] = [];
  private config: BufferConfig;
  private syncInProgress = false;
  private listeners: ((stats: BufferStats) => void)[] = [];
  private storageKey = 'gps_coordinate_buffer';
  private statsKey = 'coordinate_buffer_stats';
  
  constructor(config: Partial<BufferConfig> = {}) {
    this.config = {
      maxBufferSize: 1000,
      maxRetries: 5,
      retryDelayMs: 2000,
      batchSize: 10,
      compressionEnabled: true,
      adaptiveBatching: true,
      ...config
    };
    
    this.loadFromStorage();
    this.setupPeriodicSync();
  }

  /**
   * Add coordinates to buffer with device and network context
   */
  addCoordinates(
    coordinates: Coordinate[],
    routeId: string,
    userId: string,
    networkCondition: NetworkCondition,
    deviceType: 'mobile' | 'desktop' | 'unknown' = 'unknown'
  ): void {
    const now = Date.now();
    
    const bufferedCoords: BufferedCoordinate[] = coordinates.map(coord => ({
      ...coord,
      id: `${now}-${Math.random().toString(36).substr(2, 9)}`,
      routeId,
      userId,
      bufferedAt: now,
      retryCount: 0,
      networkCondition: this.determineNetworkCondition(networkCondition),
      deviceType
    }));

    // Add to buffer
    this.buffer.push(...bufferedCoords);
    
    // Enforce buffer size limit
    if (this.buffer.length > this.config.maxBufferSize) {
      const excess = this.buffer.length - this.config.maxBufferSize;
      // Remove oldest coordinates first
      this.buffer.splice(0, excess);
    }

    this.saveToStorage();
    this.notifyListeners();

    // Try immediate sync if online and not slow
    if (networkCondition.isOnline && !networkCondition.isSlowConnection) {
      this.syncCoordinates();
    }
  }

  /**
   * Sync buffered coordinates with adaptive batching
   */
  async syncCoordinates(networkCondition?: NetworkCondition): Promise<void> {
    if (this.syncInProgress || this.buffer.length === 0) {
      return;
    }

    this.syncInProgress = true;
    
    try {
      const batchSize = this.calculateOptimalBatchSize(networkCondition);
      const batches = this.createBatches(batchSize);
      
      for (const batch of batches) {
        await this.syncBatch(batch, networkCondition);
      }
      
      this.updateLastSyncTime();
    } catch (error) {
      console.error('Coordinate sync failed:', error);
    } finally {
      this.syncInProgress = false;
      this.notifyListeners();
    }
  }

  /**
   * Calculate optimal batch size based on network conditions
   */
  private calculateOptimalBatchSize(networkCondition?: NetworkCondition): number {
    if (!this.config.adaptiveBatching || !networkCondition) {
      return this.config.batchSize;
    }

    // Adjust batch size based on network conditions
    if (!networkCondition.isOnline) {
      return 0; // Don't sync when offline
    }

    if (networkCondition.isSlowConnection) {
      return Math.max(1, Math.floor(this.config.batchSize / 3)); // Smaller batches for slow connections
    }

    if (networkCondition.effectiveType === '4g' || networkCondition.effectiveType === '5g') {
      return this.config.batchSize * 2; // Larger batches for fast connections
    }

    return this.config.batchSize;
  }

  /**
   * Create batches of coordinates for syncing
   */
  private createBatches(batchSize: number): BufferedCoordinate[][] {
    if (batchSize === 0) return [];
    
    const batches: BufferedCoordinate[][] = [];
    const pendingCoords = this.buffer.filter(coord => coord.retryCount < this.config.maxRetries);
    
    // Group by route and user for efficient API calls
    const groupedCoords = this.groupCoordinatesByRoute(pendingCoords);
    
    for (const [routeKey, coords] of Object.entries(groupedCoords)) {
      for (let i = 0; i < coords.length; i += batchSize) {
        batches.push(coords.slice(i, i + batchSize));
      }
    }
    
    return batches;
  }

  /**
   * Group coordinates by route for efficient processing
   */
  private groupCoordinatesByRoute(coordinates: BufferedCoordinate[]): Record<string, BufferedCoordinate[]> {
    return coordinates.reduce((groups, coord) => {
      const key = `${coord.routeId}-${coord.userId}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(coord);
      return groups;
    }, {} as Record<string, BufferedCoordinate[]>);
  }

  /**
   * Sync a batch of coordinates
   */
  private async syncBatch(batch: BufferedCoordinate[], networkCondition?: NetworkCondition): Promise<void> {
    if (batch.length === 0) return;

    const routeId = batch[0].routeId;
    const userId = batch[0].userId;
    
    try {
      // Convert buffered coordinates back to API coordinates
      const coordinates: Coordinate[] = batch.map(coord => ({
        latitude: coord.latitude,
        longitude: coord.longitude,
        altitude: coord.altitude,
        accuracy: coord.accuracy,
        speed: coord.speed,
        bearing: coord.bearing,
        timestamp: coord.timestamp
      }));

      // Attempt to sync via API
      const success = await this.sendCoordinatesToAPI(routeId, userId, coordinates, networkCondition);
      
      if (success) {
        // Remove successful coordinates from buffer
        this.removeCoordinatesFromBuffer(batch.map(c => c.id));
      } else {
        // Increment retry count for failed coordinates
        this.incrementRetryCount(batch.map(c => c.id));
      }
    } catch (error) {
      console.error('Batch sync failed:', error);
      this.incrementRetryCount(batch.map(c => c.id));
    }
  }

  /**
   * Send coordinates to API with retry logic
   */
  private async sendCoordinatesToAPI(
    routeId: string,
    userId: string,
    coordinates: Coordinate[],
    networkCondition?: NetworkCondition
  ): Promise<boolean> {
    try {
      // Import API dynamically to avoid circular dependencies
      const { GatewayAPI } = await import('../api');
      
      // Add timeout based on network conditions
      const timeout = this.calculateTimeout(networkCondition);
      
      const result = await Promise.race([
        GatewayAPI.addCoordinates(routeId, userId, coordinates),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), timeout)
        )
      ]);

      return result.ok;
    } catch (error) {
      console.error('API call failed:', error);
      return false;
    }
  }

  /**
   * Calculate request timeout based on network conditions
   */
  private calculateTimeout(networkCondition?: NetworkCondition): number {
    if (!networkCondition) return 30000; // 30 seconds default

    if (networkCondition.isSlowConnection) {
      return 60000; // 60 seconds for slow connections
    }

    if (networkCondition.effectiveType === '2g' || networkCondition.effectiveType === 'slow-2g') {
      return 90000; // 90 seconds for very slow connections
    }

    return 30000; // 30 seconds for normal connections
  }

  /**
   * Remove coordinates from buffer
   */
  private removeCoordinatesFromBuffer(coordinateIds: string[]): void {
    this.buffer = this.buffer.filter(coord => !coordinateIds.includes(coord.id));
    this.saveToStorage();
  }

  /**
   * Increment retry count for failed coordinates
   */
  private incrementRetryCount(coordinateIds: string[]): void {
    const now = Date.now();
    
    this.buffer.forEach(coord => {
      if (coordinateIds.includes(coord.id)) {
        coord.retryCount++;
        coord.lastRetryAt = now;
      }
    });
    
    // Remove coordinates that exceeded max retries
    this.buffer = this.buffer.filter(coord => coord.retryCount < this.config.maxRetries);
    
    this.saveToStorage();
  }

  /**
   * Determine network condition category
   */
  private determineNetworkCondition(networkCondition: NetworkCondition): 'online' | 'offline' | 'slow' {
    if (!networkCondition.isOnline) return 'offline';
    if (networkCondition.isSlowConnection) return 'slow';
    return 'online';
  }

  /**
   * Setup periodic sync
   */
  private setupPeriodicSync(): void {
    // Sync every 30 seconds when online
    setInterval(() => {
      if (navigator.onLine && this.buffer.length > 0) {
        this.syncCoordinates();
      }
    }, 30000);

    // Listen for network status changes
    window.addEventListener('online', () => {
      setTimeout(() => this.syncCoordinates(), 1000); // Delay to ensure connection is stable
    });

    // Listen for visibility change to sync when app becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && navigator.onLine && this.buffer.length > 0) {
        this.syncCoordinates();
      }
    });
  }

  /**
   * Load buffer from storage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.buffer = data.coordinates || [];
        
        // Clean up old coordinates (older than 24 hours)
        const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
        this.buffer = this.buffer.filter(coord => coord.bufferedAt > dayAgo);
      }
    } catch (error) {
      console.error('Failed to load coordinate buffer:', error);
      this.buffer = [];
    }
  }

  /**
   * Save buffer to storage with compression
   */
  private saveToStorage(): void {
    try {
      const data = {
        coordinates: this.buffer,
        lastUpdated: Date.now()
      };
      
      let serialized = JSON.stringify(data);
      
      // Simple compression for large buffers
      if (this.config.compressionEnabled && serialized.length > 10000) {
        serialized = this.compressData(serialized);
      }
      
      localStorage.setItem(this.storageKey, serialized);
    } catch (error) {
      console.error('Failed to save coordinate buffer:', error);
      
      // If storage is full, remove oldest coordinates and try again
      if (error.name === 'QuotaExceededError') {
        const removeCount = Math.floor(this.buffer.length * 0.3); // Remove 30%
        this.buffer.splice(0, removeCount);
        this.saveToStorage();
      }
    }
  }

  /**
   * Simple data compression (placeholder for more sophisticated compression)
   */
  private compressData(data: string): string {
    // This is a placeholder - in a real implementation, you might use
    // libraries like pako for gzip compression
    return data;
  }

  /**
   * Update last sync time
   */
  private updateLastSyncTime(): void {
    try {
      localStorage.setItem(`${this.statsKey}_last_sync`, Date.now().toString());
    } catch (error) {
      console.error('Failed to update last sync time:', error);
    }
  }

  /**
   * Get buffer statistics
   */
  getStats(): BufferStats {
    const totalBuffered = this.buffer.length;
    const pendingSync = this.buffer.filter(coord => coord.retryCount < this.config.maxRetries).length;
    const failedCoordinates = this.buffer.filter(coord => coord.retryCount >= this.config.maxRetries).length;
    
    let lastSyncTime: number | null = null;
    try {
      const stored = localStorage.getItem(`${this.statsKey}_last_sync`);
      lastSyncTime = stored ? parseInt(stored, 10) : null;
    } catch (error) {
      // Ignore error
    }

    const bufferSizeBytes = new Blob([JSON.stringify(this.buffer)]).size;
    
    return {
      totalBuffered,
      pendingSync,
      failedCoordinates,
      lastSyncTime,
      bufferSizeBytes,
      compressionRatio: 1.0 // Placeholder
    };
  }

  /**
   * Clear buffer
   */
  clearBuffer(): void {
    this.buffer = [];
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Get pending coordinates for a specific route
   */
  getPendingCoordinates(routeId: string, userId: string): BufferedCoordinate[] {
    return this.buffer.filter(coord => 
      coord.routeId === routeId && 
      coord.userId === userId &&
      coord.retryCount < this.config.maxRetries
    );
  }

  /**
   * Subscribe to buffer stats updates
   */
  subscribe(listener: (stats: BufferStats) => void): () => void {
    this.listeners.push(listener);
    
    // Immediately notify with current stats
    listener(this.getStats());
    
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of stats changes
   */
  private notifyListeners(): void {
    const stats = this.getStats();
    this.listeners.forEach(listener => listener(stats));
  }

  /**
   * Force sync all pending coordinates
   */
  async forceSyncAll(networkCondition?: NetworkCondition): Promise<void> {
    await this.syncCoordinates(networkCondition);
  }

  /**
   * Get buffer configuration
   */
  getConfig(): BufferConfig {
    return { ...this.config };
  }

  /**
   * Update buffer configuration
   */
  updateConfig(newConfig: Partial<BufferConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Global instance
let coordinateBuffer: CoordinateBuffer | null = null;

export const initializeCoordinateBuffer = (config?: Partial<BufferConfig>): CoordinateBuffer => {
  if (!coordinateBuffer) {
    coordinateBuffer = new CoordinateBuffer(config);
  }
  return coordinateBuffer;
};

export const getCoordinateBuffer = (): CoordinateBuffer | null => {
  return coordinateBuffer;
};

// React hook for using coordinate buffer
export const useCoordinateBuffer = () => {
  const buffer = getCoordinateBuffer();
  
  if (!buffer) {
    throw new Error('Coordinate buffer not initialized. Call initializeCoordinateBuffer first.');
  }

  return buffer;
};