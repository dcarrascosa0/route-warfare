// Organized hook exports
export * from './api';
export * from './ui';
export * from './business';

// Direct exports for commonly used hooks
export { default as useAuth } from './useAuth';
export { default as useResponsive } from './useResponsive';
export { default as useLoadingState } from './useLoadingState';
export { default as useErrorHandler } from './useErrorHandler';

// New business hooks
export { default as useMapState } from './business/useMapState';
export { default as useRouteStatistics } from './business/useRouteStatistics';
export { default as useTerritoryClaiming } from './business/useTerritoryClaiming';