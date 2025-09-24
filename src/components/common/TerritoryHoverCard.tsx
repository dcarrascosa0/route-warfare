import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { UnitsFormatter } from "@/lib/format/units";

export interface TerritoryBrief {
  id: string;
  name?: string;
  owner_name: string;
  area_square_meters: number;
}

interface TerritoryHoverCardProps {
  territory: TerritoryBrief;
  onViewDetails?: () => void;
}

export function TerritoryHoverCard({ territory, onViewDetails }: TerritoryHoverCardProps) {
  return (
    <div className="min-w-48 bg-card/95 backdrop-blur-md border border-border/50 rounded-lg p-4 shadow-glow">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-3 h-3 rounded-full bg-primary shadow-glow`} />
        <div className="font-semibold text-foreground">
          {territory.name || `Territory ${territory.id.slice(0, 8)}`}
        </div>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Owner:</span>
          <span className="font-medium text-foreground">{territory.owner_name}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Area:</span>
          <span className="font-medium text-foreground">{UnitsFormatter.areaSquareMeters(territory.area_square_meters)}</span>
        </div>
        {/* no contested state */}
      </div>
      {onViewDetails && (
        <Button
          size="sm"
          className="w-full mt-3 bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary hover:text-primary-foreground transition-all duration-200"
          onClick={onViewDetails}
        >
          <Eye className="h-3 w-3 mr-2" />
          View Details
        </Button>
      )}
    </div>
  );
}

export default TerritoryHoverCard;


