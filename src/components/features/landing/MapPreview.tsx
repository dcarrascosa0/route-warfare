import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Target, Activity } from "lucide-react";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Link } from "react-router-dom";

// Fix default marker icon paths for Leaflet when bundled by Vite
const DefaultIcon = L.icon({
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).toString(),
  iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).toString(),
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).toString(),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const MapPreview = () => {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [sample, setSample] = useState<Array<{ id: string; lat: number; lng: number; name?: string }>>([]);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {
          setPosition(null);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  useEffect(() => {
    // Fetch a few nearby territories as sample markers
    (async () => {
      try {
        const lat = position?.[0] ?? 40.7128;
        const lng = position?.[1] ?? -74.0060;
        const res: any = await (await import('@/lib/api')).GatewayAPI.getNearbyTerritories(lat, lng, 3000);
        if (res?.ok && Array.isArray(res.data)) {
          const markers = res.data.slice(0, 3).map((t: any) => ({ id: String(t.id), lat: (t.boundary_coordinates?.[0]?.latitude ?? lat), lng: (t.boundary_coordinates?.[0]?.longitude ?? lng), name: t.name }));
          setSample(markers);
        }
      } catch {}
    })();
  }, [position]);

  const center: [number, number] | null = position ? [position[0], position[1]] : null;
  const TILE_URL = (import.meta as any)?.env?.VITE_MAP_TILE_URL ??
    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4 bg-territory-neutral/20 text-territory-neutral border-territory-neutral/30">
            Interactive Map
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Your <span className="bg-gradient-hero bg-clip-text text-transparent">Battle</span> Map
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Real-time territory visualization with GPS precision. See your conquests and plan your next strategic move.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map Interface */}
          <div className="lg:col-span-2">
            <Card className="bg-gradient-map border-border/50 shadow-glow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Territory Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="aspect-video bg-background/20 relative overflow-hidden rounded-b-lg min-h-[360px]">
                  {/* Real map centered on user location */}
                  {center ? (
                    <MapContainer center={center} zoom={13} attributionControl={false} className="absolute inset-0 z-0" style={{ height: "100%", width: "100%" }}>
                      <TileLayer
                        url={TILE_URL}
                      />
                      <Marker position={center}>
                        <Popup>You are here</Popup>
                      </Marker>
                      {sample.map(s => (
                        <Marker key={s.id} position={[s.lat, s.lng] as [number, number]}>
                          <Popup>{s.name || `Territory ${s.id.slice(0,8)}`}</Popup>
                        </Marker>
                      ))}
                      {/* Themed overlay for map styling (above tiles) */}
                      <div className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-br from-primary/8 via-transparent to-territory-claimed/12 mix-blend-soft-light" />
                      <div className="absolute inset-0 pointer-events-none z-10 border border-primary/20 rounded-b-lg" />
                    </MapContainer>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                      Locating your position...
                    </div>
                  )}

                  {/* Overlay UI */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <Badge className="bg-territory-claimed/20 text-territory-claimed border-territory-claimed/30">
                      Map
                    </Badge>
                    <Badge variant="outline" className="border-muted/30">
                      {position ? "Live GPS" : "Locating..."}
                    </Badge>
                  </div>
                  
                  <div className="absolute bottom-4 right-4">
                    <Button size="sm" className="bg-primary/20 hover:bg-primary/30" asChild>
                      <Link to="/routes">
                        <Navigation className="w-4 h-4 mr-2" />
                        Start Route
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Stats Panel */}
          <div className="space-y-6">
            <Card className="bg-card/80 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="w-5 h-5 text-territory-claimed" />
                  Territory Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-4">
                  <Target className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    Sign up to start claiming territory and tracking your stats!
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/80 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="w-5 h-5 text-territory-contested" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center py-4">
                  <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    Activity feed will show your territory battles and achievements.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MapPreview;