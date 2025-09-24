import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, User, Ruler, AlertTriangle, Share2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ZoneData {
  id: string;
  name?: string;
  owner_name: string;
  area_square_meters: number;
  contested: boolean;
  contest_count: number;
}

interface ZoneDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zone?: ZoneData | null;
  onViewDetails?: (zoneId: string) => void;
  onShare?: (zoneId: string) => void;
}

import { UnitsFormatter } from "@/lib/format/units";
const formatArea = (sqm: number) => UnitsFormatter.areaSquareMeters(sqm);

export function ZoneDrawer({ open, onOpenChange, zone, onViewDetails, onShare }: ZoneDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {zone?.name || (zone ? `Territory ${zone.id.slice(0, 8)}` : 'Territory')}
          </SheetTitle>
        </SheetHeader>

        {zone && (
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={zone.contested ? "destructive" : "secondary"} className={cn(zone.contested && "bg-orange-500 hover:bg-orange-600")}> 
                {zone.contested ? "Contested" : "Claimed"}
              </Badge>
              {zone.contested && (
                <Badge variant="outline" className="text-orange-500">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {zone.contest_count} conflicts
                </Badge>
              )}
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Owner:</span>
                <span className="font-medium">{zone.owner_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Ruler className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Area:</span>
                <span className="font-medium">{formatArea(zone.area_square_meters)}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => zone && onViewDetails?.(zone.id)}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View Details
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => zone && onShare?.(zone.id)}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default ZoneDrawer;


