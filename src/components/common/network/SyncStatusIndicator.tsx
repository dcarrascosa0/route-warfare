import React from 'react';
import { Wifi, WifiOff, RefreshCw, Clock, CheckCircle } from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface SyncStatusIndicatorProps {
    className?: string;
    showDetails?: boolean;
}

const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
    className,
    showDetails = false,
}) => {
    const { syncStatus, forcSync, isOnline, isSyncing, hasPendingOperations } = useOfflineSync();

    const getStatusIcon = () => {
        if (!isOnline) {
            return <WifiOff className="h-4 w-4 text-red-500" />;
        }

        if (isSyncing) {
            return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
        }

        if (hasPendingOperations) {
            return <Clock className="h-4 w-4 text-yellow-500" />;
        }

        return <CheckCircle className="h-4 w-4 text-green-500" />;
    };

    const getStatusText = () => {
        if (!isOnline) {
            return 'Offline';
        }

        if (isSyncing) {
            return 'Syncing...';
        }

        if (hasPendingOperations) {
            return `${syncStatus.pendingOperations} pending`;
        }

        return 'Synced';
    };

    const getStatusColor = () => {
        if (!isOnline) return 'destructive';
        if (isSyncing) return 'default';
        if (hasPendingOperations) return 'secondary';
        return 'default';
    };

    const getTooltipContent = () => {
        const lastSync = syncStatus.lastSyncTime
            ? new Date(syncStatus.lastSyncTime).toLocaleTimeString()
            : 'Never';

        return (
            <div className="space-y-1">
                <div className="font-medium">Sync Status</div>
                <div className="text-sm">
                    <div>Status: {getStatusText()}</div>
                    <div>Last sync: {lastSync}</div>
                    {hasPendingOperations && (
                        <div>Pending operations: {syncStatus.pendingOperations}</div>
                    )}
                </div>
            </div>
        );
    };

    if (!showDetails) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className={cn("flex items-center gap-1", className)}>
                        {getStatusIcon()}
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    {getTooltipContent()}
                </TooltipContent>
            </Tooltip>
        );
    }

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div className="flex items-center gap-1">
                {getStatusIcon()}
                <Badge variant={getStatusColor()} className="text-xs">
                    {getStatusText()}
                </Badge>
            </div>

            {hasPendingOperations && isOnline && (
                <Button
                    size="sm"
                    variant="outline"
                    onClick={forcSync}
                    disabled={isSyncing}
                    className="h-6 px-2 text-xs"
                >
                    {isSyncing ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                        'Sync Now'
                    )}
                </Button>
            )}
        </div>
    );
};

export default SyncStatusIndicator;