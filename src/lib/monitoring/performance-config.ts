/**
 * Performance configuration and optimization utilities
 */

// Performance budgets and thresholds
export const PERFORMANCE_BUDGETS = {
    // Bundle size limits (in bytes)
    BUNDLE_SIZE: {
        MAIN: 200 * 1024, // 200KB gzipped
        VENDOR: 300 * 1024, // 300KB gzipped
        CHUNK: 100 * 1024, // 100KB gzipped per chunk
        TOTAL_INITIAL: 500 * 1024, // 500KB gzipped total
    },

    // Core Web Vitals thresholds
    WEB_VITALS: {
        FCP: 1500, // First Contentful Paint (ms)
        LCP: 2500, // Largest Contentful Paint (ms)
        FID: 100,  // First Input Delay (ms)
        CLS: 0.1,  // Cumulative Layout Shift
        TTI: 3500, // Time to Interactive (ms)
    },

    // Network performance
    NETWORK: {
        API_RESPONSE: 200, // API response time (ms)
        WEBSOCKET_CONNECT: 1000, // WebSocket connection time (ms)
        IMAGE_LOAD: 2000, // Image loading time (ms)
        FONT_LOAD: 1000, // Font loading time (ms)
    },
} as const;

// Feature flags for performance optimizations
export const PERFORMANCE_FLAGS = {
    ENABLE_CODE_SPLITTING: true,
    ENABLE_LAZY_LOADING: true,
    ENABLE_SERVICE_WORKER: import.meta.env.VITE_ENABLE_SW === 'true',
    ENABLE_BUNDLE_ANALYSIS: import.meta.env.DEV,
    ENABLE_PERFORMANCE_MONITORING: import.meta.env.PROD,
    ENABLE_PRELOADING: true,
    ENABLE_PREFETCHING: true,
} as const;

// Cache configuration
export const CACHE_CONFIG = {
    // Service Worker cache names
    CACHE_NAMES: {
        STATIC: 'route-wars-static-v1',
        DYNAMIC: 'route-wars-dynamic-v1',
        RUNTIME: 'route-wars-runtime-v1',
    },

    // Cache strategies
    STRATEGIES: {
        STATIC_ASSETS: 'CacheFirst',
        API_RESPONSES: 'NetworkFirst',
        NAVIGATION: 'NetworkFirst',
        IMAGES: 'CacheFirst',
    },

    // Cache expiration times (in seconds)
    EXPIRATION: {
        STATIC_ASSETS: 365 * 24 * 60 * 60, // 1 year
        API_RESPONSES: 5 * 60, // 5 minutes
        IMAGES: 30 * 24 * 60 * 60, // 30 days
        FONTS: 365 * 24 * 60 * 60, // 1 year
    },
} as const;

// Resource hints configuration
export const RESOURCE_HINTS = {
    // Critical resources to preload
    PRELOAD: [
        { href: '/fonts/inter-var.woff2', as: 'font', type: 'font/woff2', crossorigin: 'anonymous' },
    ],

    // Resources to prefetch for next navigation
    PREFETCH: [
        '/api/v1/territories/map',
        '/api/v1/leaderboard',
    ],

    // DNS prefetch for external domains
    DNS_PREFETCH: [
        'https://tile.openstreetmap.org',
        'https://api.routewars.com',
    ],
} as const;

// Image optimization configuration
export const IMAGE_CONFIG = {
    // Lazy loading threshold
    LAZY_LOAD_THRESHOLD: '50px',

    // Image formats preference
    FORMATS: ['webp', 'avif', 'jpg', 'png'],

    // Responsive breakpoints
    BREAKPOINTS: [320, 640, 768, 1024, 1280, 1536],

    // Quality settings
    QUALITY: {
        HIGH: 90,
        MEDIUM: 75,
        LOW: 60,
    },
} as const;

// Code splitting configuration
export const CODE_SPLITTING = {
    // Route-based chunks
    ROUTES: {
        HOME: () => import('../../pages/Index'),
        DASHBOARD: () => import('../../pages/Dashboard'),
        TERRITORY: () => import('../../pages/Territory'),
        ROUTES: () => import('../../pages/Routes'),
        LEADERBOARD: () => import('../../pages/Leaderboard'),
        PROFILE: () => import('../../pages/Profile'),
    },

    // Component-based chunks
    COMPONENTS: {
        MAP: () => import('../../components/features/territory-management/TerritoryMap'),
        CHARTS: () => import('../../components/features/user-profile/UserStatistics'),
        FORMS: () => import('../../components/features/route-tracking/RouteTracker'),
    },
} as const;

// Performance monitoring configuration
export const MONITORING_CONFIG = {
    // Metrics to track
    METRICS: [
        'FCP', 'LCP', 'FID', 'CLS', 'TTI', 'TTFB'
    ],

    // Sampling rate (0-1)
    SAMPLE_RATE: import.meta.env.PROD ? 0.1 : 1.0,

    // Reporting endpoint
    ENDPOINT: '/api/v1/metrics/performance',

    // Batch size for reporting
    BATCH_SIZE: 10,

    // Reporting interval (ms)
    REPORT_INTERVAL: 30000,
} as const;

// Memory management configuration
export const MEMORY_CONFIG = {
    // Component cleanup thresholds
    CLEANUP_THRESHOLD: 100, // Number of components before cleanup

    // Cache size limits
    CACHE_LIMITS: {
        QUERY_CACHE: 50, // Number of queries to cache
        IMAGE_CACHE: 100, // Number of images to cache
        COMPONENT_CACHE: 20, // Number of components to cache
    },

    // Garbage collection hints
    GC_HINTS: {
        ENABLE_MANUAL_GC: import.meta.env.DEV,
        GC_INTERVAL: 60000, // 1 minute
    },
} as const;

// Network optimization configuration
export const NETWORK_CONFIG = {
    // Request timeouts (ms)
    TIMEOUTS: {
        API_REQUEST: 10000,
        WEBSOCKET_CONNECT: 5000,
        IMAGE_LOAD: 15000,
    },

    // Retry configuration
    RETRY: {
        MAX_ATTEMPTS: 3,
        BACKOFF_FACTOR: 2,
        INITIAL_DELAY: 1000,
    },

    // Connection pooling
    CONNECTION_POOL: {
        MAX_CONNECTIONS: 6,
        KEEP_ALIVE: true,
        TIMEOUT: 30000,
    },
} as const;

// Development performance tools
export const DEV_TOOLS = {
    // Performance profiling
    ENABLE_PROFILER: import.meta.env.DEV,

    // Bundle analysis
    ENABLE_BUNDLE_ANALYZER: import.meta.env.DEV,

    // Memory profiling
    ENABLE_MEMORY_PROFILER: import.meta.env.DEV,

    // Network monitoring
    ENABLE_NETWORK_MONITOR: import.meta.env.DEV,
} as const;

/**
 * Get performance configuration based on environment
 */
export function getPerformanceConfig() {
    const isDev = import.meta.env.DEV;
    const isProd = import.meta.env.PROD;

    return {
        budgets: PERFORMANCE_BUDGETS,
        flags: PERFORMANCE_FLAGS,
        cache: CACHE_CONFIG,
        hints: RESOURCE_HINTS,
        images: IMAGE_CONFIG,
        splitting: CODE_SPLITTING,
        monitoring: MONITORING_CONFIG,
        memory: MEMORY_CONFIG,
        network: NETWORK_CONFIG,
        devTools: DEV_TOOLS,
        environment: {
            isDev,
            isProd,
            enableOptimizations: isProd,
            enableDebugging: isDev,
        },
    };
}

/**
 * Check if performance budget is exceeded
 */
export function checkPerformanceBudget(metric: string, value: number): boolean {
    const config = getPerformanceConfig();

    switch (metric) {
        case 'FCP':
            return value <= config.budgets.WEB_VITALS.FCP;
        case 'LCP':
            return value <= config.budgets.WEB_VITALS.LCP;
        case 'FID':
            return value <= config.budgets.WEB_VITALS.FID;
        case 'CLS':
            return value <= config.budgets.WEB_VITALS.CLS;
        case 'TTI':
            return value <= config.budgets.WEB_VITALS.TTI;
        default:
            return true;
    }
}

/**
 * Log performance warning if budget is exceeded
 */
export function warnIfBudgetExceeded(metric: string, value: number): void {
    if (!checkPerformanceBudget(metric, value)) {
        console.warn(`Performance budget exceeded for ${metric}: ${value}`);
    }
}