import React, { useState, useMemo } from "react";
import { Polygon, Popup, Polyline } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AlertTriangle, 
  Route, 
  Eye, 
  Shield, 
  Swords, 
  Clock, 
  User, 
  MapPin,
  CheckCircle,
  XCircle,
  GitBranch,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Zap,
  Target,
  Crown,
  Calendar
} from "lucide-react";
import { Territory, TerritoryConflict, RouteInfo } from "@/types/territory";
import { toast } from "sonner";

interface TerritoryConflictVisualizationProps {
  conflicts: Array<{
    id: string;
    area: number;
    center: [number, number];
    competing_route_id: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  territoryId: string;
  onViewRoute?: (routeId: string) => void;
  onResolveConflict?: (conflictId: string, method: string) => void;
  showDetails?: boolean;
  interactive?: boolean;
}

interface ConflictAreaProps {
  conflict: {
    id: string;
    area: number;
    center: [number, number];
    competing_route_id: string;
    severity: 'low' | 'medium' | 'high';
  };
  onViewRoute?: (routeId: string) => void;
  onResolveConflict?: (conflictId: string, method: string) => void;
  interactive?: boolean;
}

const ConflictArea: React.FC<ConflictAreaProps> = ({
  conflict,
  onViewRoute,
  onResolveConflict,
  interactive = true,
}) => {
  const [isHighlighted, setIsHighlighted] = useState(false);

  // Get conflict area style based on severity
  const getConflictStyle = () => {
    const baseStyle = {
      weight: 2,
      fillOpacity: 0.3,
      opacity: 0.8,
      dashArray: '5, 5',
    };

    const severityStyles = {
      low: {
        color: '#3b82f6',
        fillColor: '#3b82f6',
      },
      medium: {
        color: '#f59e0b',
        fillColor: '#f59e0b',
      },
      high: {
        color: '#ef4444',
        fillColor: '#ef4444',
      },
    };

    return {
      ...baseStyle,
      ...severityStyles[conflict.severity],
      fillOpacity: isHighlighted ? 0.5 : 0.3,
      weight: isHighlighted ? 3 : 2,
    };
  };

  // Calculate conflict area radius (approximate circle)
  const conflictRadius = Math.sqrt(conflict.area / Math.PI);

  // Format area
  const formatArea = (areaSqm: number) => {
    if (areaSqm >= 1000000) {
      return `${(areaSqm / 1000000).toFixed(2)} km²`;
    }
    return `${(areaSqm / 1000).toFixed(0)} m²`;
  };

  // Get severity badge
  const getSeverityBadge = () => {
    const severityConfig = {
      low: { color: 'bg-blue-100 text-blue-800', label: 'Low Risk' },
      medium: { color: 'bg-orange-100 text-orange-800', label: 'Medium Risk' },
      high: { color: 'bg-red-100 text-red-800', label: 'High Risk' },
    };

    const config = severityConfig[conflict.severity];
    return (
      <Badge className={config.color} variant="secondary">
        {config.label}
      </Badge>
    );
  };

  return (
    <Polygon
      positions={[
        // Create a rough circle around the conflict center
        ...Array.from({ length: 16 }, (_, i) => {
          const angle = (i * 2 * Math.PI) / 16;
          const lat = conflict.center[0] + (conflictRadius / 111320) * Math.cos(angle);
          const lng = conflict.center[1] + (conflictRadius / (111320 * Math.cos(conflict.center[0] * Math.PI / 180))) * Math.sin(angle);
          return [lat, lng] as [number, number];
        })
      ]}
      pathOptions={getConflictStyle()}
      eventHandlers={interactive ? {
        mouseover: () => setIsHighlighted(true),
        mouseout: () => setIsHighlighted(false),
      } : {}}
    >
      <Popup>
        <div className="min-w-[200px] space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <h3 className="font-semibold text-sm">Territory Conflict</h3>
            </div>
            {getSeverityBadge()}
          </div>

          {/* Conflict details */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Overlap Area:</span>
              <span className="font-medium">{formatArea(conflict.area)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Severity:</span>
              <span className="font-medium capitalize">{conflict.severity}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Center:</span>
              <span className="font-medium">
                {conflict.center[0].toFixed(4)}, {conflict.center[1].toFixed(4)}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            {onViewRoute && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => onViewRoute(conflict.competing_route_id)}
              >
                <Route className="w-3 h-3 mr-1" />
                View Route
              </Button>
            )}
            
            {onResolveConflict && (
              <Button
                size="sm"
                className="flex-1"
                onClick={() => onResolveConflict(conflict.id, 'review')}
              >
                <Eye className="w-3 h-3 mr-1" />
                Resolve
              </Button>
            )}
          </div>
        </div>
      </Popup>
    </Polygon>
  );
};

const TerritoryConflictVisualization: React.FC<TerritoryConflictVisualizationProps> = ({
  conflicts,
  territoryId,
  onViewRoute,
  onResolveConflict,
  showDetails = true,
  interactive = true,
}) => {
  // Group conflicts by severity
  const conflictsBySeverity = useMemo(() => {
    return conflicts.reduce((acc, conflict) => {
      if (!acc[conflict.severity]) {
        acc[conflict.severity] = [];
      }
      acc[conflict.severity].push(conflict);
      return acc;
    }, {} as Record<string, typeof conflicts>);
  }, [conflicts]);

  // Calculate total conflict area
  const totalConflictArea = useMemo(() => {
    return conflicts.reduce((total, conflict) => total + conflict.area, 0);
  }, [conflicts]);

  // Format area
  const formatArea = (areaSqm: number) => {
    if (areaSqm >= 1000000) {
      return `${(areaSqm / 1000000).toFixed(2)} km²`;
    }
    return `${(areaSqm / 1000).toFixed(0)} m²`;
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-orange-600';
      case 'low': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  // Get severity icon
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'medium': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'low': return <AlertTriangle className="w-4 h-4 text-blue-600" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  };

  if (conflicts.length === 0) {
    return null;
  }

  return (
    <>
      {/* Render conflict areas on map */}
      {conflicts.map((conflict) => (
        <ConflictArea
          key={conflict.id}
          conflict={conflict}
          onViewRoute={onViewRoute}
          onResolveConflict={onResolveConflict}
          interactive={interactive}
        />
      ))}

      {/* Conflict details panel (if showDetails is true) */}
      {showDetails && (
        <div className="absolute top-4 left-4 z-[1000] max-w-sm">
          <Card className="bg-background/95 backdrop-blur-sm shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Swords className="w-4 h-4 text-orange-500" />
                Active Conflicts
                <Badge variant="destructive" className="ml-auto text-xs">
                  {conflicts.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-sm font-semibold text-red-600">
                    {conflictsBySeverity.high?.length || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">High</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-orange-600">
                    {conflictsBySeverity.medium?.length || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Medium</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-blue-600">
                    {conflictsBySeverity.low?.length || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Low</div>
                </div>
              </div>

              {/* Total conflict area */}
              <div className="text-center border-t pt-2">
                <div className="text-sm font-semibold">
                  {formatArea(totalConflictArea)}
                </div>
                <div className="text-xs text-muted-foreground">Total Conflict Area</div>
              </div>

              {/* Conflict list */}
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {conflicts.slice(0, 5).map((conflict) => (
                    <div
                      key={conflict.id}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs"
                    >
                      <div className="flex items-center gap-2">
                        {getSeverityIcon(conflict.severity)}
                        <span>{formatArea(conflict.area)}</span>
                      </div>
                      <div className="flex gap-1">
                        {onViewRoute && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0"
                            onClick={() => onViewRoute(conflict.competing_route_id)}
                          >
                            <Route className="w-3 h-3" />
                          </Button>
                        )}
                        {onResolveConflict && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0"
                            onClick={() => onResolveConflict(conflict.id, 'review')}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {conflicts.length > 5 && (
                    <div className="text-center text-xs text-muted-foreground">
                      +{conflicts.length - 5} more conflicts
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Legend */}
              <div className="border-t pt-2">
                <div className="text-xs font-medium mb-1">Conflict Severity:</div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full opacity-30"></div>
                    <span>High Risk (&gt;75% overlap)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full opacity-30"></div>
                    <span>Medium Risk (25-75% overlap)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full opacity-30"></div>
                    <span>Low Risk (&lt;25% overlap)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default TerritoryConflictVisualization;