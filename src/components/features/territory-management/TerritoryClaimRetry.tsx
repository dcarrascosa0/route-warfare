import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  RefreshCw, 
  AlertTriangle, 
  Target, 
  XCircle, 
  CheckCircle,
  Route,
  Gauge,
  TrendingUp,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { GatewayAPI } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

interface RouteData {
  id: string;
  name?: string;
  description?: string;
  status: "active" | "completed" | "abandoned";
  created_at: string;
  updated_at: string;
  completed_at?: string;
  territory_id?: string;
  territory_claim_status: "pending" | "success" | "failed" | "conflict";
  territory_claim_error?: string;
  auto_claim_attempted: boolean;
  stats: {
    distance_meters: number | null;
    duration_seconds?: number | null;
    coordinate_count: number | null;
    is_closed_loop: boolean;
    territory_area_km2?: number | null;
    gps_quality_score?: number | null;
    territory_eligibility_score?: number | null;
    coordinate_quality_issues?: string[];
  };
}

interface TerritoryClaimRetryProps {
  route: RouteData;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (territoryId: string) => void;
  onViewRoute?: (routeId: string) => void;
}

const TerritoryClaimRetry: React.FC<TerritoryClaimRetryProps> = ({
  route,
  isOpen,
  onClose,
  onSuccess,
  onViewRoute
}) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryResult, setRetryResult] = useState<{
    success: boolean;
    territoryId?: string;
    error?: string;
  } | null>(null);

  const queryClient = useQueryClient();
  const userId = localStorage.getItem("user_id");

  const formatDistance = (meters: number | null) => {
    if (meters == null) return "—";
    if (meters < 1000) return `${meters.toFixed(0)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "—";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getQualityColor = (score?: number) => {
    if (!score) return 'text-muted-foreground';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityIcon = (score?: number) => {
    if (!score) return <Gauge className="w-4 h-4 text-muted-foreground" />;
    if (score >= 80) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (score >= 60) return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    return <XCircle className="w-4 h-4 text-red-600" />;
  };

  const handleRetryTerritoryClaimFromRoute = async () => {
    if (!userId || !route.stats.is_closed_loop) {
      toast.error("Cannot retry territory claiming", {
        description: "Route must be a closed loop to claim territory"
      });
      return;
    }

    setIsRetrying(true);
    setRetryResult(null);

    try {
      // Get route coordinates for territory claiming
      const routeDetails = await GatewayAPI.getRouteDetail(route.id, userId);
      
      if (!routeDetails.ok || !routeDetails.data?.coordinates) {
        throw new Error("Cannot retrieve route coordinates for territory claiming");
      }

      const coordinates = routeDetails.data.coordinates;
      
      // Convert coordinates to boundary format
      const boundaryCoordinates = coordinates.map((coord: any) => ({
        longitude: coord.longitude,
        latitude: coord.latitude
      }));

      // Attempt territory claiming
      const claimResult = await GatewayAPI.claimTerritoryFromRoute(userId, {
        route_id: route.id,
        boundary_coordinates: boundaryCoordinates,
        name: `Territory from ${route.name || `Route ${route.id.slice(0, 8)}`}`,
        description: `Territory claimed from completed route on ${new Date(route.completed_at || route.created_at).toLocaleDateString()}`
      });

      if (claimResult.ok) {
        const territoryId = (claimResult.data as any)?.id || (claimResult.data as any)?.territory?.id;
        setRetryResult({
          success: true,
          territoryId: territoryId
        });
        
        // Refresh route data to show updated claim status
        queryClient.invalidateQueries({ queryKey: ["routes", userId] });
        queryClient.invalidateQueries({ queryKey: ["territories"] });
        queryClient.invalidateQueries({ queryKey: ["userTerritories", userId] });

        toast.success("Territory claimed successfully!", {
          description: "Your route has been converted to territory"
        });

        if (onSuccess && territoryId) {
          onSuccess(territoryId);
        }
      } else {
        let errorMessage = "Unknown error occurred";
        
        if (claimResult.error) {
          if (typeof claimResult.error === 'string') {
            errorMessage = claimResult.error;
          } else if (claimResult.error && typeof claimResult.error === 'object') {
            const errorObj = claimResult.error as any;
            if (errorObj.message) {
              errorMessage = errorObj.message;
            } else if (errorObj.detail) {
              errorMessage = errorObj.detail;
            } else {
              errorMessage = JSON.stringify(claimResult.error);
            }
          }
        }
        
        setRetryResult({
          success: false,
          error: errorMessage
        });
        
        toast.error("Territory claiming failed", {
          description: errorMessage
        });
      }
    } catch (error: any) {
      console.error("Error retrying territory claim:", error);
      
      let errorMessage = "An unexpected error occurred";
      if (error && typeof error === 'object') {
        if (error.message) {
          errorMessage = error.message;
        } else if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (error.error && error.error.detail) {
          errorMessage = error.error.detail;
        } else {
          errorMessage = JSON.stringify(error);
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setRetryResult({
        success: false,
        error: errorMessage
      });
      
      toast.error("Failed to retry territory claim", {
        description: errorMessage
      });
    } finally {
      setIsRetrying(false);
    }
  };

  const handleViewTerritory = (territoryId: string) => {
    // Store the territory ID for highlighting and navigate
    localStorage.setItem('highlightTerritoryId', territoryId);
    window.location.href = `/territory?highlight=${territoryId}`;
    onClose();
  };

  const handleViewRoute = () => {
    if (onViewRoute) {
      onViewRoute(route.id);
    } else {
      // Fallback navigation
      localStorage.setItem('selectedRouteId', route.id);
      window.location.href = '/routes';
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-card/95 border-border/50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-orange-600" />
            Retry Territory Claiming
          </DialogTitle>
          <DialogDescription>
            Attempt to claim territory again for this completed route
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Route Information */}
          <Card className="bg-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <Route className="w-5 h-5 text-primary" />
                  Route Details
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleViewRoute}
                  className="text-primary hover:text-primary/80"
                >
                  <Route className="w-4 h-4 mr-1" />
                  View Route
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Route Name</span>
                  <span className="text-sm text-muted-foreground">
                    {route.name || `Route ${route.id.slice(0, 8)}`}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <Badge variant={route.status === 'completed' ? 'default' : 'secondary'}>
                    {route.status}
                  </Badge>
                </div>
              </div>

              {/* Route Statistics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-2 bg-card/50 rounded-lg">
                  <div className="text-lg font-bold text-primary">
                    {formatDistance(route.stats.distance_meters)}
                  </div>
                  <div className="text-xs text-muted-foreground">Distance</div>
                </div>
                
                <div className="text-center p-2 bg-card/50 rounded-lg">
                  <div className="text-lg font-bold">
                    {formatDuration(route.stats.duration_seconds)}
                  </div>
                  <div className="text-xs text-muted-foreground">Duration</div>
                </div>

                <div className="text-center p-2 bg-card/50 rounded-lg">
                  <div className="text-lg font-bold">
                    {route.stats.coordinate_count || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">GPS Points</div>
                </div>

                <div className="text-center p-2 bg-card/50 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {getQualityIcon(route.stats.gps_quality_score ? route.stats.gps_quality_score * 100 : undefined)}
                  </div>
                  <div className={`text-lg font-bold ${getQualityColor(route.stats.gps_quality_score ? route.stats.gps_quality_score * 100 : undefined)}`}>
                    {route.stats.gps_quality_score ? 
                      `${(route.stats.gps_quality_score * 100).toFixed(0)}%` : 
                      'N/A'
                    }
                  </div>
                  <div className="text-xs text-muted-foreground">GPS Quality</div>
                </div>
              </div>

              {/* Territory Eligibility */}
              {route.stats.territory_eligibility_score && (
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <div className="text-sm font-medium mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Territory Eligibility
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Eligibility Score:</span>
                    <Badge variant={route.stats.territory_eligibility_score > 0.7 ? "default" : "secondary"} className="text-xs">
                      {(route.stats.territory_eligibility_score * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <div className="w-full bg-muted/50 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${route.stats.territory_eligibility_score * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Previous Failure Information */}
          {route.territory_claim_error && (
            <Card className="bg-red-50 border-red-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base text-red-800">
                  <XCircle className="w-5 h-5" />
                  Previous Failure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-red-700 bg-red-100 p-3 rounded-lg border border-red-200">
                  {typeof route.territory_claim_error === 'string' 
                    ? route.territory_claim_error 
                    : route.territory_claim_error 
                      ? JSON.stringify(route.territory_claim_error)
                      : 'Unknown error'
                  }
                </div>
              </CardContent>
            </Card>
          )}

          {/* Retry Result */}
          {retryResult && (
            <Card className={retryResult.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
              <CardHeader className="pb-3">
                <CardTitle className={`flex items-center gap-2 text-base ${retryResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {retryResult.success ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Territory Claimed Successfully!
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5" />
                      Territory Claiming Failed
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {retryResult.success ? (
                  <div className="space-y-3">
                    <p className="text-sm text-green-700">
                      Your route has been successfully converted to territory.
                    </p>
                    {retryResult.territoryId && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleViewTerritory(retryResult.territoryId!)}
                      >
                        <Target className="w-4 h-4 mr-2" />
                        View Territory
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-red-700 bg-red-100 p-3 rounded-lg border border-red-200">
                    {retryResult.error}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Information */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Territory Claiming Process</p>
                  <p>
                    This will attempt to create a territory using your route's GPS coordinates. 
                    The system will validate the route quality and check for conflicts with existing territories.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isRetrying}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-orange-600 hover:bg-orange-700"
              onClick={handleRetryTerritoryClaimFromRoute}
              disabled={isRetrying || !route.stats.is_closed_loop}
            >
              {isRetrying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry Territory Claim
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TerritoryClaimRetry;