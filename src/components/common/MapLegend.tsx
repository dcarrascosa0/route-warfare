import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, MapPin } from "lucide-react";

interface MapLegendProps {
  className?: string;
}

export function MapLegend({ className }: MapLegendProps) {
  return (
    <Card className={`bg-card/80 backdrop-blur-md border border-border/50 shadow-glow ${className || ''}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="text-sm font-semibold text-foreground flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Territory Legend
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-4 h-3 bg-primary/30 border-2 border-primary rounded-sm shadow-glow" />
              <span className="text-foreground font-medium">Your Territories</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-3 bg-cyan-500/20 border-2 border-cyan-500 rounded-sm" />
              <span className="text-muted-foreground">Other Territories</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-3 bg-orange-500/30 border-2 border-orange-500 rounded-sm" style={{ borderStyle: 'dashed' }} />
              <span className="text-orange-500 font-medium flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Contested
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default MapLegend;


