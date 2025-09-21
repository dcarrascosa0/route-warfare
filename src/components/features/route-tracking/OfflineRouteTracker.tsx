import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Download, 
  Upload, 
  HardDrive, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Database,
  CloudOff,
  Cloud,
  RotateCcw,
  Trash2,
  Eye,
  Play,
  Pause,
  Square
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useResponsive } from '@/hooks/useResponsive';

interface GPSCoordinate {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  timestamp: string;
}

interface OfflineRoute {
  id: string;
  name?: string;
  description?: string;
  coordinates: GPSCoordinate[];
  startTime: string;
  endTime?: string;
  status: 'active' | 'completed' | 'syncing' | 'synced' | 'failed';
  lastSyncAttempt?: string;
  syncRetries: number;
  estimatedSize: number; // in bytes
  isClosedLoop?: boolean;
  territoryClaimPending?: boolean;
}

interface StorageInfo {
  used: number;
  available: number;
  total: number;
  routeCount: number;
}

interface OfflineRouteTrackerProps {
  className?: string;
  maxStorageSize?: number; // in MB
  autoSyncEnabled?: boolean;
  onRouteSync?: (routeId: string) => Promise<void>;
  onRouteDelete?: (routeId: string) => void;
  onRouteView?: (route: OfflineRoute) => void;
}

const OfflineRouteTracker: React.FC<OfflineRouteTrackerProps> = ({
  className = "",
  maxStorageSize = 100, // 100MB default
  autoSyncEnabled = true,
  onRouteSync,
  onRouteDelete,
  onRouteView
}) => {
  const { isMobile } = useResponsive();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineRoutes, setOfflineRoutes] = useState<OfflineRoute[]>([]);
  const [storageInfo, setStorageInfo] = useState<StorageInfo>({
    used: 0,
    available: 0,
    total: 0,
    routeCount: 0
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [currentActiveRoute, setCurrentActiveRoute] = useState<OfflineRoute | null>(null);

  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load offline routes from localStorage
  const loadOfflineRoutes = useCallback(() => {
    try {
      const stored = localStorage.getItem('offline_routes');
      if (stored) {
        const routes: OfflineRoute[] = JSON.parse(stored);
        setOfflineRoutes(routes);
        
        // Calculate storage info
        const totalSize = routes.reduce((sum, route) => sum + route.estimatedSize, 0);
        const maxSize = maxStorageSize * 1024 * 1024; // Convert MB to bytes
        
        setStorageInfo({
          used: totalSize,
          available: maxSize - totalSize,
          total: maxSize,
          routeCount: routes.length
        });
      }
    } catch (error) {
      console.error('Failed to load offline routes:', error);
    }
  }, [maxStorageSize]);

  // Save offline routes to localStorage
  const saveOfflineRoutes = useCallback((routes: OfflineRoute[]) => {
    try {
      localStorage.setItem('offline_routes', JSON.stringify(routes));
      setOfflineRoutes(routes);
    } catch (error) {
      console.error('Failed to save offline routes:', error);
    }
  }, []);

  // Load routes on mount
  useEffect(() => {
    loadOfflineRoutes();
  }, [loadOfflineRoutes]);

  // Auto-sync when online
  useEffect(() => {
    if (isOnline && autoSyncEnabled && !isSyncing) {
      const pendingRoutes = offlineRoutes.filter(route => 
        route.status === 'completed' || route.status === 'failed'
      );
      
      if (pendingRoutes.length > 0) {
        handleSyncAll();
      }
    }
  }, [isOnline, autoSyncEnabled, isSyncing, offlineRoutes]);

  // Estimate route size
  const estimateRouteSize = useCallback((route: OfflineRoute) => {
    // Rough estimation: each coordinate ~100 bytes + metadata
    const coordinateSize = route.coordinates.length * 100;
    const metadataSize = 500; // Route metadata
    return coordinateSize + metadataSize;
  }, []);

  // Add new offline route
  const addOfflineRoute = useCallback((route: Omit<OfflineRoute, 'estimatedSize'>) => {
    const routeWithSize: OfflineRoute = {
      ...route,
      estimatedSize: estimateRouteSize(route as OfflineRoute)
    };

    const updatedRoutes = [...offlineRoutes, routeWithSize];
    saveOfflineRoutes(updatedRoutes);
  }, [offlineRoutes, saveOfflineRoutes, estimateRouteSize]);

  // Update route status
  const updateRouteStatus = useCallback((routeId: string, status: OfflineRoute['status'], retryIncrement = false) => {
    const updatedRoutes = offlineRoutes.map(route => {
      if (route.id === routeId) {
        return {
          ...route,
          status,
          lastSyncAttempt: new Date().toISOString(),
          syncRetries: retryIncrement ? route.syncRetries + 1 : route.syncRetries
        };
      }
      return route;
    });
    saveOfflineRoutes(updatedRoutes);
  }, [offlineRoutes, saveOfflineRoutes]);

  // Sync single route
  const handleSyncRoute = useCallback(async (routeId: string) => {
    if (!onRouteSync || !isOnline) return;

    updateRouteStatus(routeId, 'syncing');
    
    try {
      await onRouteSync(routeId);
      updateRouteStatus(routeId, 'synced');
    } catch (error) {
      console.error('Failed to sync route:', error);
      updateRouteStatus(routeId, 'failed', true);
    }
  }, [onRouteSync, isOnline, updateRouteStatus]);

  // Sync all pending routes
  const handleSyncAll = useCallback(async () => {
    if (!onRouteSync || !isOnline) return;

    const pendingRoutes = offlineRoutes.filter(route => 
      route.status === 'completed' || route.status === 'failed'
    );

    if (pendingRoutes.length === 0) return;

    setIsSyncing(true);
    setSyncProgress(0);

    for (let i = 0; i < pendingRoutes.length; i++) {
      const route = pendingRoutes[i];
      try {
        await handleSyncRoute(route.id);
        setSyncProgress(((i + 1) / pendingRoutes.length) * 100);
      } catch (error) {
        console.error(`Failed to sync route ${route.id}:`, error);
      }
    }

    setIsSyncing(false);
    setSyncProgress(0);
  }, [offlineRoutes, onRouteSync, isOnline, handleSyncRoute]);

  // Delete route
  const handleDeleteRoute = useCallback((routeId: string) => {
    const updatedRoutes = offlineRoutes.filter(route => route.id !== routeId);
    saveOfflineRoutes(updatedRoutes);
    onRouteDelete?.(routeId);
  }, [offlineRoutes, saveOfflineRoutes, onRouteDelete]);

  // Clear all synced routes
  const handleClearSynced = useCallback(() => {
    const updatedRoutes = offlineRoutes.filter(route => route.status !== 'synced');
    saveOfflineRoutes(updatedRoutes);
  }, [offlineRoutes, saveOfflineRoutes]);

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format time
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  // Get status color and icon
  const getStatusInfo = (status: OfflineRoute['status']) => {
    switch (status) {
      case 'active':
        return { color: 'text-blue-600', bg: 'bg-blue-100', icon: Play };
      case 'completed':
        return { color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle };
      case 'syncing':
        return { color: 'text-orange-600', bg: 'bg-orange-100', icon: RefreshCw };
      case 'synced':
        return { color: 'text-green-600', bg: 'bg-green-100', icon: Cloud };
      case 'failed':
        return { color: 'text-red-600', bg: 'bg-red-100', icon: AlertTriangle };
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-100', icon: Database };
    }
  };

  const storagePercentage = storageInfo.total > 0 ? (storageInfo.used / storageInfo.total) * 100 : 0;
  const pendingRoutes = offlineRoutes.filter(route => 
    route.status === 'completed' || route.status === 'failed'
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Connection Status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="w-5 h-5 text-green-500" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-500" />
              )}
              Offline Route Tracker
              <Badge variant={isOnline ? "default" : "secondary"}>
                {isOnline ? 'Online' : 'Offline'}
              </Badge>
            </div>
            {isOnline && pendingRoutes.length > 0 && (
              <Button 
                size="sm" 
                onClick={handleSyncAll}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Sync All
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium">{offlineRoutes.length}</div>
              <div className="text-muted-foreground">Total Routes</div>
            </div>
            <div>
              <div className="font-medium">{pendingRoutes.length}</div>
              <div className="text-muted-foreground">Pending Sync</div>
            </div>
            <div>
              <div className="font-medium">{formatSize(storageInfo.used)}</div>
              <div className="text-muted-foreground">Storage Used</div>
            </div>
            <div>
              <div className="font-medium">{formatSize(storageInfo.available)}</div>
              <div className="text-muted-foreground">Available</div>
            </div>
          </div>

          {/* Storage usage bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1">
              <span>Storage Usage</span>
              <span>{storagePercentage.toFixed(1)}%</span>
            </div>
            <Progress 
              value={storagePercentage} 
              className={`h-2 ${storagePercentage > 90 ? 'bg-red-100' : storagePercentage > 70 ? 'bg-yellow-100' : 'bg-green-100'}`}
            />
          </div>

          {/* Sync progress */}
          {isSyncing && (
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1">
                <span>Syncing Routes...</span>
                <span>{syncProgress.toFixed(0)}%</span>
              </div>
              <Progress value={syncProgress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Storage Warning */}
      {storagePercentage > 90 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Storage is nearly full ({storagePercentage.toFixed(1)}%). Consider syncing or deleting old routes.
          </AlertDescription>
        </Alert>
      )}

      {/* Offline Mode Alert */}
      {!isOnline && (
        <Alert>
          <CloudOff className="h-4 w-4" />
          <AlertDescription>
            You're offline. Routes will be stored locally and synced when connection is restored.
          </AlertDescription>
        </Alert>
      )}

      {/* Routes List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Offline Routes
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleClearSynced}
                disabled={offlineRoutes.filter(r => r.status === 'synced').length === 0}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear Synced
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {offlineRoutes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No offline routes stored</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {offlineRoutes.map((route) => {
                  const statusInfo = getStatusInfo(route.status);
                  const StatusIcon = statusInfo.icon;

                  return (
                    <div
                      key={route.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`p-1.5 rounded-full ${statusInfo.bg}`}>
                          <StatusIcon className={`w-4 h-4 ${statusInfo.color} ${route.status === 'syncing' ? 'animate-spin' : ''}`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm truncate">
                              {route.name || `Route ${route.id.slice(0, 8)}`}
                            </h4>
                            <Badge className={statusInfo.bg} variant="secondary">
                              {route.status}
                            </Badge>
                            {route.isClosedLoop && (
                              <Badge variant="outline" className="text-xs">
                                Loop
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                            <span>{route.coordinates.length} points</span>
                            <span>{formatSize(route.estimatedSize)}</span>
                            <span>{formatTime(route.startTime)}</span>
                            {route.syncRetries > 0 && (
                              <span className="text-orange-600">
                                {route.syncRetries} retries
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {onRouteView && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => onRouteView(route)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        
                        {isOnline && (route.status === 'completed' || route.status === 'failed') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleSyncRoute(route.id)}
                            disabled={false}
                          >
                            <Upload className="w-4 h-4" />
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteRoute(route.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OfflineRouteTracker;