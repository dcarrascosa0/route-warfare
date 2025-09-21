import { useState, useCallback, useMemo } from 'react';

export interface MapViewState {
  showTerritoryOverlay: boolean;
  showConflicts: boolean;
  showGPSMarkers: boolean;
  showTerritoryPreview: boolean;
  selectedCoordinate: number | null;
  mapCenter: [number, number] | null;
  mapBounds: any | null;
}

export interface MapControls {
  toggleTerritoryOverlay: () => void;
  toggleConflicts: () => void;
  toggleGPSMarkers: () => void;
  toggleTerritoryPreview: () => void;
  selectCoordinate: (index: number | null) => void;
  resetView: () => void;
}

export interface UseMapStateProps {
  coordinates?: Array<{ latitude: number; longitude: number }>;
  initialCenter?: [number, number];
}

export default function useMapState({ 
  coordinates = [], 
  initialCenter 
}: UseMapStateProps = {}) {
  const [mapState, setMapState] = useState<MapViewState>({
    showTerritoryOverlay: false,
    showConflicts: false,
    showGPSMarkers: false,
    showTerritoryPreview: false,
    selectedCoordinate: null,
    mapCenter: initialCenter || null,
    mapBounds: null
  });

  // Calculate map bounds from coordinates
  const calculatedBounds = useMemo(() => {
    if (coordinates.length === 0) return null;
    
    const lats = coordinates.map(c => c.latitude);
    const lngs = coordinates.map(c => c.longitude);
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    // Add padding (10% of range, minimum 0.001 degrees)
    const latRange = maxLat - minLat;
    const lngRange = maxLng - minLng;
    const latPadding = Math.max(latRange * 0.1, 0.001);
    const lngPadding = Math.max(lngRange * 0.1, 0.001);
    
    return {
      minLat: minLat - latPadding,
      maxLat: maxLat + latPadding,
      minLng: minLng - lngPadding,
      maxLng: maxLng + lngPadding
    };
  }, [coordinates]);

  // Calculate map center
  const calculatedCenter = useMemo((): [number, number] | null => {
    if (coordinates.length === 0) return mapState.mapCenter;
    
    const avgLat = coordinates.reduce((sum, c) => sum + c.latitude, 0) / coordinates.length;
    const avgLng = coordinates.reduce((sum, c) => sum + c.longitude, 0) / coordinates.length;
    return [avgLat, avgLng];
  }, [coordinates, mapState.mapCenter]);

  const controls: MapControls = {
    toggleTerritoryOverlay: useCallback(() => {
      setMapState(prev => ({ ...prev, showTerritoryOverlay: !prev.showTerritoryOverlay }));
    }, []),

    toggleConflicts: useCallback(() => {
      setMapState(prev => ({ ...prev, showConflicts: !prev.showConflicts }));
    }, []),

    toggleGPSMarkers: useCallback(() => {
      setMapState(prev => ({ ...prev, showGPSMarkers: !prev.showGPSMarkers }));
    }, []),

    toggleTerritoryPreview: useCallback(() => {
      setMapState(prev => ({ ...prev, showTerritoryPreview: !prev.showTerritoryPreview }));
    }, []),

    selectCoordinate: useCallback((index: number | null) => {
      setMapState(prev => ({ ...prev, selectedCoordinate: index }));
    }, []),

    resetView: useCallback(() => {
      setMapState(prev => ({
        ...prev,
        selectedCoordinate: null,
        mapCenter: calculatedCenter,
        mapBounds: calculatedBounds
      }));
    }, [calculatedCenter, calculatedBounds])
  };

  return {
    mapState: {
      ...mapState,
      mapCenter: calculatedCenter,
      mapBounds: calculatedBounds
    },
    controls
  };
}