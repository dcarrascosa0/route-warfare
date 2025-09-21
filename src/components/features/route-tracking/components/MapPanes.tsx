import { useEffect } from "react";
import { useMap } from "react-leaflet";

// Map panes setup component
export default function MapPanes() {
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
        if (!map.getPane("territories")) {
            map.createPane("territories");
            map.getPane("territories")!.style.zIndex = "150";
        }
        if (!map.getPane("routes")) {
            map.createPane("routes");
            map.getPane("routes")!.style.zIndex = "200";
        }
        if (!map.getPane("markers")) {
            map.createPane("markers");
            map.getPane("markers")!.style.zIndex = "300";
        }
        // Ensure default panes sit above custom panes
        map.getPane("overlayPane")!.style.zIndex = "400";
        map.getPane("markerPane")!.style.zIndex = "500";
        map.getPane("popupPane")!.style.zIndex = "600";
    }, [map]);
    
    return null;
}