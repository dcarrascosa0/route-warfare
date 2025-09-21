import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 5173,
    hmr: {
      clientPort: 5173,
      host: process.env.VITE_HMR_HOST || undefined,
    },
    watch: {
      usePolling: true,
      interval: 300,
    },
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL || "http://api-gateway:8000",
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'esnext',
    minify: mode === 'production' ? 'terser' : false,
    sourcemap: mode === 'development',
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries
          vendor: ['react', 'react-dom', 'react-router-dom'],
          
          // UI component libraries
          ui: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-toast',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-accordion',
            'lucide-react'
          ],
          
          // Map and geolocation libraries
          maps: ['leaflet', 'react-leaflet'],
          
          // Data fetching and state management
          data: ['@tanstack/react-query', '@tanstack/react-query-devtools'],
          
          // Form and validation libraries
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
          
          // Chart and visualization libraries
          charts: ['recharts'],
          
          // Utility libraries
          utils: ['date-fns', 'clsx', 'tailwind-merge', 'class-variance-authority']
        },
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop().replace(/\.[^/.]+$/, "") : "chunk";
          return `assets/${facadeModuleId}-[hash].js`;
        },
        assetFileNames: 'assets/[name]-[hash].[ext]',
        entryFileNames: 'assets/[name]-[hash].js',
      },
      external: mode === 'production' ? [] : undefined,
    },
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: false,
    assetsInlineLimit: 4096,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@tanstack/react-query-devtools',
      'leaflet',
      'react-leaflet'
    ]
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
}));
