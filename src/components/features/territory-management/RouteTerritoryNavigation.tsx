import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Route, 
  Shield, 
  ExternalLink, 
  ArrowRight, 
  MapPin, 
  Target,
  Clock,
  Ruler,
  Crown,
  AlertTriangle,
  User,
  Calendar,
  Navigation,
  Eye,
  Swords
} from 'lucide-react';
import { Territory } from '@/types/territory';

interface RouteInfo {
  id: string;
  name?: string;
  user_id: string;
  username?: string;
  completed_at: string;
  distance_meters: number;
  duration_seconds?: number;
  coordinate_count: number;
  is_closed: boolean;
  gps_quality_score?: number;
  territory_eligibility_score?: number;
}

interface RouteTerritoryNavigationProps {
  // Route to territory navigation
  route?: {
    id: string;
    name?: string;
    territory_id?: string;
    territory_claimed?: boolean;
    territory_status?: 'claimed' | 'contested' | 'neutral';
    is_closed: boolean;
    distance_meters: number;
    area_km2?: number;
  };
  
  // Territory to route navigation
  territory?: Territory;
  
  // Navigation handlers
  onNavigateToRoute?: (routeId: string) => void;
  onNavigateToTerritory?: (territoryId: string) => void;
  onViewOnMap?: (routeId?: string, territoryId?: string) => void;
  
  // Display options
  showNavigationButtons?: boolean;
  showDetails?: boolean;
  compact?: boolean;
  className?: string;
}

const RouteTerritoryNavigation: React.FC<RouteTerritoryNavigationProps> = ({
  route,
  territory,
  onNavigateToRoute,
  onNavigateToTerritory,
  onViewOnMap,
  showNavigationButtons = true,
  showDetails = true,
  compact = false,
  className = ""
}) => {
  // Format distance
  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${meters.toFixed(0)} m`;
  };

  // Format area
  const formatArea = (areaSqm: number) => {
    if (areaSqm >= 1000000) {
      return `${(areaSqm / 1000000).toFixed(2)} km²`;
    }
    return `${(areaSqm / 1000).toFixed(0)} m²`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Get territory status info
  const getTerritoryStatusInfo = (territory: Territory) => {
    if (territory.is_owned) {
      return {
        icon: Shield,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        label: 'Owned',
        description: 'This territory is owned'
      };
    }
    if (territory.is_contested) {
      return {
        icon: Swords,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        label: 'Contested',
        description: 'This territory is being contested'
      };
    }
    return {
      icon: Target,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      label: 'Available',
      description: 'This territory is available for claiming'
    };
  };

  // Get route status info
  const getRouteStatusInfo = (route: any) => {
    if (route.territory_claimed) {
      const statusInfo = {
        claimed: { icon: Shield, color: 'text-green-600', label: 'Territory Claimed' },
        contested: { icon: Swords, color: 'text-orange-600', label: 'Territory Contested' },
        neutral: { icon: Target, color: 'text-gray-600', label: 'No Territory Claimed' }
      };
      return statusInfo[route.territory_status] || statusInfo.neutral;
    }
    return {
      icon: Route,
      color: 'text-blue-600',
      label: 'Route Completed'
    };
  };

  // Route to Territory Navigation
  if (route && !territory) {
    const statusInfo = getRouteStatusInfo(route);
    const StatusIcon = statusInfo.icon;

    return (
      <Card className={className}>
        <CardHeader className={compact ? "pb-2" : undefined}>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Route className="w-4 h-4 text-blue-600" />
            Route Navigation
            <Badge variant="outline" className="ml-auto">
              {route.territory_claimed ? 'Territory Linked' : 'No Territory'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Route info */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-sm">
                {route.name || `Route ${route.id.slice(0, 8)}`}
              </h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <Ruler className="w-3 h-3" />
                {formatDistance(route.distance_meters)}
                {route.area_km2 && (
                  <>
                    <span>•</span>
                    <Target className="w-3 h-3" />
                    {route.area_km2.toFixed(2)} km²
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
              <span className="text-xs font-medium">{statusInfo.label}</span>
            </div>
          </div>

          {/* Territory status */}
          {route.territory_claimed && route.territory_id ? (
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Territory Created</span>
                  <Badge className="bg-green-100 text-green-800" variant="secondary">
                    {route.territory_status}
                  </Badge>
                </div>
                {showNavigationButtons && onNavigateToTerritory && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onNavigateToTerritory(route.territory_id!)}
                  >
                    <ArrowRight className="w-3 h-3 mr-1" />
                    View Territory
                  </Button>
                )}
              </div>
              {showDetails && (
                <p className="text-xs text-muted-foreground mt-2">
                  This route successfully created a territory. Click to view territory details and management options.
                </p>
              )}
            </div>
          ) : (
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium">No Territory Created</span>
              </div>
              {showDetails && (
                <p className="text-xs text-muted-foreground mt-2">
                  This route hasn't created a territory yet. Check if the route meets territory creation requirements.
                </p>
              )}
            </div>
          )}

          {/* Action buttons */}
          {showNavigationButtons && (
            <div className="flex gap-2">
              {onViewOnMap && (
                <Button variant="outline" size="sm" onClick={() => onViewOnMap(route.id)}>
                  <Eye className="w-3 h-3 mr-1" />
                  View on Map
                </Button>
              )}
              {route.territory_id && onNavigateToTerritory && (
                <Button size="sm" onClick={() => onNavigateToTerritory(route.territory_id!)}>
                  <Navigation className="w-3 h-3 mr-1" />
                  Go to Territory
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Territory to Route Navigation
  if (territory && !route) {
    const statusInfo = getTerritoryStatusInfo(territory);
    const StatusIcon = statusInfo.icon;

    return (
      <Card className={className}>
        <CardHeader className={compact ? "pb-2" : undefined}>
          <CardTitle className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-green-600" />
            Territory Navigation
            <Badge variant="outline" className="ml-auto">
              {territory.source_route_id ? 'Route Linked' : 'No Route'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Territory info */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-sm">
                {territory.name || `Territory ${territory.id.slice(0, 8)}`}
              </h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <Target className="w-3 h-3" />
                {formatArea(territory.area_sqm)}
                {territory.owner_username && (
                  <>
                    <span>•</span>
                    <User className="w-3 h-3" />
                    {territory.owner_username}
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
              <span className="text-xs font-medium">{statusInfo.label}</span>
            </div>
          </div>

          {/* Route status */}
          {territory.source_route_id ? (
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Route className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">Source Route Available</span>
                  <Badge className="bg-blue-100 text-blue-800" variant="secondary">
                    Linked
                  </Badge>
                </div>
                {showNavigationButtons && onNavigateToRoute && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onNavigateToRoute(territory.source_route_id!)}
                  >
                    <ArrowRight className="w-3 h-3 mr-1" />
                    View Route
                  </Button>
                )}
              </div>
              {showDetails && (
                <div className="text-xs text-muted-foreground mt-2 space-y-1">
                  <p>This territory was created from a completed route.</p>
                  {territory.claimed_at && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Claimed on {formatDate(territory.claimed_at)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium">No Source Route</span>
              </div>
              {showDetails && (
                <p className="text-xs text-muted-foreground mt-2">
                  This territory was created through other means (manual claim, admin action, etc.).
                </p>
              )}
            </div>
          )}

          {/* Conflict info */}
          {territory.is_contested && territory.conflicts && territory.conflicts.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Swords className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">Active Conflicts</span>
                <Badge className="bg-orange-100 text-orange-800" variant="secondary">
                  {territory.conflicts.filter(c => !c.is_resolved).length}
                </Badge>
              </div>
              {showDetails && (
                <p className="text-xs text-orange-700 mt-2">
                  This territory has competing claims that need resolution.
                </p>
              )}
            </div>
          )}

          {/* Action buttons */}
          {showNavigationButtons && (
            <div className="flex gap-2">
              {onViewOnMap && (
                <Button variant="outline" size="sm" onClick={() => onViewOnMap(undefined, territory.id)}>
                  <Eye className="w-3 h-3 mr-1" />
                  View on Map
                </Button>
              )}
              {territory.source_route_id && onNavigateToRoute && (
                <Button size="sm" onClick={() => onNavigateToRoute(territory.source_route_id!)}>
                  <Navigation className="w-3 h-3 mr-1" />
                  Go to Route
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Bidirectional navigation (both route and territory)
  if (route && territory) {
    return (
      <Card className={className}>
        <CardHeader className={compact ? "pb-2" : undefined}>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Navigation className="w-4 h-4" />
            Route ↔ Territory Navigation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Route section */}
          <div className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Route className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-sm">Route</span>
              </div>
              {showNavigationButtons && onNavigateToRoute && (
                <Button variant="outline" size="sm" onClick={() => onNavigateToRoute(route.id)}>
                  <ExternalLink className="w-3 h-3" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {route.name || `Route ${route.id.slice(0, 8)}`} • {formatDistance(route.distance_meters)}
            </p>
          </div>

          {/* Connection indicator */}
          <div className="flex items-center justify-center">
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </div>

          {/* Territory section */}
          <div className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-600" />
                <span className="font-medium text-sm">Territory</span>
              </div>
              {showNavigationButtons && onNavigateToTerritory && (
                <Button variant="outline" size="sm" onClick={() => onNavigateToTerritory(territory.id)}>
                  <ExternalLink className="w-3 h-3" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {territory.name || `Territory ${territory.id.slice(0, 8)}`} • {formatArea(territory.area_sqm)}
            </p>
          </div>

          {/* Combined actions */}
          {showNavigationButtons && onViewOnMap && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => onViewOnMap(route.id, territory.id)}
            >
              <Eye className="w-3 h-3 mr-1" />
              View Both on Map
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // No data provided
  return (
    <Card className={className}>
      <CardContent className="text-center py-8">
        <Navigation className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No route or territory data provided</p>
      </CardContent>
    </Card>
  );
};

export default RouteTerritoryNavigation;