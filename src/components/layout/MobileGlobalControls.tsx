import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Settings, ChevronDown, ChevronUp } from "lucide-react";
import { useGlobalControls } from "@/contexts/GlobalControlsContext";

export default function MobileGlobalControls() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { period, setPeriod, live, setLive } = useGlobalControls();

  return (
    <div className="md:hidden fixed bottom-4 right-4 z-40">
      {/* Floating Controls Button */}
      <Button
        variant="default"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="rounded-full shadow-lg"
      >
        <Settings className="w-4 h-4 mr-2" />
        Controls
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 ml-2" />
        ) : (
          <ChevronUp className="w-4 h-4 ml-2" />
        )}
      </Button>

      {/* Expanded Controls Panel */}
      {isExpanded && (
        <div className="absolute bottom-12 right-0 bg-background border border-border rounded-lg shadow-lg p-4 min-w-[200px]">
          {/* Period Selector */}
          <div className="mb-4">
            <div className="text-xs font-medium mb-2 text-muted-foreground">Period</div>
            <div className="flex flex-col gap-2">
              {([
                { id: "ALL_TIME", label: "All Time" },
                { id: "MONTHLY", label: "This Month" },
                { id: "WEEKLY", label: "This Week" },
              ] as const).map((opt) => (
                <Button
                  key={opt.id}
                  size="sm"
                  variant={period === opt.id ? "default" : "outline"}
                  onClick={() => setPeriod(opt.id as any)}
                  className="justify-start"
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Live Toggle */}
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-muted-foreground">Live Updates</div>
            <Switch checked={live} onCheckedChange={setLive} />
          </div>
        </div>
      )}
    </div>
  );
}