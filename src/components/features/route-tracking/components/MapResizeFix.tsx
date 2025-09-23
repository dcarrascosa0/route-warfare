import { useEffect } from "react";
import { useMap } from "react-leaflet";

// Map resize fix component
export default function MapResizeFix() {
    const map = useMap();

    useEffect(() => {
        const mapContainer = map.getContainer();
        if (!mapContainer) return;

        // Debounce invalidateSize call
        let debounceTimer: NodeJS.Timeout;
        const debouncedInvalidateSize = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => map.invalidateSize(), 100);
        };

        // Use ResizeObserver to detect when the container is resized
        const resizeObserver = new ResizeObserver(() => {
            debouncedInvalidateSize();
        });

        resizeObserver.observe(mapContainer);

        // Initial check in case the map is already visible
        debouncedInvalidateSize();

        return () => {
            clearTimeout(debounceTimer);
            if (mapContainer) {
                resizeObserver.unobserve(mapContainer);
            }
            resizeObserver.disconnect();
        };
    }, [map]);

    return null;
}