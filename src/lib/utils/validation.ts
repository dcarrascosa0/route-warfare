/**
 * Data validation utilities.
 */

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPassword(password: string): boolean {
  // At least 8 characters, one uppercase, one lowercase, one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

export function isValidUsername(username: string): boolean {
  // 3-20 characters, alphanumeric and underscores only
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
}

export function isValidCoordinate(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export function sanitizeString(text: string, maxLength: number = 255): string {
  if (!text) return '';
  
  // Remove leading/trailing whitespace
  text = text.trim();
  
  // Truncate if too long
  if (text.length > maxLength) {
    text = text.substring(0, maxLength);
  }
  
  return text;
}

export function validateRouteCoordinates(coordinates: Array<{ latitude: number; longitude: number }>): boolean {
  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    return false;
  }
  
  return coordinates.every(coord => 
    typeof coord.latitude === 'number' && 
    typeof coord.longitude === 'number' &&
    isValidCoordinate(coord.latitude, coord.longitude)
  );
}