import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Route, 
  Clock, 
  MapPin, 
  Calendar,
  Eye,
  Play,
  Square
} from "lucide-react";
import { RouteDetail } from "./types";

interface RouteListProps {
  routes: RouteDetail[];
  onRouteSelect?: (route: RouteDetail) => void;
  onRouteView?: (route: RouteDetail) => void;
  showActions?: boolean;
  className?: string;
}

export default function RouteList({ 
  routes, 
  onRouteSelect, 
  onRouteView,
  showActions = true,
  className 
}: RouteListProps) {
  // Format distance
  const formatDistance = (meters: number | null): string => {
    if (!meters) return "0 m";
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(2)} km`;
  };

  // Format duration
  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return "0s";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'abandoned':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="h-3 w-3" />;
      case 'completed':
        return <Square className="h-3 w-3" />;
      case 'abandoned':
        return <Square className="h-3 w-3" />;
      default:
        return <Route className="h-3 w-3" />;
    }
  };

  if (routes.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-muted-foreground">
            <Route className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No routes found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Route className="h-5 w-5" />
          Routes ({routes.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {routes.map((route) => (
          <div
            key={route.id}
            className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">
                    {route.name || `Route ${route.id.slice(0, 8)}`}
                  </h3>
                  <Badge variant={getStatusColor(route.status)} className="flex items-center gap-1">
                    {getStatusIcon(route.status)}
                    {route.status}
                  </Badge>
                </div>
                {route.description && (
                  <p className="text-sm text-muted-foreground">
                    {route.description}
                  </p>
                )}
              </div>
              {showActions && (
                <div className="flex gap-1">
                  {onRouteView && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRouteView(route)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Route className="h-3 w-3" />
                  Distance
                </div>
                <div className="font-medium">
                  {formatDistance(route.stats.distance_meters)}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Duration
                </div>
                <div className="font-medium">
                  {formatDuration(route.stats.duration_seconds)}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  Points
                </div>
                <div className="font-medium">
                  {route.stats.coordinate_count || 0}
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Created: {new Date(route.created_at).toLocaleDateString()}
              </div>
              {route.completed_at && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Completed: {new Date(route.completed_at).toLocaleDateString()}
                </div>
              )}
            </div>

            {/* Territory Claim Result */}
            {route.territory_claim_result && (
              <div className="pt-2 border-t">
                <Badge 
                  variant={route.territory_claim_result.success ? "default" : "destructive"}
                  className="text-xs"
                >
                  {route.territory_claim_result.success ? "Territory Claimed" : "Claim Failed"}
                </Badge>
                {route.territory_claim_result.success && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Area: {(route.territory_claim_result.area_sqm / 1000000).toFixed(3)} km²
                  </div>
                )}
              </div>
            )}

            {/* Click handler */}
            {onRouteSelect && (
              <Button
                variant="ghost"
                className="w-full mt-2"
                onClick={() => onRouteSelect(route)}
              >
                Select Route
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}