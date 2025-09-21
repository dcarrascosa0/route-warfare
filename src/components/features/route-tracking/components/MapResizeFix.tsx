import { useEffect } from "react";
import { useMap } from "react-leaflet";

// Map resize fix component
export default function MapResizeFix() {
    const map = useMap();
    
    useEffect(() => {
        const timer = setTimeout(() => map.invalidateSize(), 100);
        return () => clearTimeout(timer);
    }, [map]);
    
    return null;
}