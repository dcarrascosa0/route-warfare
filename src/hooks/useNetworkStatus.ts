import { useState, useEffect } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string;
  effectiveType: string;
}

export const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(() => ({
    isOnline: navigator.onLine,
    isSlowConnection: false,
    connectionType: 'unknown',
    effectiveType: 'unknown',
  }));

  useEffect(() => {
    const connection = (navigator as unknown as { connection: { effectiveType: string, type: string, onchange: (() => void) | null } }).connection;
    if (!connection) {
      return;
    }

    const updateStatus = () => {
      setNetworkStatus({
        isOnline: navigator.onLine,
        isSlowConnection: connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g',
        connectionType: connection.type,
        effectiveType: connection.effectiveType,
      });
    };

    updateStatus();

    connection.onchange = updateStatus;
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    return () => {
      connection.onchange = null;
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  return networkStatus;
};