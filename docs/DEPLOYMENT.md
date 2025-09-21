# Frontend Deployment Guide

This document provides comprehensive instructions for deploying the Route Wars frontend application to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Build Process](#build-process)
4. [Deployment Options](#deployment-options)
5. [Performance Optimization](#performance-optimization)
6. [Monitoring and Analytics](#monitoring-and-analytics)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- Node.js 18+ (LTS recommended)
- npm 9+ or yarn 1.22+
- Git
- Docker (optional, for containerized deployment)

### Development Dependencies

```bash
npm install
```

### Environment Setup

Ensure you have the following environment files configured:

- `.env.production` - Production environment variables
- `.env.development` - Development environment variables
- `.env.local` - Local overrides (not committed to git)

## Environment Configuration

### Production Environment Variables

Create a `.env.production` file with the following variables:

```bash
# API Configuration
VITE_API_URL=https://api.routewars.com
VITE_WS_URL=wss://api.routewars.com

# Map Configuration
VITE_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png

# Feature Flags
VITE_ENABLE_SW=true
VITE_ENABLE_ANALYTICS=true

# Logging
VITE_LOG_LEVEL=error

# Monitoring (optional)
VITE_SENTRY_DSN=your_sentry_dsn_here

# App Version
VITE_APP_VERSION=${npm_package_version}
```

### Security Considerations

- Never commit sensitive credentials to version control
- Use environment-specific configuration files
- Validate all environment variables at build time
- Use HTTPS for all production endpoints

## Build Process

### Development Build

```bash
npm run build:dev
```

### Production Build

```bash
npm run build
```

### Bundle Analysis

To analyze bundle size and optimize performance:

```bash
npm run build:analyze
```

This will generate a bundle analysis report showing:
- Chunk sizes and dependencies
- Unused code detection
- Optimization opportunities

### Build Verification

After building, verify the build output:

```bash
# Preview the production build locally
npm run preview

# Check build artifacts
ls -la dist/
```

Expected build output:
```
dist/
├── assets/
│   ├── vendor-[hash].js      # Core React libraries
│   ├── ui-[hash].js          # UI components
│   ├── maps-[hash].js        # Map libraries
│   ├── data-[hash].js        # Data fetching
│   ├── forms-[hash].js       # Form libraries
│   ├── charts-[hash].js      # Chart libraries
│   ├── utils-[hash].js       # Utility libraries
│   └── index-[hash].css      # Styles
├── index.html
├── manifest.json
└── sw.js                     # Service worker
```

## Deployment Options

### Option 1: Static Hosting (Recommended)

Deploy to static hosting services like Netlify, Vercel, or AWS S3 + CloudFront.

#### Netlify Deployment

1. Connect your repository to Netlify
2. Configure build settings:
   ```
   Build command: npm run build
   Publish directory: dist
   ```
3. Set environment variables in Netlify dashboard
4. Configure redirects for SPA routing:
   ```
   # _redirects file
   /*    /index.html   200
   ```

#### Vercel Deployment

1. Install Vercel CLI: `npm i -g vercel`
2. Deploy: `vercel --prod`
3. Configure environment variables in Vercel dashboard

#### AWS S3 + CloudFront

1. Build the application: `npm run build`
2. Upload `dist/` contents to S3 bucket
3. Configure CloudFront distribution
4. Set up custom domain and SSL certificate

### Option 2: Docker Deployment

Use the provided Dockerfile for containerized deployment:

```bash
# Build Docker image
docker build -t route-wars-frontend .

# Run container
docker run -p 3000:80 route-wars-frontend
```

### Option 3: Kubernetes Deployment

Use the provided Kubernetes manifests:

```bash
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml
kubectl apply -f k8s/frontend-ingress.yaml
```

## Performance Optimization

### Code Splitting

The application implements automatic code splitting:

- **Route-based splitting**: Each page is loaded on demand
- **Library splitting**: Third-party libraries are bundled separately
- **Component splitting**: Large components can be lazy-loaded

### Caching Strategy

#### Browser Caching

- Static assets: 1 year cache with hash-based invalidation
- HTML files: No cache (always fresh)
- API responses: Cached based on endpoint requirements

#### Service Worker Caching

- **Static assets**: Cache-first strategy
- **API responses**: Network-first with cache fallback
- **Navigation**: Network-first with offline fallback

### Bundle Optimization

Current bundle targets:
- Main bundle: < 200KB gzipped
- Vendor bundle: < 300KB gzipped
- Total initial load: < 500KB gzipped

Optimization techniques:
- Tree shaking for unused code elimination
- Minification and compression
- Dynamic imports for code splitting
- Asset optimization (images, fonts)

### Performance Monitoring

Monitor key metrics:
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- First Input Delay (FID): < 100ms
- Cumulative Layout Shift (CLS): < 0.1

## Monitoring and Analytics

### Error Tracking

Configure Sentry for error tracking:

```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
});
```

### Performance Monitoring

Use Web Vitals for performance tracking:

```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

### Analytics Integration

Configure analytics tracking:

```typescript
// Google Analytics 4
gtag('config', 'GA_MEASUREMENT_ID');

// Custom events
gtag('event', 'route_completed', {
  event_category: 'engagement',
  event_label: 'user_action'
});
```

## Security Best Practices

### Content Security Policy (CSP)

Configure CSP headers:

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline'; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data: https:; 
               connect-src 'self' wss: https:;">
```

### HTTPS Configuration

- Use HTTPS for all production deployments
- Configure HSTS headers
- Use secure cookies for authentication

### API Security

- Validate all API responses
- Implement proper error handling
- Use CORS configuration
- Sanitize user inputs

## Troubleshooting

### Common Build Issues

#### Node.js Version Mismatch
```bash
# Check Node.js version
node --version

# Use Node Version Manager
nvm use 18
```

#### Memory Issues During Build
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

#### Missing Environment Variables
```bash
# Verify environment variables
npm run build 2>&1 | grep -i "undefined"
```

### Runtime Issues

#### Service Worker Not Updating
```javascript
// Force service worker update
navigator.serviceWorker.getRegistrations().then(function(registrations) {
  for(let registration of registrations) {
    registration.unregister();
  }
});
```

#### API Connection Issues
```javascript
// Test API connectivity
fetch('/api/health')
  .then(response => console.log('API Status:', response.status))
  .catch(error => console.error('API Error:', error));
```

#### Map Loading Issues
```javascript
// Check map tile loading
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).on('tileerror', function(error) {
  console.error('Map tile error:', error);
});
```

### Performance Issues

#### Large Bundle Size
1. Run bundle analyzer: `npm run build:analyze`
2. Identify large dependencies
3. Implement dynamic imports
4. Remove unused dependencies

#### Slow Initial Load
1. Check network waterfall in DevTools
2. Optimize critical rendering path
3. Implement resource hints (preload, prefetch)
4. Use service worker for caching

#### Memory Leaks
1. Use React DevTools Profiler
2. Check for unremoved event listeners
3. Verify WebSocket connections are closed
4. Monitor component unmounting

## Deployment Checklist

### Pre-deployment

- [ ] All tests passing
- [ ] Bundle size within limits
- [ ] Environment variables configured
- [ ] Security headers configured
- [ ] Error tracking configured
- [ ] Performance monitoring setup

### Deployment

- [ ] Build successful
- [ ] Static assets uploaded
- [ ] DNS configured
- [ ] SSL certificate installed
- [ ] CDN configured (if applicable)
- [ ] Health checks passing

### Post-deployment

- [ ] Application loads correctly
- [ ] All routes accessible
- [ ] API connectivity verified
- [ ] WebSocket connections working
- [ ] Service worker registered
- [ ] Error tracking active
- [ ] Performance metrics baseline established

### Rollback Plan

1. Keep previous build artifacts
2. Document rollback procedure
3. Test rollback in staging
4. Monitor error rates post-deployment
5. Have emergency contacts ready

## Maintenance

### Regular Tasks

- Update dependencies monthly
- Monitor bundle size growth
- Review error logs weekly
- Update security headers
- Refresh SSL certificates

### Performance Reviews

- Quarterly performance audits
- Bundle analysis reviews
- User experience metrics
- Core Web Vitals monitoring
- Accessibility compliance checks

## Support

For deployment issues:
1. Check this documentation
2. Review application logs
3. Check monitoring dashboards
4. Contact development team
5. Create incident report if needed

---

**Last Updated**: December 2024
**Version**: 1.0.0