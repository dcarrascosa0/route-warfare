import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GatewayAPI } from "@/lib/api";

type CoordinateInput = {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  accuracy?: number | null;
  speed?: number | null;
  bearing?: number | null;
  timestamp: string; // ISO
};

type StartOptions = {
  name?: string;
  description?: string;
};

interface UseRouteTrackerResult {
  isTracking: boolean;
  startedAt: number | null;
  elapsedMs: number;
  routeId: string | null;
  currentLocation: GeolocationPosition | null;
  trackedCoordinates: CoordinateInput[];
  start: (opts?: StartOptions) => Promise<boolean>;
  stop: (completeAndClaim?: boolean, name?: string) => Promise<boolean>;
  cancel: () => Promise<boolean>;
  cleanup: () => void;
  error: string | null;
  clearError: () => void;
  flush: () => Promise<void>;
}

const BATCH_SIZE = 10;
const BATCH_INTERVAL_MS = 5000;

// Helper function to validate coordinates
const isValidCoordinate = (coord: CoordinateInput): boolean => {
  const latValid = coord.latitude >= -90 && coord.latitude <= 90;
  const lngValid = coord.longitude >= -180 && coord.longitude <= 180;
  const accuracyValid = !coord.accuracy || coord.accuracy <= 100;
  const speedValid = !coord.speed || coord.speed <= 111.12; // More lenient: 400km/h = 111.12m/s
  
  if (!latValid) console.warn('Invalid latitude:', coord.latitude);
  if (!lngValid) console.warn('Invalid longitude:', coord.longitude);  
  if (!accuracyValid) console.warn('Poor accuracy:', coord.accuracy);
  if (!speedValid) console.warn('Speed too high:', coord.speed, 'm/s');
  
  return latValid && lngValid && accuracyValid && speedValid;
};

// Helper function to calculate distance
const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};

export function useRouteTracker(userId: string | null | undefined): UseRouteTrackerResult {
  const [routeId, setRouteId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null);
  const [trackedCoordinates, setTrackedCoordinates] = useState<CoordinateInput[]>([]);

  const watchIdRef = useRef<number | null>(null);
  const batchRef = useRef<CoordinateInput[]>([]);
  const lastFlushRef = useRef<number>(0);
  const tickTimerRef = useRef<number | null>(null);
  const simHandlerRef = useRef<((e: Event) => void) | null>(null);
  const routeIdRef = useRef<string | null>(null);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    routeIdRef.current = routeId;
  }, [routeId]);
  useEffect(() => {
    userIdRef.current = userId ?? null;
  }, [userId]);

  const flushBatch = useCallback(async () => {
    const currentUserId = userIdRef.current;
    const currentRouteId = routeIdRef.current;
    console.log('flushBatch called - userId:', currentUserId, 'routeId:', currentRouteId, 'batchSize:', batchRef.current.length);
    
    if (!currentUserId || !currentRouteId) {
      console.log('Cannot flush - missing userId or routeId');
      return;
    }
    if (batchRef.current.length === 0) {
      console.log('Cannot flush - empty batch');
      return;
    }
    
    // Send everything currently queued; do not discard older points
    const toSend = [...batchRef.current];
    batchRef.current = [];
    lastFlushRef.current = Date.now();
    
    console.log('Sending coordinates to backend:', toSend);
    
    try {
      const result = await GatewayAPI.addCoordinates(currentRouteId, currentUserId, toSend);
      console.log(`Successfully flushed ${toSend.length} coordinates to backend:`, result);

      if (!result.ok) {
        // Handle specific API errors
        const errorDetail = result.error;
        let errorMessage = "Failed to save coordinates";

        if (typeof errorDetail === 'object' && errorDetail !== null) {
          const detail = errorDetail as any;
          if (detail.error === 'Coordinate validation failed') {
            errorMessage = `Coordinate validation failed: ${detail.message}`;
          } else if (detail.error === 'Internal server error') {
            errorMessage = "Server error occurred while saving coordinates";
          } else if (detail.message) {
            errorMessage = detail.message;
          }
        } else if (typeof errorDetail === 'string') {
          errorMessage = errorDetail;
        }

        console.error('API returned error:', errorMessage);
        setError(errorMessage);
      }
    } catch (error: any) {
      console.error('Failed to flush coordinates:', error);

      // Extract meaningful error message
      let errorMessage = "Failed to save coordinates";
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      setError(errorMessage);

      // Re-queue failed coordinates to attempt on next flush
      batchRef.current = [...toSend, ...batchRef.current];
      console.log('Re-queued', toSend.length, 'coordinates after failure');
    }
  }, []);

  const start = useCallback(async (opts?: StartOptions) => {
    console.log('Starting route tracking with userId:', userId, 'opts:', opts);
    setError(null);
    if (!userId) {
      setError("You must be signed in to start a route");
      return false;
    }
    try {
      let haveRoute = false;
      // Try resume existing active route
      const active = await GatewayAPI.getActiveRoute(userId);
      console.log('Checked for active route:', active);
      if (active.ok && (active.data as any)?.id) {
        const ar = (active.data as any);
        setRouteId(String(ar.id));
        setTrackedCoordinates(ar.coordinates || []);
        haveRoute = true;
        console.log('Resumed existing route:', ar.id);
      }

      if (!haveRoute) {
        console.log('Creating new route...');
        const started = await GatewayAPI.startRoute(userId, { name: opts?.name, description: opts?.description });
        console.log('Start route response:', started);
        if (!started.ok || !(started.data as any)?.id) {
          const errorMsg = `Failed to start route${started.status === 401 ? ": unauthorized" : ""}`;
          setError(errorMsg);
          console.error(errorMsg, started);
          return false;
        }
        setRouteId(String((started.data as any).id));
        console.log('Created new route:', (started.data as any).id);
      }
      setStartedAt(Date.now());
      setIsTracking(true);
      console.log('Route tracking started, isTracking set to true');

      // start timers
      const startTime = Date.now();
      tickTimerRef.current = window.setInterval(() => {
        setElapsedMs(Date.now() - startTime);
        const sinceLast = Date.now() - lastFlushRef.current;
        if (sinceLast >= BATCH_INTERVAL_MS) {
          flushBatch();
        }
      }, 1000) as unknown as number;

      // Hook simulated GPS events (from GPSSimulator)
      const onSimulatedPosition = (e: Event) => {
        const detail: any = (e as CustomEvent).detail;
        if (!detail) return;
        setCurrentLocation(detail as GeolocationPosition);
        const c: CoordinateInput = {
          latitude: detail.coords.latitude,
          longitude: detail.coords.longitude,
          altitude: detail.coords.altitude ?? null,
          accuracy: detail.coords.accuracy ?? null,
          speed: detail.coords.speed ?? null,
          bearing: detail.coords.heading ?? null,
          timestamp: new Date(detail.timestamp || Date.now()).toISOString(),
        };
        if (!isValidCoordinate(c)) return;
        batchRef.current.push(c);
        setTrackedCoordinates((prev) => [...prev, c]);
        // Flush more aggressively when simulator is active to keep the map path up-to-date
        if (batchRef.current.length >= Math.max(3, Math.floor(BATCH_SIZE / 2))) {
          flushBatch();
        }
      };
      window.addEventListener('gps:position', onSimulatedPosition as unknown as EventListener);
      simHandlerRef.current = onSimulatedPosition;

      // start real GPS
      if ("geolocation" in navigator) {
        console.log('Setting up GPS tracking...');
        
        const handleSuccess = (pos: GeolocationPosition) => {
          setCurrentLocation(pos);
          const c: CoordinateInput = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            altitude: pos.coords.altitude ?? null,
            accuracy: pos.coords.accuracy ?? null,
            speed: pos.coords.speed ?? null,
            bearing: pos.coords.heading ?? null,
            timestamp: new Date().toISOString(),
          };
          
          console.log('Received GPS coordinate:', c);
          
          if (!isValidCoordinate(c)) {
            console.warn('Invalid GPS coordinate received:', c);
            return;
          }
          
          if (batchRef.current.length > 0) {
            const lastCoord = batchRef.current[batchRef.current.length - 1];
            const distance = calculateHaversineDistance(
              lastCoord.latitude, lastCoord.longitude,
              c.latitude, c.longitude
            );
            
            if (distance < 1.0) {
              console.log('Skipping coordinate - too close to previous:', distance.toFixed(2) + 'm');
              return;
            }
          }
          
          console.log('Adding coordinate to batch, queue size:', batchRef.current.length + 1);
          batchRef.current.push(c);
          setTrackedCoordinates((prev) => [...prev, c]);
          if (batchRef.current.length >= BATCH_SIZE) {
            console.log('Batch full, flushing coordinates');
            flushBatch();
          }
        };

        const handleError = (error: GeolocationPositionError) => {
          setError(`GPS Error: ${error.message}`);
          setCurrentLocation(null);
        };

        const onSimulatedPosition = (e: Event) => {
          const customEvent = e as CustomEvent;
          if (customEvent.detail && customEvent.detail.position) {
            handleSuccess(customEvent.detail.position as GeolocationPosition);
          }
        };
        
        // Check for GPS Simulator events
        document.addEventListener("gps-sim-update", onSimulatedPosition);

        const startWatcher = (highAccuracy = true) => {
          if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
          }

          try {
            watchIdRef.current = navigator.geolocation.watchPosition(
              handleSuccess,
              (error) => {
                // If high accuracy fails, try with low accuracy
                if (highAccuracy) {
                  startWatcher(false);
                }
                handleError(error);
              },
              {
                enableHighAccuracy: highAccuracy,
                timeout: 20000, // 20 second timeout, reduced from 30
                maximumAge: 0,
              }
            );
          } catch (err: unknown) {
            const error = err as Error;
            setError(`Could not start GPS watcher: ${error.message}`);
          }
        };

        if (isTracking) {
          startWatcher();
        }
      } else {
        setError("Geolocation is not supported in this browser");
        return false;
      }

      return true;
    } catch (e) {
      setError("Failed to start tracking");
      return false;
    }
  }, [userId, flushBatch, isTracking]);

  const stop = useCallback(async (completeAndClaim?: boolean, name?: string) => {
    try {
      if (tickTimerRef.current != null) {
        clearInterval(tickTimerRef.current);
        tickTimerRef.current = null;
      }
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (simHandlerRef.current) {
        window.removeEventListener('gps:position', simHandlerRef.current as unknown as EventListener);
        simHandlerRef.current = null;
      }
      await flushBatch();

      if (userId && routeId) {
        const completionPayload = {
          name: name || `Route ${new Date().toISOString()}`,
          completion: {
            completed_at: new Date().toISOString(),
            distance: 0, // These are calculated server-side now
            duration: elapsedMs / 1000,
          },
        };

        if (!navigator.onLine) {
            console.log("Offline: Queuing route completion for background sync.");
            const { getOfflineSyncManager } = await import('@/lib/network/offline-sync');
            const syncManager = getOfflineSyncManager();
            if (syncManager) {
                syncManager.addOfflineOperation({
                    type: 'COMPLETE_ROUTE',
                    data: { routeId, userId, completion: completionPayload },
                    userId
                });
            }
        } else {
            const completed = await GatewayAPI.completeRoute(routeId, userId, completionPayload);
            if (!completed.ok) {
                // Handle API error
                throw completed;
            }

            const data = (completed.data as any) || {};

            // Optionally claim territory
            if (completeAndClaim && data?.territory_polygon && Array.isArray(data.territory_polygon)) {
              const boundary_coordinates = (data.territory_polygon as number[][]).map(([lon, lat]) => ({ longitude: lon, latitude: lat }));
              await GatewayAPI.claimTerritoryFromRoute(userId, { route_id: routeId, boundary_coordinates });
            }
        }
      }

      setIsTracking(false);
      setCurrentLocation(null);
      setRouteId(null);
      setStartedAt(null);
      setElapsedMs(0);
      setTrackedCoordinates([]);
      return true;
    } catch (e: any) {
      console.error("Route completion error:", e);
      
      // Extract meaningful error message
      let errorMessage = "Failed to stop route";
      const errorObj = e?.error;

      if (typeof errorObj === 'object' && errorObj !== null) {
        if (typeof errorObj.message === 'string') {
          errorMessage = errorObj.message;
        } else if (typeof errorObj.detail === 'string') {
          errorMessage = errorObj.detail;
        } else if (errorObj.error && typeof errorObj.error === 'string') {
          errorMessage = errorObj.error;
        } else {
          try {
            errorMessage = JSON.stringify(errorObj);
          } catch {
            errorMessage = "An unknown error occurred while stopping the route."
          }
        }
      } else if (e?.message) {
        errorMessage = e.message;
      } else if (typeof e === 'string') {
        errorMessage = e;
      }
      
      setError(errorMessage);
      return false;
    }
  }, [userId, routeId, flushBatch, elapsedMs]);

  const cancel = useCallback(async () => {
    try {
      // Stop all tracking first
      if (tickTimerRef.current != null) {
        clearInterval(tickTimerRef.current);
        tickTimerRef.current = null;
      }
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (simHandlerRef.current) {
        window.removeEventListener('gps:position', simHandlerRef.current as unknown as EventListener);
        simHandlerRef.current = null;
      }

      // Clear local state immediately for better UX
      setIsTracking(false);
      const currentRouteId = routeId;
      setRouteId(null);
      setStartedAt(null);
      setElapsedMs(0);
      setError(null);
      setCurrentLocation(null);
      batchRef.current = [];
      setTrackedCoordinates([]);

      // Delete the route from backend if we have one
      if (userId && currentRouteId) {
        console.log("Deleting route from backend:", currentRouteId);
        const result = await GatewayAPI.deleteRoute(currentRouteId, userId);
        if (!result.ok) {
          console.error("Failed to delete route:", result);
          throw new Error("Failed to delete route from server");
        }
        console.log("Route deleted successfully from backend");
      }
      
      console.log("Route cancelled and deleted successfully");
      return true;
    } catch (e: any) {
      console.error("Route cancellation error:", e);
      
      let errorMessage = "Failed to cancel route";
      if (e?.error?.detail) {
        errorMessage = e.error.detail;
      } else if (e?.message) {
        errorMessage = e.message;
      } else if (typeof e === 'string') {
        errorMessage = e;
      }
      
      setError(errorMessage);
      return false;
    }
  }, [userId, routeId]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const cleanup = useCallback(() => {
    // Remove simulated event listener(s)
    if (simHandlerRef.current) {
      window.removeEventListener('gps:position', simHandlerRef.current as unknown as EventListener);
      simHandlerRef.current = null;
    }
    // Clean up timers and geolocation watching
    if (tickTimerRef.current != null) {
      clearInterval(tickTimerRef.current);
      tickTimerRef.current = null;
    }
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    // Clear local state
    setIsTracking(false);
    setCurrentLocation(null);
    setRouteId(null);
    setStartedAt(null);
    setElapsedMs(0);
    setError(null);
    setTrackedCoordinates([]);
    
    // Clear batch (don't flush since route is already completed)
    batchRef.current = [];
    
    console.log("Route tracker state cleaned up without API call");
  }, []);

  useEffect(() => {
    // Flush on tab hide/unload to avoid losing queued points
    const onVisibilityChange = () => {
      if (document.hidden) {
        flushBatch();
      }
    };
    const onPageHide = () => {
      flushBatch();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', onPageHide);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', onPageHide);
      if (tickTimerRef.current != null) clearInterval(tickTimerRef.current);
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  const value = useMemo<UseRouteTrackerResult>(() => ({
    isTracking,
    startedAt,
    elapsedMs,
    routeId,
    currentLocation,
    trackedCoordinates,
    start,
    stop,
    cancel,
    cleanup,
    error,
    clearError,
    flush: flushBatch,
  }), [isTracking, startedAt, elapsedMs, routeId, start, stop, cancel, cleanup, error, currentLocation, trackedCoordinates, clearError, flushBatch]);

  return value;
}


