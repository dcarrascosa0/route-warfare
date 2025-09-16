import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  useMap,
  ZoomControl,
  Circle,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TerritoryDetailsModal from "@/components/territory-details-modal";
import { toast } from "sonner";
import {
  MapPin,
  Navigation,
  Target as TargetIcon,
  Crown,
  Activity,
  Users,
  Maximize2,
  RefreshCw,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { GatewayAPI } from "@/lib/api";

// Fix default Leaflet marker icons for Vite bundling
const DefaultIcon = L.icon({
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).toString(),
  iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).toString(),
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).toString(),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon as any;

// Types
type GeoPoint = { longitude: number; latitude: number };
type Territory = { id: string; status?: string; boundary_coordinates: GeoPoint[] };

type TerritoryMapResponse = { territories: Territory[] };

function getTerritoryColor(status: string | undefined): string {
  switch ((status || "").toLowerCase()) {
    case "claimed":
      return "#fb5a2c"; // orange
    case "contested":
      return "#fbbf24"; // amber
    case "neutral":
      return "#22d3ee"; // cyan
    default:
      return "#3b82f6"; // blue
  }
}

function Panes() {
  const map = useMap();
  useEffect(() => {
    if (!map.getPane("base")) {
      map.createPane("base");
      map.getPane("base")!.style.zIndex = "100";
    }
    if (!map.getPane("tint")) {
      map.createPane("tint");
      map.getPane("tint")!.style.zIndex = "110";
    }
    // Ensure default panes sit above tiles but below UI
    map.getPane("overlayPane")!.style.zIndex = "200";  // polygons
    map.getPane("markerPane")!.style.zIndex = "300";   // markers
    map.getPane("popupPane")!.style.zIndex = "400";    // popups
  }, [map]);
  return null;
}

const ResizeFix = () => {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 0);
  }, [map]);
  return null;
};

// Basemaps (CARTO)
const TILE_DARK_NO_LABELS =
  (import.meta as any)?.env?.VITE_MAP_TILE_URL ??
  "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png";
const TILE_DARK_WITH_LABELS =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

export default function TerritoryPage() {
  const [selectedTerritory, setSelectedTerritory] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Page title
  useEffect(() => {
    document.title = "Territory Map — Route Wars";
  }, []);

  // Geolocation (with accuracy + follow toggle)
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [followMe, setFollowMe] = useState(true);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;

    if (followMe) {
      // Live tracking
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          setAccuracy(pos.coords.accuracy || null);
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );
      return () => {
        if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
      };
    } else {
      // One-shot fetch
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          setAccuracy(pos.coords.accuracy || null);
        },
        () => setCoords(null),
        { enableHighAccuracy: true, timeout: 10000 }
      );
      return;
    }
  }, [followMe]);

  // Map center
  const center: [number, number] | null = coords ? [coords.latitude, coords.longitude] : null;

  // Fetch territories near the user (bbox around position; world until we have GPS)
  const { data: mapData, isFetching, refetch } = useQuery<{ data: TerritoryMapResponse } | undefined>({
    queryKey: ["territories", "map", coords?.latitude, coords?.longitude],
    queryFn: () => {
      if (!coords) {
        return GatewayAPI.territoriesMap({
          min_longitude: -180,
          min_latitude: -90,
          max_longitude: 180,
          max_latitude: 90,
          limit: 50,
        });
      }
      const dLat = 0.2;
      const dLon = 0.2;
      return GatewayAPI.territoriesMap({
        min_longitude: coords.longitude - dLon,
        min_latitude: coords.latitude - dLat,
        max_longitude: coords.longitude + dLon,
        max_latitude: coords.latitude + dLat,
        limit: 50,
      });
    },
  });

  const territoriesFromApi: Territory[] =
    ((mapData?.data as any)?.territories as Territory[]) || [];

  // UI handlers
  const handleTerritoryClick = (territoryId: string) => {
    setSelectedTerritory(territoryId);
    setIsModalOpen(true);
  };

  const handlePlanRoute = () => {
    toast("Route planner opened", { description: "Select your starting point and destination" });
  };

  // ====== Small helper components that need the map instance ======
  const RecenterButton = () => {
    const map = useMap();
    if (!center) return null;
    return (
      <Button
        size="icon"
        variant="secondary"
        className="h-10 w-10 rounded-full shadow-xl backdrop-blur-md border border-orange-400/30"
        onClick={() => map.flyTo(center, Math.max(map.getZoom(), 13), { duration: 0.6 })}
        aria-label="Recenter on me"
        title="Recenter on me"
      >
        <TargetIcon className="h-5 w-5" />
      </Button>
    );
  };

  const FitToDataButton = () => {
    const map = useMap();
    const bounds = useMemo(() => {
      const b = new L.LatLngBounds([]);
      territoriesFromApi.forEach((t) => {
        const latlngs = (t.boundary_coordinates || []).map((p) => [p.latitude, p.longitude]) as [
          number,
          number
        ][];
        latlngs.forEach((ll) => b.extend(ll as any));
      });
      return b.isValid() ? b : null;
    }, [territoriesFromApi]);
    if (!bounds) return null;
    return (
      <Button
        size="icon"
        variant="secondary"
        className="h-10 w-10 rounded-full shadow-xl backdrop-blur-md border border-orange-400/30"
        onClick={() => map.fitBounds(bounds, { padding: [24, 24] })}
        aria-label="Fit to territories"
        title="Fit to territories"
      >
        <Maximize2 className="h-5 w-5" />
      </Button>
    );
  };

  const RefreshButton = () => (
    <Button
      size="icon"
      variant="secondary"
      className="h-10 w-10 rounded-full shadow-xl backdrop-blur-md border border-orange-400/30"
      onClick={() => refetch()}
      aria-label="Refresh"
      title="Refresh"
    >
      <RefreshCw className={`h-5 w-5 ${isFetching ? "animate-spin" : ""}`} />
    </Button>
  );

  // Basemap toggle (labels vs. no-labels + orange tint)
  // Labels are always on; keep a dedicated no-label overlay for orange tint

  const activeRoutes = [
    { id: "1", user: "MikeRuns", target: "Your Central Park Zone", eta: "12 min", threat: "high" },
    { id: "2", user: "You", target: "Alex_Runner's Downtown", eta: "8 min", threat: "none" },
    { id: "3", user: "RouteKing", target: "Neutral Riverside", eta: "15 min", threat: "medium" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Territory Control</h1>
          <p className="text-xl text-muted-foreground">Monitor your zones, track enemy movements, and plan your next conquest.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Map column */}
          <div className="lg:col-span-3">
            <Card className="bg-gradient-map border-border/50 shadow-glow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Live Territory Map
                  </CardTitle>
                  <div className="flex gap-2 items-center">
                    <Badge className="bg-territory-claimed/20 text-territory-claimed border-territory-claimed/30">Your Zones: 3</Badge>
                    <Badge variant="outline" className="border-muted/30">{followMe ? "Live GPS" : "GPS Paused"}</Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="aspect-[4/3] bg-background/20 relative overflow-hidden rounded-b-lg min-h-[420px] isolate">
                  {center ? (
                    <MapContainer
                      center={center}
                      zoom={13}
                      className="absolute inset-0 rw-map z-0"
                      style={{ height: "100%", width: "100%" }}
                      attributionControl={false}
                      zoomControl={false}
                    >
                      <ResizeFix />
                      {/* Define custom panes for explicit stacking */}
                      <Panes />
                      <ZoomControl position="topleft" />

                      {/* Basemap with labels */}
                      <TileLayer url={TILE_DARK_WITH_LABELS} zIndex={100} pane="base" />
                      {/* Orange-tinted overlay to color streets */}
                      <TileLayer url={TILE_DARK_NO_LABELS} className="tw-road-tint" opacity={0.5} zIndex={110} pane="tint" />

                      {/* User marker & accuracy circle */}
                      <Marker position={center}>
                        <Popup>You are here</Popup>
                      </Marker>
                      {accuracy && accuracy < 1000 && (
                        <Circle center={center} radius={Math.max(accuracy, 20)} pathOptions={{ color: "#fb923c", fillColor: "#fb923c", fillOpacity: 0.08, weight: 1 }} />
                      )}

                      {/* Territories */}
                      {territoriesFromApi.map((t) => {
                        const latlngs = (t.boundary_coordinates || []).map((p) => [p.latitude, p.longitude]) as [number, number][];
                        if (!latlngs.length) return null;
                        const color = getTerritoryColor(t.status);
                        return (
                          <Polygon
                            key={t.id}
                            positions={latlngs}
                            pathOptions={{ color, weight: 2, fillColor: color, fillOpacity: 0.25 }}
                            eventHandlers={{
                              click: () => handleTerritoryClick(t.id),
                              mouseover: (e) => (e.target as any).setStyle({ weight: 3, fillOpacity: 0.35 }),
                              mouseout: (e) => (e.target as any).setStyle({ weight: 2, fillOpacity: 0.25 }),
                            }}
                          >
                            <Popup>
                              <div className="text-sm">
                                <div className="font-semibold mb-1">Territory #{t.id}</div>
                                <div>Status: <span className="font-medium" style={{ color }}>{t.status || "unknown"}</span></div>
                                <div>Vertices: {latlngs.length}</div>
                                <div className="mt-2 text-xs text-muted-foreground">Click for details</div>
                              </div>
                            </Popup>
                          </Polygon>
                        );
                      })}

                      {/* Floating control cluster */}
                      <div className="rw-map-controls absolute bottom-6 left-6 flex flex-col gap-3 z-[600] pointer-events-auto">
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-orange-500/90 to-primary/90 hover:from-orange-400 hover:to-primary shadow-xl backdrop-blur-md border border-orange-400/30"
                          onClick={handlePlanRoute}
                        >
                          <Navigation className="w-4 h-4 mr-2" />
                          Plan Route
                        </Button>
                        <div className="flex gap-2">
                          <RecenterButton />
                          <FitToDataButton />
                          <RefreshButton />
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-background/95 border-orange-400/40 shadow-xl backdrop-blur-md hover:bg-orange-50/10 hover:border-orange-400/60"
                          onClick={() => setFollowMe((v) => !v)}
                        >
                          <Activity className="w-4 h-4 mr-2" />
                          {followMe ? "Pause Live" : "Live View"}
                        </Button>
                      </div>

                      {/* Legend moved out to sit above overlays */}

                      {/* Status badges */}
                      <div className="rw-map-controls absolute top-6 right-6 z-[600] flex items-center gap-2 pointer-events-auto">
                        <Badge className="bg-gradient-to-r from-territory-claimed/95 to-orange-500/80 text-white shadow-xl backdrop-blur-md border border-orange-400/50">
                          <div className={`w-2 h-2 rounded-full mr-2 ${coords ? "bg-orange-300 animate-pulse" : "bg-zinc-400"}`} />
                          {coords ? "GPS ACTIVE" : "SEARCHING..."}
                        </Badge>
                        {isFetching && (
                          <Badge variant="outline" className="border-orange-400/50 text-orange-300 animate-pulse">Updating…</Badge>
                        )}
                      </div>
                    </MapContainer>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                      Locating your position…
                    </div>
                  )}

                  {/* Softer cinematic overlays (dialed-back for clarity) */}
                  <div className="rw-map-ui absolute inset-0 pointer-events-none z-[500]">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/6 via-transparent to-primary/10" />
                    <div className="absolute inset-0 bg-gradient-to-b from-orange-300/4 via-transparent to-orange-500/8" />
                    <div
                      className="absolute inset-0 opacity-15"
                      style={{
                        backgroundImage: `linear-gradient(rgba(255,165,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,165,0,0.06) 1px, transparent 1px)`,
                        backgroundSize: "50px 50px",
                      }}
                    />
                    <div className="absolute inset-0 border border-orange-400/20 rounded-b-lg shadow-[inset_0_0_20px_rgba(255,165,0,0.08)]" />
                  </div>

                  {/* Legend above overlays */}
                  <div className="rw-map-controls absolute bottom-6 right-6 z-[600] pointer-events-auto rounded-lg border border-white/10 bg-black/40 backdrop-blur-md p-3 text-xs text-foreground/90 shadow-lg">
                    <div className="font-semibold mb-2">Legend</div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2"><span className="inline-block h-2 w-2 rounded-full" style={{ background: "#fb5a2c" }} /> Claimed</div>
                      <div className="flex items-center gap-2"><span className="inline-block h-2 w-2 rounded-full" style={{ background: "#fbbf24" }} /> Contested</div>
                      <div className="flex items-center gap-2"><span className="inline-block h-2 w-2 rounded-full" style={{ background: "#22d3ee" }} /> Neutral</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right rail */}
          <div className="space-y-6">
            {/* Territory Details */}
            <Card className="bg-card/80 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Crown className="w-5 h-5 text-territory-claimed" />
                  Your Empire
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Zones</span>
                  <span className="text-2xl font-bold text-territory-claimed">3</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Area</span>
                  <span className="text-2xl font-bold text-primary">4.7 km²</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Empire Rank</span>
                  <span className="text-2xl font-bold text-territory-neutral">#12</span>
                </div>
                <div className="pt-2">
                  <Button className="w-full bg-gradient-hero hover:shadow-glow">Expand Territory</Button>
                </div>
              </CardContent>
            </Card>

            {/* Active Routes */}
            <Card className="bg-card/80 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="w-5 h-5 text-territory-contested" />
                  Active Routes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeRoutes.map((route) => (
                  <div key={route.id} className="flex items-center justify-between p-2 rounded-lg bg-background/50">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          route.threat === "high"
                            ? "bg-destructive"
                            : route.threat === "medium"
                            ? "bg-territory-contested"
                            : "bg-territory-neutral"
                        }`}
                      />
                      <div>
                        <p className="text-xs font-medium">{route.user}</p>
                        <p className="text-xs text-muted-foreground">{route.target}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {route.eta}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Enemy Territories */}
            <Card className="bg-card/80 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="w-5 h-5 text-destructive" />
                  Nearby Enemies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">FastTracker</span>
                  <Badge variant="destructive" className="text-xs">
                    3.1 km²
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Alex_Runner</span>
                  <Badge variant="destructive" className="text-xs">
                    1.8 km²
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">SpeedDemon</span>
                  <Badge className="bg-territory-contested/20 text-territory-contested text-xs">
                    Contested
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <TerritoryDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        territory={null}
      />
    </div>
  );
}
