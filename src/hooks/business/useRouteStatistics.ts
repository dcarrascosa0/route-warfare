import { useMemo } from 'react';

export interface RouteCoordinate {
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number;
  altitude?: number;
  speed?: number;
}

export interface RouteStatistics {
  distance: number; // in meters
  duration: number; // in seconds
  averageSpeed: number; // in km/h
  maxSpeed: number; // in km/h
  coordinateCount: number;
  isClosedLoop: boolean;
  gpsQualityScore: number; // 0-100
  territoryEligibilityScore: number; // 0-100
}

export interface UseRouteStatisticsProps {
  coordinates: RouteCoordinate[];
  startTime?: string;
  endTime?: string;
}

// Haversine formula to calculate distance between two coordinates
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export default function useRouteStatistics({ 
  coordinates, 
  startTime, 
  endTime 
}: UseRouteStatisticsProps): RouteStatistics {
  return useMemo(() => {
    if (coordinates.length === 0) {
      return {
        distance: 0,
        duration: 0,
        averageSpeed: 0,
        maxSpeed: 0,
        coordinateCount: 0,
        isClosedLoop: false,
        gpsQualityScore: 0,
        territoryEligibilityScore: 0
      };
    }

    // Calculate total distance
    let totalDistance = 0;
    const speeds: number[] = [];
    
    for (let i = 1; i < coordinates.length; i++) {
      const prev = coordinates[i - 1];
      const curr = coordinates[i];
      
      const segmentDistance = calculateDistance(
        prev.latitude, prev.longitude,
        curr.latitude, curr.longitude
      );
      
      totalDistance += segmentDistance;
      
      // Calculate speed for this segment
      const timeDiff = (new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime()) / 1000;
      if (timeDiff > 0) {
        const speedMps = segmentDistance / timeDiff;
        const speedKmh = speedMps * 3.6;
        speeds.push(speedKmh);
      }
    }

    // Calculate duration
    let duration = 0;
    if (startTime && endTime) {
      duration = (new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000;
    } else if (coordinates.length > 1) {
      duration = (
        new Date(coordinates[coordinates.length - 1].timestamp).getTime() - 
        new Date(coordinates[0].timestamp).getTime()
      ) / 1000;
    }

    // Calculate speeds
    const averageSpeed = speeds.length > 0 ? speeds.reduce((sum, s) => sum + s, 0) / speeds.length : 0;
    const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;

    // Check if route is closed loop (start and end within 50m)
    const isClosedLoop = coordinates.length > 3 && calculateDistance(
      coordinates[0].latitude, coordinates[0].longitude,
      coordinates[coordinates.length - 1].latitude, coordinates[coordinates.length - 1].longitude
    ) < 50;

    // Calculate GPS quality score based on accuracy values
    const accuracyValues = coordinates
      .map(c => c.accuracy)
      .filter((acc): acc is number => acc !== undefined);
    
    let gpsQualityScore = 0;
    if (accuracyValues.length > 0) {
      const avgAccuracy = accuracyValues.reduce((sum, acc) => sum + acc, 0) / accuracyValues.length;
      // Convert accuracy to quality score (lower accuracy = higher quality)
      // Excellent: ≤5m = 100%, Good: ≤10m = 80%, Fair: ≤20m = 60%, Poor: >20m = 40%
      if (avgAccuracy <= 5) gpsQualityScore = 100;
      else if (avgAccuracy <= 10) gpsQualityScore = 80;
      else if (avgAccuracy <= 20) gpsQualityScore = 60;
      else gpsQualityScore = 40;
    }

    // Calculate territory eligibility score
    let territoryEligibilityScore = 0;
    
    // Factors for territory eligibility:
    // 1. Minimum distance (500m = 20 points)
    const distanceScore = Math.min((totalDistance / 500) * 20, 20);
    
    // 2. Closed loop bonus (20 points)
    const closedLoopScore = isClosedLoop ? 20 : 0;
    
    // 3. GPS quality (30 points)
    const qualityScore = (gpsQualityScore / 100) * 30;
    
    // 4. Coordinate density (30 points) - more points = better coverage
    const densityScore = Math.min((coordinates.length / 50) * 30, 30);
    
    territoryEligibilityScore = distanceScore + closedLoopScore + qualityScore + densityScore;

    return {
      distance: totalDistance,
      duration,
      averageSpeed,
      maxSpeed,
      coordinateCount: coordinates.length,
      isClosedLoop,
      gpsQualityScore,
      territoryEligibilityScore: Math.min(territoryEligibilityScore, 100)
    };
  }, [coordinates, startTime, endTime]);
}