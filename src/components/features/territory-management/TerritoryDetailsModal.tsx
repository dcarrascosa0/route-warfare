import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MapPin, 
  Navigation, 
  Shield, 
  Target, 
  AlertTriangle,
  Crown,
  Clock,
  TrendingUp,
  User,
  Calendar,
  BarChart3,
  Swords,
  Route,
  History,
  Zap,
  Ruler,
  Timer,
  CheckCircle,
  XCircle,
  MapIcon,
  Gauge,
  GitBranch,
  Map,
  Activity,
  ArrowRight,
  ExternalLink,
  PlayCircle,
  StopCircle
} from "lucide-react";
import { Territory } from "./types";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { GatewayAPI } from "@/lib/api";

interface TerritoryDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  territory: Territory | null;
  onViewRoute?: (routeId: string) => void;
  onResolveConflict?: (conflictId: string, method: string) => void;
  onNavigateToRoutes?: () => void;
  onNavigateToRoute?: (routeId: string) => void;
}

const TerritoryDetailsModal = ({ 
  isOpen, 
  onClose, 
  territory, 
  onViewRoute,
  onResolveConflict,
  onNavigateToRoutes,
  onNavigateToRoute 
}: TerritoryDetailsModalProps) => {
  const [isRouteMapOpen, setIsRouteMapOpen] = useState(false);
  
  if (!territory) return null;

  const currentUserId = localStorage.getItem("user_id");
  const isOwned = territory?.owner_id === currentUserId;

  // Fetch detailed route information if source route exists
  const { data: routeDetails } = useQuery({
    queryKey: ["routeDetails", territory.route_id, currentUserId],
    queryFn: () => territory.route_id && currentUserId ? 
      GatewayAPI.getRouteDetail(territory.route_id, currentUserId) : 
      Promise.resolve({ ok: false } as any),
    enabled: !!territory.route_id && !!currentUserId,
  });

  const detailedRoute = routeDetails?.ok ? routeDetails.data : null;

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
        case 'defend':
          toast.success("Defense mode activated", { 
            description: "You'll be notified of any attacks on this territory" 
          });
          break;
        case 'challenge':
          toast.info("Challenge initiated", { 
            description: "Plan a route around this territory to contest it" 
          });
          break;
        case 'claim':
          toast.info("Route planner opened", { 
            description: "Create a closed-loop route to claim this territory" 
          });
          break;
        case 'join':
          toast.info("Joining battle", { 
            description: "Complete a route to join the contest for this territory" 
          });
          break;
      }
      onClose();
    };

    if (isOwned) {
      return (
        <Button 
          className="w-full bg-green-500/20 hover:bg-green-500/30"
          onClick={() => handleAction('defend')}
        >
          <Shield className="w-4 h-4 mr-2" />
          Defend Territory
        </Button>
      );
    }

    switch (status) {
      case 'claimed':
        return (
          <Button 
            className="w-full bg-destructive/20 hover:bg-destructive/30"
            onClick={() => handleAction('challenge')}
          >
            <Target className="w-4 h-4 mr-2" />
            Challenge Territory
          </Button>
        );
      case 'neutral':
        return (
          <Button 
            className="w-full bg-primary hover:bg-primary/90"
            onClick={() => handleAction('claim')}
          >
            <Navigation className="w-4 h-4 mr-2" />
            Plan Route to Claim
          </Button>
        );
      case 'contested':
        return (
          <Button 
            className="w-full bg-red-500/20 hover:bg-red-500/30"
            onClick={() => handleAction('join')}
          >
            <Swords className="w-4 h-4 mr-2" />
            Join Battle
          </Button>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const formatFullDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
      toast.success("Navigating to route", {
        description: `Opening route ${routeId.slice(0, 8)} on Routes page`
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-card/95 border-border/50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon(territory.status)}
            <span>Territory Details</span>
            {isOwned && <Crown className="w-4 h-4 text-green-500" />}
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
                <BarChart3 className="w-6 h-6 mx-auto mb-2 text-primary" />
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
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Claimed</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{formatDate(territory.claimed_at)}</div>
                <div className="text-xs text-muted-foreground">{formatFullDate(territory.claimed_at)}</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
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
                    <TrendingUp className="w-4 h-4 text-red-500" />
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