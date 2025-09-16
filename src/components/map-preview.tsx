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
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Claimed Zones</span>
                  <span className="text-2xl font-bold text-territory-claimed">47</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Area</span>
                  <span className="text-2xl font-bold text-primary">12.3 km²</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Rank</span>
                  <span className="text-2xl font-bold text-territory-neutral">#87</span>
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
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-territory-claimed rounded-full" />
                  <span>Zone captured in Central Park</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-territory-contested rounded-full" />
                  <span>Territory under attack!</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-territory-neutral rounded-full" />
                  <span>New route discovered</span>
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