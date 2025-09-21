/**
 * Frontend library exports - organized by domain.
 * 
 * This is the main entry point for all frontend utilities and services.
 * Files have been reorganized into logical directories for better maintainability.
 */

// API and networking
export * from './api';
export * from './network';

// Authentication
export * from './auth';

// GPS and location services
export * from './gps';

// Monitoring and performance
export * from './monitoring';

// React Query and data fetching
export * from './query';

// WebSocket and real-time communication
export * from './websocket';

// Media and audio
export * from './media';

// Service workers and web workers
export * from './workers';

// Utilities and constants
export * from './utils';
export * from './constants';

// Backward compatibility exports
export * from './utils.ts'; // Re-export the main utils file for compatibility