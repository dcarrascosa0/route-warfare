import React from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, isSlowConnection } = useNetworkStatus();

  if (isOnline && !isSlowConnection) {
    return null;
  }

  return (
    <Alert className={`fixed top-4 left-4 right-4 z-50 ${
      !isOnline ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'
    }`}>
      <div className="flex items-center gap-2">
        {!isOnline ? (
          <WifiOff className="h-4 w-4 text-red-600" />
        ) : (
          <Wifi className="h-4 w-4 text-yellow-600" />
        )}
        <AlertDescription className={
          !isOnline ? 'text-red-800' : 'text-yellow-800'
        }>
          {!isOnline 
            ? 'You are currently offline. Some features may not be available.'
            : 'Slow connection detected. Some features may load slowly.'
          }
        </AlertDescription>
      </div>
    </Alert>
  );
};

export default OfflineIndicator;