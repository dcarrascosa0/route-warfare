import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, AlertTriangle, Clock, MapPin, Shield, Zap, Target } from 'lucide-react';
import { TerritoryConflictInfo, ConflictResolution, TerritoryClaimResult } from '@/lib/api/types/routes';

interface TerritoryClaimingStatusProps {
  status: 'success' | 'blocked' | 'failed' | 'ineligible' | 'error' | 'processing';
  reason?: string;
  territoryResult?: TerritoryClaimResult;
  conflicts?: TerritoryConflictInfo[];
  conflictResolution?: ConflictResolution;
  className?: string;
  showProgress?: boolean;
  progressValue?: number;
}

export const TerritoryClaimingStatus: React.FC<TerritoryClaimingStatusProps> = ({
  status,
  reason,
  territoryResult,
  conflicts = [],
  conflictResolution,
  className = '',
  showProgress = false,
  progressValue = 0
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'blocked':
        return <Shield className="h-5 w-5 text-red-500" />;
      case 'failed':
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'ineligible':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'processing':
        return <Clock className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <MapPin className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'blocked':
        return 'bg-red-50 border-red-200';
      case 'failed':
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'ineligible':
        return 'bg-yellow-50 border-yellow-200';
      case 'processing':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'success':
        const area = territoryResult?.area_km2 || 0;
        const conflictNote = conflicts.length > 0 
          ? ` (${conflicts.length} minor conflicts resolved)`
          : '';
        return `Territory claimed successfully! You gained ${area.toFixed(2)} km²${conflictNote}.`;
      case 'blocked':
        return reason || 'Territory claiming was blocked due to major conflicts with existing territories.';
      case 'failed':
        return reason || 'Failed to claim territory from this route. The route may not meet territory requirements.';
      case 'error':
        return reason || 'An error occurred during territory claiming. Please try again.';
      case 'ineligible':
        return reason || 'This route is not eligible for territory claiming. Routes must meet minimum distance and area requirements.';
      case 'processing':
        return showProgress ? 'Analyzing route for territory claiming...' : 'Processing territory claim...';
      default:
        return 'Territory status unknown.';
    }
  };

  const getDetailedStatusInfo = () => {
    switch (status) {
      case 'success':
        return {
          title: 'Territory Claimed',
          subtitle: 'Your new territory has been added to your collection',
          actionable: false
        };
      case 'blocked':
        return {
          title: 'Territory Blocked',
          subtitle: 'Major conflicts prevent claiming this territory',
          actionable: true
        };
      case 'failed':
        return {
          title: 'Territory Claiming Failed',
          subtitle: 'Unable to process territory claim',
          actionable: true
        };
      case 'error':
        return {
          title: 'Territory Error',
          subtitle: 'Technical issue during territory processing',
          actionable: true
        };
      case 'ineligible':
        return {
          title: 'Territory Ineligible',
          subtitle: 'Route does not meet territory requirements',
          actionable: false
        };
      case 'processing':
        return {
          title: 'Processing Territory',
          subtitle: 'Calculating boundaries and checking conflicts',
          actionable: false
        };
      default:
        return {
          title: 'Territory Status',
          subtitle: 'Unknown territory status',
          actionable: false
        };
    }
  };

  const getConflictLevelBadge = () => {
    if (!conflictResolution) return null;
    
    const { conflict_level, total_conflicts } = conflictResolution;
    
    const levelColors = {
      none: 'bg-green-100 text-green-800',
      minor: 'bg-yellow-100 text-yellow-800',
      significant: 'bg-orange-100 text-orange-800',
      major: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={`text-xs ${levelColors[conflict_level] || levelColors.minor}`}>
        {conflict_level} conflicts ({total_conflicts})
      </Badge>
    );
  };

  const statusInfo = getDetailedStatusInfo();

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Territory Status</span>
      </div>
      
      <Alert className={getStatusColor()}>
        <div className="flex items-start gap-3">
          {getStatusIcon()}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <div className="font-medium text-sm">{statusInfo.title}</div>
              {status === 'success' && (
                <Badge variant="secondary" className="text-xs">
                  <Target className="h-3 w-3 mr-1" />
                  Claimed
                </Badge>
              )}
            </div>
            
            <div className="text-xs text-gray-600 mb-2">{statusInfo.subtitle}</div>
            
            {/* Progress bar for processing status */}
            {status === 'processing' && showProgress && (
              <div className="mb-3">
                <Progress value={progressValue} className="w-full h-2" />
                <div className="text-xs text-gray-500 mt-1">
                  {progressValue < 30 && "Analyzing route geometry..."}
                  {progressValue >= 30 && progressValue < 60 && "Calculating territory boundaries..."}
                  {progressValue >= 60 && progressValue < 90 && "Checking for conflicts..."}
                  {progressValue >= 90 && "Finalizing territory claim..."}
                </div>
              </div>
            )}
            
            <AlertDescription className="text-sm">
              {getStatusMessage()}
            </AlertDescription>
            
            {status === 'success' && territoryResult && (
              <div className="mt-3 space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    Area: {territoryResult.area_km2.toFixed(2)} km²
                  </Badge>
                  {territoryResult.is_closed_loop && (
                    <Badge variant="secondary" className="text-xs">
                      Closed Loop
                    </Badge>
                  )}
                  {getConflictLevelBadge()}
                </div>
                
                {conflicts.length > 0 && (
                  <div className="text-xs text-green-700 bg-green-50 p-2 rounded">
                    Successfully resolved {conflicts.length} territory conflicts
                  </div>
                )}
              </div>
            )}
            
            {status === 'blocked' && conflictResolution && (
              <div className="mt-3 space-y-2">
                <div className="flex flex-wrap gap-2">
                  {getConflictLevelBadge()}
                  <Badge variant="destructive" className="text-xs">
                    Major: {conflictResolution.major_conflicts}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Significant: {conflictResolution.significant_conflicts}
                  </Badge>
                </div>
                
                <div className="text-xs text-red-700 bg-red-50 p-2 rounded">
                  Territory claiming blocked due to {conflictResolution.major_conflicts} major conflicts. 
                  Consider adjusting your route to avoid heavily contested areas.
                </div>
              </div>
            )}
            
            {(status === 'failed' || status === 'error') && (
              <div className="mt-3">
                <div className="text-xs text-orange-700 bg-orange-50 p-2 rounded">
                  {status === 'failed' 
                    ? "Territory claiming failed. This may be due to route requirements not being met."
                    : "A technical error occurred. Please try again or contact support if the issue persists."
                  }
                </div>
              </div>
            )}
            
            {conflicts.length > 0 && status !== 'success' && (
              <div className="mt-3">
                <div className="text-xs text-gray-600 mb-2">
                  Conflicts detected ({conflicts.length}):
                </div>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {conflicts.slice(0, 5).map((conflict, index) => (
                    <div key={index} className="text-xs bg-white/50 rounded px-2 py-1 flex justify-between">
                      <span className="font-medium">{conflict.territory_name}</span>
                      <span className="text-gray-500">
                        {conflict.overlap_percentage.toFixed(1)}% overlap
                      </span>
                    </div>
                  ))}
                  {conflicts.length > 5 && (
                    <div className="text-xs text-gray-500 text-center py-1">
                      +{conflicts.length - 5} more conflicts
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Alert>
    </div>
  );
};