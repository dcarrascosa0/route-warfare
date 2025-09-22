import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  X,
  MapPin,
  Shield,
  Users,
  Swords,
  Info,
  GitCommit,
  User,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import { Territory } from "@/types/territory";
import { useQuery } from "@tanstack/react-query";
import { GatewayAPI } from "@/lib/api";
import { queryKeys } from "@/lib/query";
import { useState } from "react";
import { LoadingSpinner } from "@/components/common";

interface TerritoryDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  territory: Territory | null;
  onNavigateToRoutes?: () => void;
  onNavigateToRoute?: (routeId: string) => void;
}

const TerritoryDetailsModal = ({ 
  isOpen, 
  onClose, 
  territory, 
  onNavigateToRoutes,
}: TerritoryDetailsModalProps) => {
  const [isRouteMapOpen, setIsRouteMapOpen] = useState(false);
  
  // Fetch detailed route info if a route is associated
  const { data: detailedRoute, isLoading: isRouteLoading } = useQuery({
    queryKey: queryKeys.route(territory?.route_id!, territory?.owner_id!),
    queryFn: () => GatewayAPI.getRouteDetail(territory!.route_id!, territory!.owner_id!),
    enabled: !!territory?.route_id && !!territory?.owner_id,
  });

  if (!territory) return null;

  const isOwned = territory.owner_id === localStorage.getItem("user_id");

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'claimed': return <Shield className="w-5 h-5 text-green-500" />;
      case 'contested': return <Swords className="w-5 h-5 text-red-500" />;
      case 'neutral': return <MapPin className="w-5 h-5 text-gray-500" />;
      default: return <MapPin className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getActionButton = (status: string, isOwned: boolean) => {
    const handleAction = (actionType: string) => {
      switch (actionType) {
        case "view_routes":
          onNavigateToRoutes?.();
          break;
        case "resolve_conflict":
          // onResolveConflict?.(territory.conflicts[0].id, 'negotiate');
          break;
        default:
          break;
      }
    };

    if (status === 'contested') {
      return (
        <Button onClick={() => handleAction("resolve_conflict")} className="w-full">
          Resolve Conflict
        </Button>
      );
    }
    return (
      <Button onClick={() => handleAction("view_routes")} className="w-full">
        View My Routes
      </Button>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  const formatFullDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${meters.toFixed(0)} m`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleNavigateToRoute = (routeId: string) => {
    if (onNavigateToRoute) {
      onNavigateToRoute(routeId);
      onClose();
    } else if (onNavigateToRoutes) {
      localStorage.setItem('selectedRouteId', routeId);
      onNavigateToRoutes();
      onClose();
      // toast.success("Navigating to route", {
      //   description: `Opening route ${routeId.slice(0, 8)} on Routes page`
      // });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md md:max-w-lg lg:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon(territory.status)}
            <span>Territory Details</span>
            {isOwned && <Shield className="w-4 h-4 text-green-500" />}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Territory Header */}
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold">
              {territory.name || `Territory ${territory.id.slice(0, 8)}`}
            </h3>
            <Badge className={`capitalize ${
              territory.status === 'claimed' ? 
                (isOwned ? 'bg-green-500/20 text-green-500' : 'bg-destructive/20 text-destructive') :
              territory.status === 'contested' ? 'bg-red-500/20 text-red-500' :
              'bg-gray-500/20 text-gray-500'
            }`}>
              {territory.status}
            </Badge>
          </div>

          {/* Territory Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-card/50">
              <CardContent className="p-4 text-center">
                <Shield className="w-6 h-6 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold text-primary">
                  {territory.area_km2.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">km² Area</div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50">
              <CardContent className="p-4 text-center">
                <User className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                <div className={`text-lg font-bold ${isOwned ? 'text-green-500' : 'text-muted-foreground'}`}>
                  {isOwned ? 'You' : territory.owner_username || 'Unknown'}
                </div>
                <div className="text-sm text-muted-foreground">Owner</div>
              </CardContent>
            </Card>
          </div>

          {/* Territory Information */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Claimed</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{formatDate(territory.claimed_at)}</div>
                <div className="text-xs text-muted-foreground">{formatFullDate(territory.claimed_at)}</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Last Activity</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{formatDate(territory.last_activity)}</div>
                <div className="text-xs text-muted-foreground">{formatFullDate(territory.last_activity)}</div>
              </div>
            </div>

            {territory.description && (
              <div className="space-y-2">
                <span className="font-medium">Description</span>
                <p className="text-sm text-muted-foreground p-3 bg-muted/20 rounded-lg">
                  {territory.description}
                </p>
              </div>
            )}
          </div>

          {/* Contested Territory Info */}
          {territory.status === 'contested' && territory.contested_by && (
            <Card className="bg-red-500/10 border-red-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Swords className="w-5 h-5 text-red-500" />
                  <span className="font-medium text-red-500">Active Battle</span>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    This territory is being contested by {territory.contested_by.length} player{territory.contested_by.length > 1 ? 's' : ''}
                  </p>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-medium">Battle intensity: High</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Button */}
          <div className="pt-2">
            {getActionButton(territory.status, isOwned)}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TerritoryDetailsModal;