import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, ShieldCheck, Play } from "lucide-react";

export default function FirstRunOnboarding({ onComplete }: { onComplete?: () => void }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem('onboarding_seen');
      if (!seen) setOpen(true);
    } catch {}
  }, []);

  const requestPermissions = async () => {
    try {
      // Trigger geolocation permission prompt
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(() => {}, () => {});
      }
    } finally {
      try { localStorage.setItem('onboarding_seen', '1'); } catch {}
      setOpen(false);
      onComplete?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Welcome to Route Wars</DialogTitle>
          <DialogDescription>Enable location to track closed loops and claim territory.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Your location is only used to track your runs.</div>
          <div>Start your first run and complete a loop to claim your first zone.</div>
        </div>

        <div className="flex gap-2 justify-end mt-4">
          <Button variant="outline" onClick={() => { setOpen(false); onComplete?.(); }}>Maybe later</Button>
          <Button className="bg-gradient-hero hover:shadow-glow" onClick={requestPermissions}><Play className="w-4 h-4 mr-1" /> Get Started</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


