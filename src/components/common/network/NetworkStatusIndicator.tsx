/**
 * Network status indicator component showing connection quality and resilience status.
 */

import React, { useState, useEffect } from 'react';
import { 
  WifiOff, 
  Signal, 
  SignalLow, 
  SignalMedium, 
  SignalHigh,
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useNetworkResilience } from '@/lib/network/network-resilience';
import { useCoordinateBuffer } from '@/lib/network/coordinate-buffer';

interface NetworkStatusIndicatorProps {
  showDetails?: boolean;
  compact?: boolean;
  className?: string;
}

export const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({
  showDetails = false,
  compact = false,
  className = ''
}) => {
  const networkStatus = useNetworkStatus();
  const networkResilience = useNetworkResilience();
  const coordinateBuffer = useCoordinateBuffer();
  
  const [bufferStats, setBufferStats] = useState(coordinateBuffer.getStats());
  const [queueStats, setQueueStats] = useState(networkResilience.getQueueStats());
  const [expanded, setExpanded] = useState(false);

  // Subscribe to buffer and queue updates
  useEffect(() => {
    const unsubscribeBuffer = coordinateBuffer.subscribe(setBufferStats);
    
    const updateQueueStats = () => {
      setQueueStats(networkResilience.getQueueStats());
    };
    
    const interval = setInterval(updateQueueStats, 1000);
    
    return () => {
      unsubscribeBuffer();
      clearInterval(interval);
    };
  }, [coordinateBuffer, networkResilience]);

  // Determine connection quality
  const getConnectionQuality = () => {
    if (!networkStatus.isOnline) return 'offline';
    if (networkStatus.isSlowConnection) return 'slow';
    if (networkStatus.effectiveType === '4g' || networkStatus.effectiveType === '5g') return 'fast';
    return 'normal';
  };

  // Get appropriate icon for connection quality
  const getConnectionIcon = () => {
    const quality = getConnectionQuality();
    const iconClass = "w-4 h-4";
    
    switch (quality) {
      case 'offline':
        return <WifiOff className={`${iconClass} text-red-500`} />;
      case 'slow':
        return <SignalLow className={`${iconClass} text-orange-500`} />;
      case 'normal':
        return <SignalMedium className={`${iconClass} text-yellow-500`} />;
      case 'fast':
        return <SignalHigh className={`${iconClass} text-green-500`} />;
      default:
        return <Signal className={`${iconClass} text-gray-500`} />;
    }
  };

  // Get status color
  const getStatusColor = () => {
    const quality = getConnectionQuality();
    switch (quality) {
      case 'offline': return 'bg-red-500';
      case 'slow': return 'bg-orange-500';
      case 'normal': return 'bg-yellow-500';
      case 'fast': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  // Format connection type
  const formatConnectionType = () => {
    const quality = getConnectionQuality();
    if (quality === 'offline') return 'Offline';
    
    const type = networkStatus.effectiveType || networkStatus.connectionType;
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Calculate resilience score
  const getResilienceScore = () => {
    let score = 0;
    
    // Base score from connection quality
    const quality = getConnectionQuality();
    switch (quality) {
      case 'fast': score += 40; break;
      case 'normal': score += 30; break;
      case 'slow': score += 20; break;
      case 'offline': score += 0; break;
    }
    
    // Buffer health (30 points max)
    if (bufferStats.totalBuffered > 0) {
      const bufferHealth = Math.min(30, (bufferStats.pendingSync / bufferStats.totalBuffered) * 30);
      score += 30 - bufferHealth; // Lower pending sync = higher score
    } else {
      score += 30; // No buffer issues
    }
    
    // Queue health (30 points max)
    if (queueStats.totalQueued === 0) {
      score += 30; // No queued requests
    } else {
      const queueHealth = Math.max(0, 30 - queueStats.totalQueued * 5);
      score += queueHealth;
    }
    
    return Math.min(100, Math.max(0, score));
  };

  // Get resilience status
  const getResilienceStatus = () => {
    const score = getResilienceScore();
    if (score >= 80) return { label: 'Excellent', color: 'text-green-600' };
    if (score >= 60) return { label: 'Good', color: 'text-yellow-600' };
    if (score >= 40) return { label: 'Fair', color: 'text-orange-600' };
    return { label: 'Poor', color: 'text-red-600' };
  };

  // Force sync buffer
  const handleForceSync = async () => {
    try {
      await coordinateBuffer.forceSyncAll({
        isOnline: networkStatus.isOnline,
        isSlowConnection: networkStatus.isSlowConnection,
        connectionType: networkStatus.connectionType,
        effectiveType: networkStatus.effectiveType
      });
    } catch (error) {
      console.error('Force sync failed:', error);
    }
  };

  // Clear queue
  const handleClearQueue = () => {
    networkResilience.clearQueue();
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {getConnectionIcon()}
        <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
        {bufferStats.pendingSync > 0 && (
          <Badge variant="secondary" className="text-xs">
            {bufferStats.pendingSync}
          </Badge>
        )}
      </div>
    );
  }

  const resilienceStatus = getResilienceStatus();
  const resilienceScore = getResilienceScore();

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getConnectionIcon()}
              <span className="font-medium">Network Status</span>
            </div>
            {showDetails && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? '−' : '+'}
              </Button>
            )}
          </div>

          {/* Connection Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Connection:</span>
              <div className="font-medium">{formatConnectionType()}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Quality:</span>
              <div className={`font-medium ${resilienceStatus.color}`}>
                {resilienceStatus.label}
              </div>
            </div>
          </div>

          {/* Resilience Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Resilience Score</span>
              <span className={`font-medium ${resilienceStatus.color}`}>
                {resilienceScore}%
              </span>
            </div>
            <Progress value={resilienceScore} className="h-2" />
          </div>

          {/* Buffer Status */}
          {bufferStats.totalBuffered > 0 && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Buffered Data</span>
              </div>
              <div className="flex items-center gap-2">
                <span>{bufferStats.pendingSync} pending</span>
                {bufferStats.pendingSync > 0 && networkStatus.isOnline && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleForceSync}
                    className="h-6 px-2 text-xs"
                  >
                    Sync
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Queue Status */}
          {queueStats.totalQueued > 0 && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3 text-orange-500" />
                <span>Queued Requests</span>
              </div>
              <div className="flex items-center gap-2">
                <span>{queueStats.totalQueued} waiting</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearQueue}
                  className="h-6 px-2 text-xs text-red-600"
                >
                  Clear
                </Button>
              </div>
            </div>
          )}

          {/* Processing Status */}
          {queueStats.isProcessing && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Processing queue...</span>
            </div>
          )}

          {/* Expanded Details */}
          {expanded && showDetails && (
            <div className="space-y-3 pt-3 border-t">
              <h4 className="font-medium text-sm">Connection Details</h4>
              
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <div>{networkStatus.connectionType || 'Unknown'}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Effective:</span>
                  <div>{networkStatus.effectiveType || 'Unknown'}</div>
                </div>
              </div>

              {bufferStats.totalBuffered > 0 && (
                <>
                  <h4 className="font-medium text-sm">Buffer Statistics</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">Total:</span>
                      <div>{bufferStats.totalBuffered} coordinates</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Failed:</span>
                      <div>{bufferStats.failedCoordinates} coordinates</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Size:</span>
                      <div>{(bufferStats.bufferSizeBytes / 1024).toFixed(1)} KB</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Last Sync:</span>
                      <div>
                        {bufferStats.lastSyncTime 
                          ? new Date(bufferStats.lastSyncTime).toLocaleTimeString()
                          : 'Never'
                        }
                      </div>
                    </div>
                  </div>
                </>
              )}

              {queueStats.totalQueued > 0 && (
                <>
                  <h4 className="font-medium text-sm">Queue Statistics</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">High Priority:</span>
                      <div>{queueStats.highPriority} requests</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Normal:</span>
                      <div>{queueStats.normalPriority} requests</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Low Priority:</span>
                      <div>{queueStats.lowPriority} requests</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Old Requests:</span>
                      <div>{queueStats.oldRequests} requests</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Status Indicators */}
          <div className="flex items-center gap-2 text-xs">
            {networkStatus.isOnline ? (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-3 h-3" />
                <span>Connected</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-600">
                <AlertTriangle className="w-3 h-3" />
                <span>Offline</span>
              </div>
            )}
            
            {bufferStats.pendingSync === 0 && queueStats.totalQueued === 0 && (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-3 h-3" />
                <span>All synced</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NetworkStatusIndicator;