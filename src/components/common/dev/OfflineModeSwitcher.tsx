import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';

const OfflineModeSwitcher = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOnline = () => {
      setIsOffline(false);
      toast.success('You are back online!');
    };
    const goOffline = () => {
      setIsOffline(true);
      toast.info('You are now in offline mode.');
    };

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const toggleOfflineMode = () => {
    // This is a simulation for testing purposes
    if (isOffline) {
      window.dispatchEvent(new Event('online'));
    } else {
      window.dispatchEvent(new Event('offline'));
    }
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h4 className="font-semibold mb-2">Offline Mode Simulator</h4>
      <Button onClick={toggleOfflineMode} variant={isOffline ? 'destructive' : 'default'}>
        {isOffline ? <WifiOff className="w-4 h-4 mr-2" /> : <Wifi className="w-4 h-4 mr-2" />}
        {isOffline ? 'Go Online' : 'Go Offline'}
      </Button>
    </div>
  );
};

export default OfflineModeSwitcher;
