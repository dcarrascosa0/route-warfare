/**
 * Service Worker registration and management utilities
 * 
 * This file has been moved from the root lib directory and is now the main implementation.
 */

export interface ServiceWorkerConfig {
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

/**
 * Register the service worker
 */
export async function registerServiceWorker(config?: ServiceWorkerConfig): Promise<ServiceWorkerRegistration | null> {
  // Check if service workers are supported
  if (!('serviceWorker' in navigator)) {
    console.log('Service workers are not supported');
    return null;
  }

  // Only register in production or when explicitly enabled
  const isProduction = import.meta.env.PROD;
  const forceEnable = import.meta.env.VITE_ENABLE_SW === 'true';
  
  if (!isProduction && !forceEnable) {
    console.log('Service worker registration skipped in development');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    console.log('Service worker registered successfully:', registration);

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New content is available
            console.log('New content is available; please refresh.');
            config?.onUpdate?.(registration);
          } else {
            // Content is cached for offline use
            console.log('Content is cached for offline use.');
            config?.onSuccess?.(registration);
          }
        }
      });
    });

    return registration;
  } catch (error) {
    console.error('Service worker registration failed:', error);
    config?.onError?.(error as Error);
    return null;
  }
}

/**
 * Unregister the service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const result = await registration.unregister();
    console.log('Service worker unregistered:', result);
    return result;
  } catch (error) {
    console.error('Service worker unregistration failed:', error);
    return false;
  }
}

/**
 * Check if the app is running in standalone mode (PWA)
 */
export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

/**
 * Check if the app can be installed as PWA
 */
export function canInstallPWA(): boolean {
  return 'beforeinstallprompt' in window;
}

/**
 * Check network connectivity
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Listen for network status changes
 */
export function onNetworkStatusChange(callback: (isOnline: boolean) => void): () => void {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}