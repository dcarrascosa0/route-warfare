/**
 * Mobile-specific data synchronization manager with network-aware batching and battery optimization.
 */

// Battery Manager interface for the Battery API
interface BatteryManager extends EventTarget {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
  addEventListener(type: 'chargingchange' | 'chargingtimechange' | 'dischargingtimechange' | 'levelchange', listener: EventListener): void;
  removeEventListener(type: 'chargingchange' | 'chargingtimechange' | 'dischargingtimechange' | 'levelchange', listener: EventListener): void;
}

export interface MobileSyncConfig {
  batchSize: {
    wifi: number;
    cellular: number;
    slow: number;
  };
  syncInterval: {
    wifi: number;
    cellular: number;
    slow: number;
    battery_low: number;
  };
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
    maxBackoffMs: number;
  };
  batteryOptimization: {
    enabled: boolean;
    lowBatteryThreshold: number;
    criticalBatteryThreshold: number;
  };
  dataCompression: {
    enabled: boolean;
    threshold: number; // bytes
  };
}

export interface SyncItem {
  id: string;
  type: 'coordinate' | 'route' | 'territory' | 'user_action';
  data: any;
  priority: 'high' | 'normal' | 'low';
  timestamp: number;
  retryCount: number;
  size: number; // estimated size in bytes
}

export interface SyncStats {
  totalItems: number;
  pendingItems: number;
  failedItems: number;
  syncedItems: number;
  totalDataSize: number;
  lastSyncTime: number | null;
  networkType: string;
  batteryLevel: number | null;
  syncRate: number; // items per minute
}

const DEFAULT_CONFIG: MobileSyncConfig = {
  batchSize: {
    wifi: 50,
    cellular: 20,
    slow: 5
  },
  syncInterval: {
    wifi: 5000,      // 5 seconds
    cellular: 15000, // 15 seconds
    slow: 30000,     // 30 seconds
    battery_low: 60000 // 1 minute
  },
  retryPolicy: {
    maxRetries: 5,
    backoffMultiplier: 2,
    maxBackoffMs: 300000 // 5 minutes
  },
  batteryOptimization: {
    enabled: true,
    lowBatteryThreshold: 0.2,
    criticalBatteryThreshold: 0.1
  },
  dataCompression: {
    enabled: true,
    threshold: 1024 // 1KB
  }
};

class MobileDataSyncManager {
  private config: MobileSyncConfig;
  private syncQueue: SyncItem[] = [];
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private listeners: ((stats: SyncStats) => void)[] = [];
  private stats: SyncStats;
  private batteryInfo: BatteryManager | null = null;
  private networkInfo: any = null;

  constructor(config: Partial<MobileSyncConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.stats = {
      totalItems: 0,
      pendingItems: 0,
      failedItems: 0,
      syncedItems: 0,
      totalDataSize: 0,
      lastSyncTime: null,
      networkType: 'unknown',
      batteryLevel: null,
      syncRate: 0
    };

    this.initializeMonitoring();
    this.loadPersistedQueue();
    this.startSyncLoop();
  }

  /**
   * Initialize battery and network monitoring
   */
  private async initializeMonitoring(): Promise<void> {
    // Battery monitoring
    try {
      if ('getBattery' in navigator) {
        this.batteryInfo = await (navigator as any).getBattery();
        this.updateBatteryStats();

        this.batteryInfo.addEventListener('levelchange', () => this.updateBatteryStats());
        this.batteryInfo.addEventListener('chargingchange', () => this.updateBatteryStats());
      }
    } catch (error) {
      console.warn('Battery API not available:', error);
    }

    // Network monitoring
    this.networkInfo = (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    if (this.networkInfo) {
      this.updateNetworkStats();
      this.networkInfo.addEventListener('change', () => this.updateNetworkStats());
    }

    // Online/offline events
    window.addEventListener('online', () => this.handleNetworkChange());
    window.addEventListener('offline', () => this.handleNetworkChange());
  }

  /**
   * Update battery statistics
   */
  private updateBatteryStats(): void {
    if (this.batteryInfo) {
      this.stats.batteryLevel = this.batteryInfo.level;
      this.notifyListeners();
    }
  }

  /**
   * Update network statistics
   */
  private updateNetworkStats(): void {
    if (this.networkInfo) {
      this.stats.networkType = this.networkInfo.effectiveType || this.networkInfo.type || 'unknown';
      this.notifyListeners();
    }
  }

  /**
   * Handle network status changes
   */
  private handleNetworkChange(): void {
    this.updateNetworkStats();

    if (navigator.onLine && this.syncQueue.length > 0) {
      // Trigger immediate sync when coming back online
      setTimeout(() => this.performSync(), 1000);
    }
  }

  /**
   * Add item to sync queue
   */
  addToQueue(item: Omit<SyncItem, 'id' | 'timestamp' | 'retryCount' | 'size'>): void {
    const syncItem: SyncItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
      size: this.estimateItemSize(item.data)
    };

    // Insert based on priority
    const insertIndex = this.findInsertIndex(syncItem.priority);
    this.syncQueue.splice(insertIndex, 0, syncItem);

    this.updateStats();
    this.persistQueue();
    this.notifyListeners();

    // Trigger immediate sync for high priority items if conditions are good
    if (syncItem.priority === 'high' && this.shouldSyncImmediately()) {
      this.performSync();
    }
  }

  /**
   * Find insertion index based on priority
   */
  private findInsertIndex(priority: 'high' | 'normal' | 'low'): number {
    const priorityOrder = { high: 3, normal: 2, low: 1 };
    const targetPriority = priorityOrder[priority];

    for (let i = 0; i < this.syncQueue.length; i++) {
      const itemPriority = priorityOrder[this.syncQueue[i].priority];
      if (targetPriority > itemPriority) {
        return i;
      }
    }

    return this.syncQueue.length;
  }

  /**
   * Estimate item size in bytes
   */
  private estimateItemSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return JSON.stringify(data).length * 2; // Rough estimate
    }
  }

  /**
   * Check if immediate sync should be triggered
   */
  private shouldSyncImmediately(): boolean {
    if (!navigator.onLine || this.isSyncing) {
      return false;
    }

    // Don't sync immediately if battery is critically low
    if (this.config.batteryOptimization.enabled &&
      this.batteryInfo &&
      this.batteryInfo.level < this.config.batteryOptimization.criticalBatteryThreshold) {
      return false;
    }

    // Check network conditions
    const networkType = this.getNetworkType();
    return networkType === 'wifi' || networkType === 'cellular';
  }

  /**
   * Get current network type
   */
  private getNetworkType(): 'wifi' | 'cellular' | 'slow' {
    if (!this.networkInfo) return 'cellular';

    const effectiveType = this.networkInfo.effectiveType;

    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      return 'slow';
    }

    if (this.networkInfo.type === 'wifi') {
      return 'wifi';
    }

    return 'cellular';
  }

  /**
   * Start sync loop
   */
  private startSyncLoop(): void {
    const scheduleNextSync = () => {
      if (this.syncInterval) {
        clearTimeout(this.syncInterval);
      }

      const interval = this.calculateSyncInterval();
      this.syncInterval = setTimeout(() => {
        if (navigator.onLine && this.syncQueue.length > 0) {
          this.performSync().finally(scheduleNextSync);
        } else {
          scheduleNextSync();
        }
      }, interval);
    };

    scheduleNextSync();
  }

  /**
   * Calculate appropriate sync interval based on conditions
   */
  private calculateSyncInterval(): number {
    const networkType = this.getNetworkType();
    let interval = this.config.syncInterval[networkType];

    // Adjust for battery level
    if (this.config.batteryOptimization.enabled && this.batteryInfo) {
      if (this.batteryInfo.level < this.config.batteryOptimization.criticalBatteryThreshold) {
        interval = this.config.syncInterval.battery_low * 2; // Even longer for critical battery
      } else if (this.batteryInfo.level < this.config.batteryOptimization.lowBatteryThreshold) {
        interval = this.config.syncInterval.battery_low;
      }
    }

    // Adjust based on queue size (more items = more frequent sync)
    if (this.syncQueue.length > 100) {
      interval = Math.max(interval * 0.5, 2000); // Minimum 2 seconds
    }

    return interval;
  }

  /**
   * Perform sync operation
   */
  private async performSync(): Promise<void> {
    if (this.isSyncing || !navigator.onLine || this.syncQueue.length === 0) {
      return;
    }

    this.isSyncing = true;
    const startTime = Date.now();

    try {
      const batchSize = this.calculateBatchSize();
      const batch = this.syncQueue.splice(0, batchSize);

      // Group items by type for efficient API calls
      const groupedItems = this.groupItemsByType(batch);

      const results = await Promise.allSettled(
        Object.entries(groupedItems).map(([type, items]) =>
          this.syncItemGroup(type, items)
        )
      );

      // Process results
      let successCount = 0;
      let failureCount = 0;

      results.forEach((result, index) => {
        const type = Object.keys(groupedItems)[index];
        const items = groupedItems[type];

        if (result.status === 'fulfilled') {
          successCount += items.length;
          this.stats.syncedItems += items.length;
        } else {
          failureCount += items.length;
          this.handleSyncFailure(items, result.reason);
        }
      });

      // Update sync rate
      const syncTime = (Date.now() - startTime) / 1000 / 60; // minutes
      this.stats.syncRate = successCount / Math.max(syncTime, 0.01);
      this.stats.lastSyncTime = Date.now();

      console.log(`Sync completed: ${successCount} success, ${failureCount} failed`);

    } catch (error) {
      console.error('Sync operation failed:', error);
    } finally {
      this.isSyncing = false;
      this.updateStats();
      this.persistQueue();
      this.notifyListeners();
    }
  }

  /**
   * Calculate batch size based on network conditions
   */
  private calculateBatchSize(): number {
    const networkType = this.getNetworkType();
    let batchSize = this.config.batchSize[networkType];

    // Reduce batch size for low battery
    if (this.config.batteryOptimization.enabled && this.batteryInfo) {
      if (this.batteryInfo.level < this.config.batteryOptimization.lowBatteryThreshold) {
        batchSize = Math.floor(batchSize * 0.5);
      }
    }

    return Math.max(batchSize, 1);
  }

  /**
   * Group items by type for efficient processing
   */
  private groupItemsByType(items: SyncItem[]): Record<string, SyncItem[]> {
    return items.reduce((groups, item) => {
      if (!groups[item.type]) {
        groups[item.type] = [];
      }
      groups[item.type].push(item);
      return groups;
    }, {} as Record<string, SyncItem[]>);
  }

  /**
   * Sync a group of items of the same type
   */
  private async syncItemGroup(type: string, items: SyncItem[]): Promise<void> {
    // Compress data if enabled and threshold is met
    let data = items.map(item => item.data);
    const totalSize = items.reduce((sum, item) => sum + item.size, 0);

    if (this.config.dataCompression.enabled && totalSize > this.config.dataCompression.threshold) {
      data = this.compressData(data);
    }

    // Make API call based on type
    switch (type) {
      case 'coordinate':
        await this.syncCoordinates(data);
        break;
      case 'route':
        await this.syncRoutes(data);
        break;
      case 'territory':
        await this.syncTerritories(data);
        break;
      case 'user_action':
        await this.syncUserActions(data);
        break;
      default:
        throw new Error(`Unknown sync type: ${type}`);
    }
  }

  /**
   * Compress data (placeholder for actual compression)
   */
  private compressData(data: any[]): any[] {
    // In a real implementation, you might use libraries like pako for gzip compression
    // For now, we'll just return the data as-is
    return data;
  }

  /**
   * Sync coordinates
   */
  private async syncCoordinates(coordinates: any[]): Promise<void> {
    // TODO: Implement coordinate syncing when route client is available
    console.log('Syncing coordinates:', coordinates.length);

    // Placeholder implementation - in real implementation, this would:
    // 1. Group coordinates by route
    // 2. Call route API to add coordinates
    // 3. Handle API responses and errors

    // For now, simulate successful sync
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Sync routes
   */
  private async syncRoutes(routes: any[]): Promise<void> {
    // TODO: Implement route syncing when route update API is available
    console.log('Syncing routes:', routes.length);

    // Placeholder implementation - in real implementation, this would:
    // 1. Call route API to update route data
    // 2. Handle route completion, GPS coordinates, etc.
    // 3. Handle API responses and errors

    // For now, simulate successful sync
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Sync territories
   */
  private async syncTerritories(territories: any[]): Promise<void> {
    // TODO: Implement territory syncing when territory update API is available
    console.log('Syncing territories:', territories.length);

    // Placeholder implementation - in real implementation, this would:
    // 1. Call territory API to update territory claims
    // 2. Handle territory ownership changes
    // 3. Handle API responses and errors

    // For now, simulate successful sync
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Sync user actions
   */
  private async syncUserActions(actions: any[]): Promise<void> {
    // TODO: Implement user action syncing when user action API is available
    console.log('Syncing user actions:', actions.length);

    // Placeholder implementation - in real implementation, this would:
    // 1. Group actions by type (profile updates, preferences, etc.)
    // 2. Call appropriate user API endpoints
    // 3. Handle API responses and errors

    // For now, simulate successful sync
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Handle sync failures
   */
  private handleSyncFailure(items: SyncItem[], error: any): void {
    items.forEach(item => {
      item.retryCount++;

      if (item.retryCount < this.config.retryPolicy.maxRetries) {
        // Re-queue for retry with exponential backoff
        const delay = Math.min(
          this.config.retryPolicy.backoffMultiplier ** item.retryCount * 1000,
          this.config.retryPolicy.maxBackoffMs
        );

        setTimeout(() => {
          this.syncQueue.unshift(item); // Add to front for priority
          this.updateStats();
          this.persistQueue();
        }, delay);
      } else {
        // Max retries exceeded, mark as failed
        this.stats.failedItems++;
        console.error(`Item ${item.id} failed after ${item.retryCount} retries:`, error);
      }
    });
  }

  /**
   * Update statistics
   */
  private updateStats(): void {
    this.stats.totalItems = this.stats.syncedItems + this.stats.failedItems + this.syncQueue.length;
    this.stats.pendingItems = this.syncQueue.length;
    this.stats.totalDataSize = this.syncQueue.reduce((sum, item) => sum + item.size, 0);
  }

  /**
   * Persist queue to localStorage
   */
  private persistQueue(): void {
    try {
      localStorage.setItem('mobile_sync_queue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Failed to persist sync queue:', error);
    }
  }

  /**
   * Load persisted queue from localStorage
   */
  private loadPersistedQueue(): void {
    try {
      const stored = localStorage.getItem('mobile_sync_queue');
      if (stored) {
        this.syncQueue = JSON.parse(stored);
        this.updateStats();
      }
    } catch (error) {
      console.error('Failed to load persisted sync queue:', error);
      this.syncQueue = [];
    }
  }

  /**
   * Get current statistics
   */
  getStats(): SyncStats {
    return { ...this.stats };
  }

  /**
   * Clear sync queue
   */
  clearQueue(): void {
    this.syncQueue = [];
    this.updateStats();
    this.persistQueue();
    this.notifyListeners();
  }

  /**
   * Force immediate sync
   */
  async forceSync(): Promise<void> {
    if (navigator.onLine) {
      await this.performSync();
    }
  }

  /**
   * Subscribe to stats updates
   */
  subscribe(listener: (stats: SyncStats) => void): () => void {
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
   * Notify all listeners
   */
  private notifyListeners(): void {
    const stats = this.getStats();
    this.listeners.forEach(listener => listener(stats));
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<MobileSyncConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.syncInterval) {
      clearTimeout(this.syncInterval);
    }

    if (this.batteryInfo) {
      this.batteryInfo.removeEventListener('levelchange', () => this.updateBatteryStats());
      this.batteryInfo.removeEventListener('chargingchange', () => this.updateBatteryStats());
    }

    if (this.networkInfo) {
      this.networkInfo.removeEventListener('change', () => this.updateNetworkStats());
    }

    window.removeEventListener('online', () => this.handleNetworkChange());
    window.removeEventListener('offline', () => this.handleNetworkChange());

    this.listeners = [];
  }
}

// Global instance
let mobileDataSyncManager: MobileDataSyncManager | null = null;

export const initializeMobileDataSync = (config?: Partial<MobileSyncConfig>): MobileDataSyncManager => {
  if (!mobileDataSyncManager) {
    mobileDataSyncManager = new MobileDataSyncManager(config);
  }
  return mobileDataSyncManager;
};

export const getMobileDataSyncManager = (): MobileDataSyncManager | null => {
  return mobileDataSyncManager;
};

// React hook for using mobile data sync
export const useMobileDataSync = () => {
  const manager = getMobileDataSyncManager();

  if (!manager) {
    throw new Error('Mobile data sync manager not initialized. Call initializeMobileDataSync first.');
  }

  return manager;
};