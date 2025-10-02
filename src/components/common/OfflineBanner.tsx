import { useEffect, useState } from "react";
import { WifiOff, RefreshCw } from "lucide-react";

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pending, setPending] = useState<number>(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    let unsubscribe: (() => void) | undefined;
    import('@/lib/network/offline-sync').then(({ getOfflineSyncManager }) => {
      const mgr = getOfflineSyncManager();
      if (!mgr) return;
      unsubscribe = mgr.subscribe((status) => {
        setIsOnline(status.isOnline);
        setIsSyncing(status.isSyncing);
        setPending(status.pendingOperations);
      });
    }).catch(() => {});

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  if (isOnline && pending === 0 && !isSyncing) return null;

  return (
    <div className="w-full bg-amber-50 border-b border-amber-200 text-amber-800">
      <div className="max-w-7xl mx-auto px-4 py-2 text-sm flex items-center gap-2">
        <WifiOff className="w-4 h-4" />
        {!isOnline ? (
          <span>You are offline. Actions will auto-sync when back online.</span>
        ) : isSyncing ? (
          <span className="flex items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" />Syncing {pending} action{pending === 1 ? '' : 's'}…</span>
        ) : (
          <span>{pending} action{pending === 1 ? '' : 's'} queued</span>
        )}
      </div>
    </div>
  );
}


