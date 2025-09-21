import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { initializeOfflineSync, getOfflineSyncManager, SyncStatus } from '@/lib/network/offline-sync';
import { useAuth } from '@/contexts/AuthContext';

export const useOfflineSync = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    pendingOperations: 0,
    lastSyncTime: null,
  });

  useEffect(() => {
    // Initialize offline sync manager
    const manager = initializeOfflineSync(queryClient);
    
    // Subscribe to status updates
    const unsubscribe = manager.subscribe(setSyncStatus);

    // Cache essential data when user is authenticated and online
    if (user?.id && navigator.onLine) {
      manager.cacheEssentialData(user.id);
    }

    return unsubscribe;
  }, [queryClient, user?.id]);

  const addOfflineOperation = (operation: {
    type: 'ADD_COORDINATES' | 'COMPLETE_ROUTE' | 'START_ROUTE' | 'CLAIM_TERRITORY';
    data: any;
    userId: string;
  }) => {
    const manager = getOfflineSyncManager();
    if (manager) {
      manager.addOfflineOperation(operation);
    }
  };

  const forcSync = async () => {
    const manager = getOfflineSyncManager();
    if (manager) {
      await manager.syncPendingOperations();
    }
  };

  return {
    syncStatus,
    addOfflineOperation,
    forcSync,
    isOnline: syncStatus.isOnline,
    isSyncing: syncStatus.isSyncing,
    hasPendingOperations: syncStatus.pendingOperations > 0,
  };
};