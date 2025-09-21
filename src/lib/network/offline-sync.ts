import { QueryClient } from '@tanstack/react-query';
import { GatewayAPI } from '../api';
import { queryKeys } from '../query';

// Types for offline operations
export type OfflineOperation = {
  id: string;
  type: 'ADD_COORDINATES' | 'COMPLETE_ROUTE' | 'START_ROUTE' | 'CLAIM_TERRITORY';
  data: any;
  timestamp: number;
  userId: string;
  retryCount: number;
};

export type SyncStatus = {
  isOnline: boolean;
  isSyncing: boolean;
  pendingOperations: number;
  lastSyncTime: number | null;
};

class OfflineSyncManager {
  private queryClient: QueryClient;
  private isOnline = navigator.onLine;
  private isSyncing = false;
  private pendingOperations: OfflineOperation[] = [];
  private syncListeners: ((status: SyncStatus) => void)[] = [];
  private maxRetries = 3;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
    this.loadPendingOperations();
    this.setupEventListeners();
    this.startPeriodicSync();
  }

  private setupEventListeners() {
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Listen for visibility change to sync when app becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.syncPendingOperations();
      }
    });
  }

  private handleOnline() {
    this.isOnline = true;
    this.notifyListeners();
    this.syncPendingOperations();
  }

  private handleOffline() {
    this.isOnline = false;
    this.notifyListeners();
  }

  private startPeriodicSync() {
    // Sync every 30 seconds when online
    this.syncInterval = setInterval(() => {
      if (this.isOnline && this.pendingOperations.length > 0) {
        this.syncPendingOperations();
      }
    }, 30000);
  }

  private loadPendingOperations() {
    try {
      const stored = localStorage.getItem('offline_operations');
      if (stored) {
        this.pendingOperations = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load pending operations:', error);
      this.pendingOperations = [];
    }
  }

  private savePendingOperations() {
    try {
      localStorage.setItem('offline_operations', JSON.stringify(this.pendingOperations));
    } catch (error) {
      console.error('Failed to save pending operations:', error);
    }
  }

  private notifyListeners() {
    const status: SyncStatus = {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingOperations: this.pendingOperations.length,
      lastSyncTime: this.getLastSyncTime(),
    };

    this.syncListeners.forEach(listener => listener(status));
  }

  private getLastSyncTime(): number | null {
    try {
      const stored = localStorage.getItem('last_sync_time');
      return stored ? parseInt(stored, 10) : null;
    } catch {
      return null;
    }
  }

  private setLastSyncTime(time: number) {
    try {
      localStorage.setItem('last_sync_time', time.toString());
    } catch (error) {
      console.error('Failed to save last sync time:', error);
    }
  }

  // Public methods
  addOfflineOperation(operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retryCount'>) {
    const fullOperation: OfflineOperation = {
      ...operation,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.pendingOperations.push(fullOperation);
    this.savePendingOperations();
    this.notifyListeners();

    // Try to sync immediately if online
    if (this.isOnline) {
      this.syncPendingOperations();
    }
  }

  async syncPendingOperations(): Promise<void> {
    if (!this.isOnline || this.isSyncing || this.pendingOperations.length === 0) {
      return;
    }

    this.isSyncing = true;
    this.notifyListeners();

    const operationsToSync = [...this.pendingOperations];
    const successfulOperations: string[] = [];

    for (const operation of operationsToSync) {
      try {
        await this.executeOperation(operation);
        successfulOperations.push(operation.id);
      } catch (error) {
        console.error('Failed to sync operation:', operation, error);

        // Increment retry count
        operation.retryCount++;

        // Remove operation if max retries exceeded
        if (operation.retryCount >= this.maxRetries) {
          console.warn('Max retries exceeded for operation:', operation);
          successfulOperations.push(operation.id); // Remove from pending
        }
      }
    }

    // Remove successful operations
    this.pendingOperations = this.pendingOperations.filter(
      op => !successfulOperations.includes(op.id)
    );

    this.savePendingOperations();
    this.setLastSyncTime(Date.now());
    this.isSyncing = false;
    this.notifyListeners();

    // Invalidate relevant queries after successful sync
    if (successfulOperations.length > 0) {
      this.invalidateQueriesAfterSync(operationsToSync.filter(op =>
        successfulOperations.includes(op.id)
      ));
    }
  }

  private async executeOperation(operation: OfflineOperation): Promise<void> {
    switch (operation.type) {
      case 'ADD_COORDINATES':
        const coordResult = await GatewayAPI.addCoordinates(
          operation.data.routeId,
          operation.userId,
          operation.data.coordinates
        );
        if (!coordResult.ok) throw coordResult;
        break;

      case 'COMPLETE_ROUTE':
        const completeResult = await GatewayAPI.completeRoute(
          operation.data.routeId,
          operation.userId,
          operation.data.completion
        );
        if (!completeResult.ok) throw completeResult;
        break;

      case 'START_ROUTE':
        const startResult = await GatewayAPI.startRoute(
          operation.userId,
          operation.data
        );
        if (!startResult.ok) throw startResult;
        break;

      case 'CLAIM_TERRITORY':
        const claimResult = await GatewayAPI.claimTerritoryFromRoute(
          operation.userId,
          operation.data
        );
        if (!claimResult.ok) throw claimResult;
        break;

      default:
        throw new Error(`Unknown operation type: ${(operation as any).type}`);
    }
  }

  private invalidateQueriesAfterSync(operations: OfflineOperation[]) {
    const userIds = new Set(operations.map(op => op.userId));

    userIds.forEach(userId => {
      // Invalidate user-specific queries
      this.queryClient.invalidateQueries({ queryKey: queryKeys.routesForUser(userId) });
      this.queryClient.invalidateQueries({ queryKey: queryKeys.activeRoute(userId) });
      this.queryClient.invalidateQueries({ queryKey: queryKeys.userTerritories(userId) });
      this.queryClient.invalidateQueries({ queryKey: queryKeys.userProfile(userId) });
      this.queryClient.invalidateQueries({ queryKey: queryKeys.userStatistics(userId) });
    });

    // Invalidate global queries
    this.queryClient.invalidateQueries({ queryKey: queryKeys.territoriesMap() });
    this.queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
  }

  // Cache management for offline access
  async cacheEssentialData(userId: string): Promise<void> {
    if (!this.isOnline) return;

    try {
      // Pre-fetch and cache essential data
      await Promise.allSettled([
        this.queryClient.prefetchQuery({
          queryKey: queryKeys.userProfile(userId),
          queryFn: async () => {
            const result = await GatewayAPI.userProfile(userId);
            if (!result.ok) throw result;
            return result.data;
          },
        }),
        this.queryClient.prefetchQuery({
          queryKey: queryKeys.userTerritories(userId),
          queryFn: async () => {
            const result = await GatewayAPI.getUserTerritories(userId);
            if (!result.ok) throw result;
            return result.data;
          },
        }),
        this.queryClient.prefetchQuery({
          queryKey: queryKeys.routesForUser(userId, 10),
          queryFn: async () => {
            const result = await GatewayAPI.routesForUser(userId, 10);
            if (!result.ok) throw result;
            return result.data;
          },
        }),
      ]);
    } catch (error) {
      console.error('Failed to cache essential data:', error);
    }
  }

  // Subscription methods
  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.syncListeners.push(listener);

    // Immediately notify with current status
    listener({
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingOperations: this.pendingOperations.length,
      lastSyncTime: this.getLastSyncTime(),
    });

    // Return unsubscribe function
    return () => {
      const index = this.syncListeners.indexOf(listener);
      if (index > -1) {
        this.syncListeners.splice(index, 1);
      }
    };
  }

  getStatus(): SyncStatus {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingOperations: this.pendingOperations.length,
      lastSyncTime: this.getLastSyncTime(),
    };
  }

  // Cleanup
  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));

    this.syncListeners = [];
  }
}

// Global instance
let offlineSyncManager: OfflineSyncManager | null = null;

export const initializeOfflineSync = (queryClient: QueryClient): OfflineSyncManager => {
  if (!offlineSyncManager) {
    offlineSyncManager = new OfflineSyncManager(queryClient);
  }
  return offlineSyncManager;
};

export const getOfflineSyncManager = (): OfflineSyncManager | null => {
  return offlineSyncManager;
};

// React hook for using offline sync
export const useOfflineSync = () => {
  const manager = getOfflineSyncManager();

  if (!manager) {
    throw new Error('Offline sync manager not initialized. Call initializeOfflineSync first.');
  }

  return manager;
};