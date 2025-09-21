import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Play, Square, Pause, MapPin, AlertTriangle } from "lucide-react";
import { useRouteTracker } from "@/hooks/useRouteTracker";
import { useAuth } from "@/hooks/useAuth";
import { RouteTrackerProps } from "./types";
import GPSStatus from "./GPSStatus";
import RouteProgress from "./RouteProgress";

export default function RouteTracker({ 
  onRouteUpdate, 
  onRouteComplete, 
  isActive = false,
  className 
}: RouteTrackerProps & { className?: string }) {
  const { user } = useAuth();
  const userId = user?.id;
  
  const {
    isTracking,
    startedAt,
    elapsedMs,
    routeId,
    start,
    stop,
    error: trackerError
  } = useRouteTracker(userId);

  const [routeName, setRouteName] = useState("");
  const [routeDescription, setRouteDescription] = useState("");
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  // Handle route start
  const handleStartRoute = async () => {
    if (!userId) return;
    
    setIsStarting(true);
    try {
      const success = await start({
        name: routeName.trim() || undefined,
        description: routeDescription.trim() || undefined
      });
      
      if (success) {
        setIsStartDialogOpen(false);
        setRouteName("");
        setRouteDescription("");
      }
    } catch (error) {
      console.error("Failed to start route:", error);
    } finally {
      setIsStarting(false);
    }
  };

  // Handle route stop
  const handleStopRoute = async () => {
    if (!routeId) return;
    
    setIsStopping(true);
    try {
      const route = await stop();
      if (onRouteComplete) {
        onRouteComplete();
      }
    } catch (error) {
      console.error("Failed to stop route:", error);
    } finally {
      setIsStopping(false);
    }
  };

  // Format elapsed time
  const formatElapsedTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Route Tracker
          {isTracking && (
            <Badge variant="default" className="bg-green-500">
              Recording
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {trackerError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{trackerError}</AlertDescription>
          </Alert>
        )}

        <GPSStatus />

        {isTracking && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              Started: {startedAt ? new Date(startedAt).toLocaleTimeString() : 'Unknown'}
            </div>
            <div className="text-lg font-mono">
              {formatElapsedTime(elapsedMs)}
            </div>
            {/* Route progress will be shown in the main routes dashboard */}
          </div>
        )}

        <div className="flex gap-2">
          {!isTracking ? (
            <Dialog open={isStartDialogOpen} onOpenChange={setIsStartDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex-1" disabled={!userId}>
                  <Play className="h-4 w-4 mr-2" />
                  Start Route
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start New Route</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="route-name">Route Name (Optional)</Label>
                    <Input
                      id="route-name"
                      value={routeName}
                      onChange={(e) => setRouteName(e.target.value)}
                      placeholder="Enter route name..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="route-description">Description (Optional)</Label>
                    <Textarea
                      id="route-description"
                      value={routeDescription}
                      onChange={(e) => setRouteDescription(e.target.value)}
                      placeholder="Enter route description..."
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleStartRoute}
                      disabled={isStarting}
                      className="flex-1"
                    >
                      {isStarting ? "Starting..." : "Start Recording"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsStartDialogOpen(false)}
                      disabled={isStarting}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <Button
              variant="destructive"
              onClick={handleStopRoute}
              disabled={isStopping}
              className="flex-1"
            >
              <Square className="h-4 w-4 mr-2" />
              {isStopping ? "Stopping..." : "Stop Route"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}