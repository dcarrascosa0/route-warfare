import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { territoryTracking } from "@/lib/utils/tracking";

interface MapLegendProps {
  className?: string;
}

export function MapLegend({ className }: MapLegendProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (open: boolean) => {
    setIsOpen(open);
    territoryTracking.legendToggle(open);
  };

  return (
    <Card className={`bg-card/80 backdrop-blur-md border border-border/50 shadow-glow ${className || ''}`}>
      <Collapsible open={isOpen} onOpenChange={handleToggle}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full justify-between p-4 h-auto focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-expanded={isOpen}
            aria-controls="legend-content"
          >
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Legend</span>
            </div>
            <ChevronDown 
              className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent id="legend-content">
          <CardContent className="pt-0 pb-4 px-4">
            <div className="grid grid-cols-2 gap-3 text-xs" role="list" aria-label="Territory legend">
              <div className="flex items-center gap-2" role="listitem">
                <div 
                  className="w-4 h-3 bg-primary/30 border-2 border-primary rounded-sm shadow-glow" 
                  aria-hidden="true"
                />
                <span className="text-foreground font-medium">
                  Mine
                  <span className="sr-only"> - Your claimed territories</span>
                </span>
              </div>
              <div className="flex items-center gap-2" role="listitem">
                <div 
                  className="w-4 h-3 bg-cyan-500/20 border-2 border-cyan-500 rounded-sm" 
                  aria-hidden="true"
                />
                <span className="text-muted-foreground">
                  Others
                  <span className="sr-only"> - Territories claimed by other users</span>
                </span>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export default MapLegend;


