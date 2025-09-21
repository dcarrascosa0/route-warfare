/**
 * GPS and location utilities.
 */

export * from './gps-simulator.ts';
export { 
  validateCoordinate,
  validateCoordinateSequence,
  filterValidCoordinates,
  isClosedLoop,
  calculateTotalDistance,
  calculateAverageSpeed,
  calculateDistance as calculateGPSDistance
} from './coordinate-validation.ts';