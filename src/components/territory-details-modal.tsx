import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Navigation, 
  Shield, 
  Target, 
  AlertTriangle,
  Crown,
  Clock,
  TrendingUp
} from "lucide-react";

interface Territory {
  id: string;
  owner: string;
  area: string;
  status: string;
  color: string;
  path: string;
  center: { x: number; y: number };
}

interface TerritoryDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  territory: Territory | null;
}

const TerritoryDetailsModal = ({ isOpen, onClose, territory }: TerritoryDetailsModalProps) => {
  if (!territory) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'claimed': return <Shield className="w-5 h-5 text-territory-claimed" />;
      case 'enemy': return <Target className="w-5 h-5 text-destructive" />;
      case 'neutral': return <MapPin className="w-5 h-5 text-territory-neutral" />;
      case 'contested': return <AlertTriangle className="w-5 h-5 text-territory-contested" />;
      default: return <MapPin className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getActionButton = (status: string) => {
    switch (status) {
      case 'claimed':
        return (
          <Button className="w-full bg-territory-claimed/20 hover:bg-territory-claimed/30">
            <Shield className="w-4 h-4 mr-2" />
            Defend Territory
          </Button>
        );
      case 'enemy':
        return (
          <Button className="w-full bg-destructive/20 hover:bg-destructive/30">
            <Target className="w-4 h-4 mr-2" />
            Attack Territory
          </Button>
        );
      case 'neutral':
        return (
          <Button className="w-full bg-gradient-hero hover:shadow-glow">
            <Navigation className="w-4 h-4 mr-2" />
            Plan Route to Claim
          </Button>
        );
      case 'contested':
        return (
          <Button className="w-full bg-territory-contested/20 hover:bg-territory-contested/30">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Join Battle
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card/95 border-border/50 animate-scale-in">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon(territory.status)}
            Territory Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Territory Preview */}
          <div className="aspect-video bg-background/20 rounded-lg relative overflow-hidden">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 120">
              <path
                d={territory.path.replace(/(\d+)/g, (match) => String(parseInt(match) * 0.4))}
                fill={`hsl(var(--${territory.color}) / 0.3)`}
                stroke={`hsl(var(--${territory.color}))`}
                strokeWidth="2"
                className="animate-pulse"
              />
            </svg>
            <div className="absolute top-2 right-2">
              <Badge className={`bg-${territory.color}/20 text-${territory.color} border-${territory.color}/30`}>
                {territory.status}
              </Badge>
            </div>
          </div>

          {/* Territory Info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Owner</span>
              <span className={territory.owner === 'You' ? 'text-territory-claimed font-bold' : ''}>{territory.owner}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="font-medium">Area</span>
              <span className="text-primary font-bold">{territory.area}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="font-medium">Strategic Value</span>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-territory-contested" />
                <span className="font-bold">8.2/10</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium">Last Activity</span>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>2 hours ago</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            {getActionButton(territory.status)}
          </div>

          {/* Additional Info */}
          {territory.status === 'contested' && (
            <div className="p-3 bg-territory-contested/10 rounded-lg border border-territory-contested/20">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-4 h-4 text-territory-contested" />
                <span className="text-sm font-medium">Active Battle</span>
              </div>
              <p className="text-xs text-muted-foreground">
                This territory is currently under dispute. Join the battle to claim it!
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TerritoryDetailsModal;