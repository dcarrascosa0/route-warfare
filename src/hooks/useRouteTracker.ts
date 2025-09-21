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

type UseRouteTrackerResult = {
  isTracking: boolean;
  startedAt: number | null;
  elapsedMs: number;
  routeId: string | null;
  start: (opts?: StartOptions) => Promise<boolean>;
  stop: (completeAndClaim?: boolean) => Promise<boolean>;
  cleanup: () => void;
  error: string | null;
};

const BATCH_SIZE = 10;
const BATCH_INTERVAL_MS = 5000;
const MIN_COORDINATE_DISTANCE = 2.0; // Minimum 2m between coordinates
const MAX_COORDINATE_AGE_MS = 10000; // 10 second max age

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

  const watchIdRef = useRef<number | null>(null);
  const batchRef = useRef<CoordinateInput[]>([]);
  const lastFlushRef = useRef<number>(0);
  const tickTimerRef = useRef<number | null>(null);
  const simHandlerRef = useRef<((e: Event) => void) | null>(null);

  const flushBatch = useCallback(async () => {
    console.log('flushBatch called - userId:', userId, 'routeId:', routeId, 'batchSize:', batchRef.current.length);
    
    if (!userId || !routeId) {
      console.log('Cannot flush - missing userId or routeId');
      return;
    }
    if (batchRef.current.length === 0) {
      console.log('Cannot flush - empty batch');
      return;
    }
    
    // Filter old coordinates
    const now = Date.now();
    const validCoords = batchRef.current.filter(coord => {
      const age = now - new Date(coord.timestamp).getTime();
      return age <= MAX_COORDINATE_AGE_MS;
    });
    
    console.log(`Filtered ${validCoords.length} valid coords out of ${batchRef.current.length}`);
    
    if (validCoords.length === 0) {
      batchRef.current = [];
      console.log('No valid coordinates to send');
      return;
    }
    
    const toSend = [...validCoords];
    batchRef.current = [];
    lastFlushRef.current = now;
    
    console.log('Sending coordinates to backend:', toSend);
    
    try {
      const result = await GatewayAPI.addCoordinates(routeId, userId, toSend);
      console.log(`Successfully flushed ${toSend.length} coordinates to backend:`, result);
    } catch (error) {
      console.error('Failed to flush coordinates:', error);
      // Re-queue failed coordinates if they're still recent
      const stillValid = toSend.filter(coord => {
        const age = Date.now() - new Date(coord.timestamp).getTime();
        return age <= MAX_COORDINATE_AGE_MS;
      });
      batchRef.current = [...stillValid, ...batchRef.current];
      console.log('Re-queued', stillValid.length, 'coordinates after failure');
    }
  }, [userId, routeId]);

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
        if (batchRef.current.length >= BATCH_SIZE) {
          flushBatch();
        }
      };
      window.addEventListener('gps:position', onSimulatedPosition as unknown as EventListener);
      simHandlerRef.current = onSimulatedPosition;

      // start real GPS
      if ("geolocation" in navigator) {
        console.log('Setting up GPS tracking...');
        const geoOptions: PositionOptions = {
          enableHighAccuracy: true,
          maximumAge: 2000, // Accept cached positions up to 2 seconds old
          timeout: 10000 // 10 second timeout
        };

        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
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
            
            // Validate coordinate before adding
            if (!isValidCoordinate(c)) {
              console.warn('Invalid GPS coordinate received:', c);
              return;
            }
            
            // Check for duplicate/close coordinates (more lenient for GPS simulator)
            if (batchRef.current.length > 0) {
              const lastCoord = batchRef.current[batchRef.current.length - 1];
              const distance = calculateHaversineDistance(
                lastCoord.latitude, lastCoord.longitude,
                c.latitude, c.longitude
              );
              
              if (distance < 1.0) { // Reduced from 2m to 1m to be less restrictive
                console.log('Skipping coordinate - too close to previous:', distance.toFixed(2) + 'm');
                return;
              }
            }
            
            console.log('Adding coordinate to batch, queue size:', batchRef.current.length + 1);
            batchRef.current.push(c);
            if (batchRef.current.length >= BATCH_SIZE) {
              console.log('Batch full, flushing coordinates');
              flushBatch();
            }
          },
          (error) => {
            const errorMessages = {
              1: "Location permission denied. Please enable location access.",
              2: "Location unavailable. Check your device's GPS settings.",
              3: "Location request timed out. Please try again."
            };
            setError(errorMessages[error.code as keyof typeof errorMessages] || "Location access failed");
          },
          geoOptions
        );
      } else {
        setError("Geolocation is not supported in this browser");
      }

      return true;
    } catch (e) {
      setError("Failed to start tracking");
      return false;
    }
  }, [userId, flushBatch]);

  const stop = useCallback(async (completeAndClaim?: boolean) => {
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
        const completed = await GatewayAPI.completeRoute(routeId, userId, { force_completion: false });
        
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

      setIsTracking(false);
      setRouteId(null);
      setStartedAt(null);
      setElapsedMs(0);
      return true;
    } catch (e: any) {
      console.error("Route completion error:", e);
      
      // Extract meaningful error message
      let errorMessage = "Failed to stop route";
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
  }, [userId, routeId, flushBatch]);

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
    setRouteId(null);
    setStartedAt(null);
    setElapsedMs(0);
    setError(null);
    
    // Clear batch (don't flush since route is already completed)
    batchRef.current = [];
    
    console.log("Route tracker state cleaned up without API call");
  }, []);

  useEffect(() => {
    return () => {
      if (tickTimerRef.current != null) clearInterval(tickTimerRef.current);
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  const value = useMemo<UseRouteTrackerResult>(() => ({
    isTracking,
    startedAt,
    elapsedMs,
    routeId,
    start,
    stop,
    cleanup,
    error,
  }), [isTracking, startedAt, elapsedMs, routeId, start, stop, cleanup, error]);

  return value;
}


