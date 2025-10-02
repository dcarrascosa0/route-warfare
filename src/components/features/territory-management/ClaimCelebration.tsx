import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Share2, MapPin } from "lucide-react";

export default function ClaimCelebration({
  isOpen,
  onClose,
  territoryId,
  onViewTerritory,
}: {
  isOpen: boolean;
  onClose: () => void;
  territoryId: string | null;
  onViewTerritory: (territoryId: string) => void;
}) {
  const share = async () => {
    if (!territoryId) return;
    const url = `${window.location.origin}/territory/map?highlight=${territoryId}`;
    try {
      if ((navigator as any).share) {
        await (navigator as any).share({ title: "I claimed a territory on Route Wars!", url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {}
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-territory-claimed" />
            Territory Claimed!
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Great loop! Your route closed and you captured a new zone.</p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={share} className="flex items-center gap-1">
              <Share2 className="w-4 h-4" /> Share
            </Button>
            {territoryId && (
              <Button onClick={() => onViewTerritory(territoryId)} className="flex items-center gap-1">
                <MapPin className="w-4 h-4" /> View Territory
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


