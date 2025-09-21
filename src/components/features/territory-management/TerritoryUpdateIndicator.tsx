import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  Shield, 
  Swords, 
  AlertTriangle, 
  CheckCircle,
  Crown,
  Zap,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TerritoryUpdate {
  id: string;
  territoryId: string;
  type: 'claimed' | 'attacked' | 'contested' | 'lost' | 'resolved';
  message: string;
  timestamp: string;
  priority: 'low' | 'medium' | 'high';
  autoHide?: boolean;
  duration?: number;
}

interface TerritoryUpdateIndicatorProps {
  update: TerritoryUpdate;
  onDismiss: () => void;
  className?: string;
}

const TerritoryUpdateIndicator: React.FC<TerritoryUpdateIndicatorProps> = ({
  update,
  onDismiss,
  className = ""
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  // Auto-hide after duration
  useEffect(() => {
    if (update.autoHide !== false) {
      const duration = update.duration || 5000;
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [update.autoHide, update.duration]);

  // Animation effect
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300); // Allow fade out animation
  };

  // Get update icon and styling
  const getUpdateInfo = () => {
    switch (update.type) {
      case 'claimed':
        return {
          icon: Shield,
          color: 'text-green-600',
          bgColor: 'bg-green-50 border-green-200',
          badgeColor: 'bg-green-100 text-green-800'
        };
      case 'attacked':
      case 'contested':
        return {
          icon: Swords,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50 border-orange-200',
          badgeColor: 'bg-orange-100 text-orange-800'
        };
      case 'lost':
        return {
          icon: TrendingDown,
          color: 'text-red-600',
          bgColor: 'bg-red-50 border-red-200',
          badgeColor: 'bg-red-100 text-red-800'
        };
      case 'resolved':
        return {
          icon: CheckCircle,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 border-blue-200',
          badgeColor: 'bg-blue-100 text-blue-800'
        };
      default:
        return {
          icon: AlertTriangle,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50 border-gray-200',
          badgeColor: 'bg-gray-100 text-gray-800'
        };
    }
  };

  // Get priority styling
  const getPriorityInfo = () => {
    switch (update.priority) {
      case 'high':
        return {
          borderColor: 'border-l-red-500',
          pulseColor: 'animate-pulse'
        };
      case 'medium':
        return {
          borderColor: 'border-l-orange-500',
          pulseColor: ''
        };
      case 'low':
        return {
          borderColor: 'border-l-blue-500',
          pulseColor: ''
        };
      default:
        return {
          borderColor: 'border-l-gray-500',
          pulseColor: ''
        };
    }
  };

  const updateInfo = getUpdateInfo();
  const priorityInfo = getPriorityInfo();
  const IconComponent = updateInfo.icon;

  // Format timestamp
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Card 
      className={cn(
        "mb-2 shadow-lg transition-all duration-300 border-l-4",
        updateInfo.bgColor,
        priorityInfo.borderColor,
        priorityInfo.pulseColor,
        isAnimating && "animate-bounce",
        !isVisible && "opacity-0 translate-x-full",
        className
      )}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1">
            <IconComponent className={cn("w-4 h-4 mt-0.5", updateInfo.color)} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge 
                  variant="secondary" 
                  className={cn("text-xs", updateInfo.badgeColor)}
                >
                  {update.type.charAt(0).toUpperCase() + update.type.slice(1)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatTime(update.timestamp)}
                </span>
              </div>
              <p className="text-sm font-medium leading-tight">
                {update.message}
              </p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
            onClick={handleDismiss}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>

        {/* Priority indicator */}
        {update.priority === 'high' && (
          <div className="flex items-center gap-1 mt-2 text-xs text-red-600">
            <Zap className="w-3 h-3" />
            <span className="font-medium">High Priority</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TerritoryUpdateIndicator;