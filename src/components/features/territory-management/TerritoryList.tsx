import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  User, 
  Calendar,
  MapPin,
  Eye,
  AlertTriangle
} from "lucide-react";
import { Territory } from "./types";

interface TerritoryListProps {
  territories: Territory[];
  onTerritorySelect?: (territory: Territory) => void;
  showOwnership?: boolean;
  className?: string;
}

export default function TerritoryList({ 
  territories, 
  onTerritorySelect,
  showOwnership = true,
  className 
}: TerritoryListProps) {
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'claimed':
        return 'default';
      case 'contested':
        return 'destructive';
      case 'neutral':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'claimed':
        return <Shield className="h-3 w-3" />;
      case 'contested':
        return <AlertTriangle className="h-3 w-3" />;
      case 'neutral':
        return <MapPin className="h-3 w-3" />;
      default:
        return <Shield className="h-3 w-3" />;
    }
  };

  if (territories.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No territories found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Territories ({territories.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {territories.map((territory) => (
          <div
            key={territory.id}
            className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">
                    {territory.name || `Territory ${territory.id.slice(0, 8)}`}
                  </h3>
                  <Badge variant={getStatusColor(territory.status)} className="flex items-center gap-1">
                    {getStatusIcon(territory.status)}
                    {territory.status}
                  </Badge>
                </div>
                {territory.description && (
                  <p className="text-sm text-muted-foreground">
                    {territory.description}
                  </p>
                )}
              </div>
              {onTerritorySelect && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onTerritorySelect(territory)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  Area
                </div>
                <div className="font-medium">
                  {territory.area_km2.toFixed(3)} km²
                </div>
              </div>
              
              {showOwnership && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <User className="h-3 w-3" />
                    Owner
                  </div>
                  <div className="font-medium">
                    {territory.owner_username || territory.owner_id.slice(0, 8)}
                  </div>
                </div>
              )}
            </div>

            {/* Contested by */}
            {territory.contested_by && territory.contested_by.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <AlertTriangle className="h-3 w-3" />
                  Contested by
                </div>
                <div className="flex flex-wrap gap-1">
                  {territory.contested_by.map((userId, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {userId.slice(0, 8)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Claimed: {new Date(territory.claimed_at).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Last Activity: {new Date(territory.last_activity).toLocaleDateString()}
              </div>
            </div>

            {/* Select button */}
            {onTerritorySelect && (
              <Button
                variant="ghost"
                className="w-full mt-2"
                onClick={() => onTerritorySelect(territory)}
              >
                View Territory
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}