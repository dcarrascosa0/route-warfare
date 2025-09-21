/**
 * Utility functions for the frontend.
 * 
 * This module provides backward compatibility while the new organized
 * utility structure is in frontend/src/lib/utils/.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Core utility function for className merging
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Re-export from organized structure for backward compatibility
export * from './utils/ui';
export * from './utils/validation';
export * from './utils/formatting';
export * from './utils/geospatial';
export * from './utils/datetime';
