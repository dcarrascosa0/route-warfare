/**
 * Coordinate validation utilities for GPS tracking
 */

export interface GPSCoordinate {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  accuracy?: number | null;
  speed?: number | null;
  bearing?: number | null;
  timestamp: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface CoordinateValidationOptions {
  maxAccuracy?: number; // Maximum acceptable accuracy in meters
  minAccuracy?: number; // Minimum acceptable accuracy in meters
  maxSpeed?: number; // Maximum acceptable speed in km/h
  allowNullValues?: boolean; // Whether to allow null values for optional fields
}

/**
 * Validates a single GPS coordinate
 */
export function validateCoordinate(
  coordinate: GPSCoordinate,
  options: CoordinateValidationOptions = {}
): ValidationResult {
  const {
    maxAccuracy = 100, // 100 meters max accuracy
    minAccuracy = 0,
    maxSpeed = 200, // 200 km/h max speed (reasonable for any land vehicle)
    allowNullValues = true
  } = options;

  const errors: string[] = [];

  // Validate latitude
  if (typeof coordinate.latitude !== 'number' || isNaN(coordinate.latitude)) {
    errors.push('Latitude must be a valid number');
  } else if (coordinate.latitude < -90 || coordinate.latitude > 90) {
    errors.push('Latitude must be between -90 and 90 degrees');
  }

  // Validate longitude
  if (typeof coordinate.longitude !== 'number' || isNaN(coordinate.longitude)) {
    errors.push('Longitude must be a valid number');
  } else if (coordinate.longitude < -180 || coordinate.longitude > 180) {
    errors.push('Longitude must be between -180 and 180 degrees');
  }

  // Validate timestamp
  if (!coordinate.timestamp) {
    errors.push('Timestamp is required');
  } else {
    const timestamp = new Date(coordinate.timestamp);
    if (isNaN(timestamp.getTime())) {
      errors.push('Timestamp must be a valid ISO date string');
    } else {
      // Check if timestamp is not too far in the future (allow 1 minute tolerance)
      const now = new Date();
      const maxFutureTime = new Date(now.getTime() + 60000); // 1 minute
      if (timestamp > maxFutureTime) {
        errors.push('Timestamp cannot be in the future');
      }
      
      // Check if timestamp is not too old (allow 1 hour tolerance)
      const minPastTime = new Date(now.getTime() - 3600000); // 1 hour
      if (timestamp < minPastTime) {
        errors.push('Timestamp is too old (more than 1 hour)');
      }
    }
  }

  // Validate accuracy
  if (coordinate.accuracy !== null && coordinate.accuracy !== undefined) {
    if (typeof coordinate.accuracy !== 'number' || isNaN(coordinate.accuracy)) {
      errors.push('Accuracy must be a valid number');
    } else if (coordinate.accuracy < minAccuracy) {
      errors.push(`Accuracy must be at least ${minAccuracy} meters`);
    } else if (coordinate.accuracy > maxAccuracy) {
      errors.push(`Accuracy must not exceed ${maxAccuracy} meters`);
    }
  } else if (!allowNullValues) {
    errors.push('Accuracy is required');
  }

  // Validate altitude
  if (coordinate.altitude !== null && coordinate.altitude !== undefined) {
    if (typeof coordinate.altitude !== 'number' || isNaN(coordinate.altitude)) {
      errors.push('Altitude must be a valid number');
    } else if (coordinate.altitude < -500 || coordinate.altitude > 10000) {
      // Reasonable altitude range: Dead Sea to Mount Everest
      errors.push('Altitude must be between -500 and 10000 meters');
    }
  }

  // Validate speed
  if (coordinate.speed !== null && coordinate.speed !== undefined) {
    if (typeof coordinate.speed !== 'number' || isNaN(coordinate.speed)) {
      errors.push('Speed must be a valid number');
    } else if (coordinate.speed < 0) {
      errors.push('Speed cannot be negative');
    } else if (coordinate.speed > maxSpeed) {
      errors.push(`Speed cannot exceed ${maxSpeed} km/h`);
    }
  }

  // Validate bearing
  if (coordinate.bearing !== null && coordinate.bearing !== undefined) {
    if (typeof coordinate.bearing !== 'number' || isNaN(coordinate.bearing)) {
      errors.push('Bearing must be a valid number');
    } else if (coordinate.bearing < 0 || coordinate.bearing >= 360) {
      errors.push('Bearing must be between 0 and 359 degrees');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates an array of GPS coordinates
 */
export function validateCoordinateSequence(
  coordinates: GPSCoordinate[],
  options: CoordinateValidationOptions = {}
): ValidationResult {
  const errors: string[] = [];

  if (!Array.isArray(coordinates)) {
    return {
      isValid: false,
      errors: ['Coordinates must be an array']
    };
  }

  if (coordinates.length === 0) {
    return {
      isValid: false,
      errors: ['At least one coordinate is required']
    };
  }

  // Validate each coordinate
  coordinates.forEach((coord, index) => {
    const result = validateCoordinate(coord, options);
    if (!result.isValid) {
      result.errors.forEach(error => {
        errors.push(`Coordinate ${index + 1}: ${error}`);
      });
    }
  });

  // Validate sequence-specific rules
  if (coordinates.length > 1) {
    // Check for duplicate timestamps
    const timestamps = coordinates.map(c => c.timestamp);
    const uniqueTimestamps = new Set(timestamps);
    if (uniqueTimestamps.size !== timestamps.length) {
      errors.push('Duplicate timestamps found in coordinate sequence');
    }

    // Check chronological order
    for (let i = 1; i < coordinates.length; i++) {
      const prevTime = new Date(coordinates[i - 1].timestamp);
      const currTime = new Date(coordinates[i].timestamp);
      if (currTime <= prevTime) {
        errors.push(`Coordinate ${i + 1}: Timestamps must be in chronological order`);
      }
    }

    // Check for unrealistic movement (teleportation detection)
    for (let i = 1; i < coordinates.length; i++) {
      const prev = coordinates[i - 1];
      const curr = coordinates[i];
      
      const distance = calculateDistance(
        prev.latitude,
        prev.longitude,
        curr.latitude,
        curr.longitude
      );
      
      const timeDiff = (new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime()) / 1000; // seconds
      
      if (timeDiff > 0) {
        const speedMps = distance / timeDiff; // meters per second
        const speedKmh = speedMps * 3.6; // km/h
        
        // Check for unrealistic speed (teleportation)
        const maxReasonableSpeed = options.maxSpeed || 200;
        if (speedKmh > maxReasonableSpeed * 2) { // Allow 2x max speed for brief GPS errors
          errors.push(`Coordinate ${i + 1}: Unrealistic movement detected (${speedKmh.toFixed(1)} km/h)`);
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Calculates the distance between two coordinates using the Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
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
}

/**
 * Filters out invalid coordinates from a sequence
 */
export function filterValidCoordinates(
  coordinates: GPSCoordinate[],
  options: CoordinateValidationOptions = {}
): GPSCoordinate[] {
  return coordinates.filter(coord => {
    const result = validateCoordinate(coord, options);
    return result.isValid;
  });
}

/**
 * Detects if a coordinate sequence forms a closed loop
 */
export function isClosedLoop(
  coordinates: GPSCoordinate[],
  toleranceMeters: number = 50
): boolean {
  if (coordinates.length < 4) {
    return false; // Need at least 4 points for a meaningful loop
  }

  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];

  const distance = calculateDistance(
    first.latitude,
    first.longitude,
    last.latitude,
    last.longitude
  );

  return distance <= toleranceMeters;
}

/**
 * Calculates the total distance of a coordinate sequence
 */
export function calculateTotalDistance(coordinates: GPSCoordinate[]): number {
  if (coordinates.length < 2) {
    return 0;
  }

  let totalDistance = 0;
  for (let i = 1; i < coordinates.length; i++) {
    const prev = coordinates[i - 1];
    const curr = coordinates[i];
    totalDistance += calculateDistance(
      prev.latitude,
      prev.longitude,
      curr.latitude,
      curr.longitude
    );
  }

  return totalDistance;
}

/**
 * Calculates the average speed of a coordinate sequence
 */
export function calculateAverageSpeed(coordinates: GPSCoordinate[]): number {
  if (coordinates.length < 2) {
    return 0;
  }

  const totalDistance = calculateTotalDistance(coordinates);
  const startTime = new Date(coordinates[0].timestamp);
  const endTime = new Date(coordinates[coordinates.length - 1].timestamp);
  const totalTimeSeconds = (endTime.getTime() - startTime.getTime()) / 1000;

  if (totalTimeSeconds <= 0) {
    return 0;
  }

  const speedMps = totalDistance / totalTimeSeconds;
  return speedMps * 3.6; // Convert to km/h
}