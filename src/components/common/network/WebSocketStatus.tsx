/**
 * WebSocket connection status indicator component.
 * Shows connection health, reconnection attempts, and provides manual controls.
 */

import React, { useState } from 'react';
import { useWebSocketManager } from '@/hooks/useWebSocketManager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WebSocketStatusProps {
  showDetails?: boolean;
  showControls?: boolean;
  className?: string;
}

export const WebSocketStatus: React.FC<WebSocketStatusProps> = ({
  showDetails = false,
  showControls = false,
  className = ''
}) => {
  const { connectionState, isConnected, isConnecting, stats, forceReconnect, disconnect, connect } = useWebSocketManager();
  const [showStats, setShowStats] = useState(false);

  const getStatusColor = () => {
    if (isConnected) return 'text-green-600';
    if (isConnecting) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusText = () => {
    if (isConnected) return 'Connected';
    if (isConnecting) return 'Connecting...';
    return 'Disconnected';
  };

  const getStatusIcon = () => {
    if (isConnected) return '🟢';
    if (isConnecting) return '🟡';
    return '🔴';
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  if (!showDetails) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <span className="text-sm">{getStatusIcon()}</span>
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
        {connectionState.reconnectAttempts > 0 && (
          <span className="text-xs text-gray-500">
            (Attempt {connectionState.reconnectAttempts})
          </span>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <span>{getStatusIcon()}</span>
            <span className={getStatusColor()}>{getStatusText()}</span>
          </div>
          {showControls && (
            <div className="flex space-x-1">
              {isConnected ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={disconnect}
                  className="h-6 px-2 text-xs"
                >
                  Disconnect
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={connect}
                  className="h-6 px-2 text-xs"
                >
                  Connect
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={forceReconnect}
                className="h-6 px-2 text-xs"
              >
                Reconnect
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        {/* Connection Info */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <div className="text-gray-500">Reconnect Attempts</div>
            <div className="font-medium">{connectionState.reconnectAttempts}</div>
          </div>
          <div>
            <div className="text-gray-500">Total Reconnects</div>
            <div className="font-medium">{connectionState.totalReconnects}</div>
          </div>
          {connectionState.lastConnectedAt && (
            <div>
              <div className="text-gray-500">Last Connected</div>
              <div className="font-medium">
                {connectionState.lastConnectedAt.toLocaleTimeString()}
              </div>
            </div>
          )}
          {connectionState.connectionDuration > 0 && (
            <div>
              <div className="text-gray-500">Duration</div>
              <div className="font-medium">
                {formatDuration(connectionState.connectionDuration / 1000)}
              </div>
            </div>
          )}
        </div>

        {/* Subscriptions */}
        {stats.subscriptions && stats.subscriptions.length > 0 && (
          <div>
            <div className="text-gray-500 text-xs mb-1">Event Subscriptions</div>
            <div className="flex flex-wrap gap-1">
              {stats.subscriptions.map((sub: string) => (
                <span
                  key={sub}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                >
                  {sub}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Watchers */}
        {((stats.territoryWatchers && stats.territoryWatchers.length > 0) ||
          (stats.routeWatchers && stats.routeWatchers.length > 0)) && (
          <div>
            <div className="text-gray-500 text-xs mb-1">Watching</div>
            <div className="text-xs space-y-1">
              {stats.territoryWatchers && stats.territoryWatchers.length > 0 && (
                <div>
                  <span className="text-green-600">Territories:</span> {stats.territoryWatchers.length}
                </div>
              )}
              {stats.routeWatchers && stats.routeWatchers.length > 0 && (
                <div>
                  <span className="text-blue-600">Routes:</span> {stats.routeWatchers.length}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Queued Messages */}
        {stats.queuedMessages > 0 && (
          <div>
            <div className="text-gray-500 text-xs">Queued Messages</div>
            <div className="font-medium text-orange-600">{stats.queuedMessages}</div>
          </div>
        )}

        {/* Advanced Stats Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowStats(!showStats)}
          className="h-6 px-2 text-xs w-full"
        >
          {showStats ? 'Hide' : 'Show'} Advanced Stats
        </Button>

        {/* Advanced Stats */}
        {showStats && (
          <div className="border-t pt-3 space-y-2">
            <div className="text-xs">
              <div className="text-gray-500 mb-1">Full State</div>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-32">
                {JSON.stringify(stats, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WebSocketStatus;