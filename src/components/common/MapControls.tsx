import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Maximize2, Minimize2, RotateCcw, ZoomIn, ZoomOut, Layers, Crosshair } from "lucide-react";

interface MapControlsProps {
  className?: string;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onRecenter?: () => void;
  onFit?: () => void;
  onToggleLayer?: () => void;
  onToggleGrid?: () => void;
  fullscreenEnabled?: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const MapControls = ({
  className,
  onZoomIn,
  onZoomOut,
  onRecenter,
  onFit,
  onToggleLayer,
  onToggleGrid,
  fullscreenEnabled = false,
  isFullscreen = false,
  onToggleFullscreen,
}: MapControlsProps) => {
  return (
    <div className={cn("absolute top-4 right-4 z-[1000] flex flex-col gap-2", className)}>
      <Card className="p-1">
        <div className="flex flex-col gap-1">
          <Button variant="ghost" size="sm" onClick={onZoomIn} className="h-8 w-8 p-0" title="Zoom In">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onZoomOut} className="h-8 w-8 p-0" title="Zoom Out">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onFit} className="h-8 w-8 p-0" title="Fit">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onRecenter} className="h-8 w-8 p-0" title="Recenter">
            <Crosshair className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onToggleLayer} className="h-8 w-8 p-0" title="Toggle Layer">
            <Layers className="h-4 w-4" />
          </Button>
          {fullscreenEnabled && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleFullscreen}
              className="h-8 w-8 p-0"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default MapControls;


