import '@testing-library/jest-dom';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock geolocation
Object.defineProperty(navigator, 'geolocation', {
  writable: true,
  value: {
    getCurrentPosition: (success: PositionCallback) => {
      success({
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 5,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      });
    },
    watchPosition: () => 1,
    clearWatch: () => {},
  },
});

// Mock URL.createObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: () => 'mock-url',
});

// Mock URL.revokeObjectURL
Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: () => {},
});