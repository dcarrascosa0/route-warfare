# Frontend Troubleshooting Guide

Quick reference guide for common issues and their solutions in the Route Wars frontend application.

## Quick Diagnostics

### Health Check Commands

```bash
# Check if all services are running
curl http://localhost:8000/health

# Check individual services
curl http://localhost:8001/health  # Auth Service
curl http://localhost:8002/health  # User Service
curl http://localhost:8003/health  # Route Service
curl http://localhost:8004/health  # Territory Service
curl http://localhost:8005/health  # Leaderboard Service
curl http://localhost:8006/health  # Notification Service
```

### Browser Console Quick Checks

```javascript
// Check authentication status
console.log('Access Token:', localStorage.getItem('access_token'));
console.log('User ID:', localStorage.getItem('user_id'));

// Check API connectivity
fetch('/health').then(r => r.json()).then(console.log);

// Check WebSocket support
console.log('WebSocket Support:', 'WebSocket' in window);

// Check geolocation support
console.log('Geolocation Support:', 'geolocation' in navigator);
```

## Common Issues & Solutions

### 1. Application Won't Load

**Symptoms:**
- Blank white screen
- "Loading..." that never completes
- JavaScript errors in console

**Quick Fixes:**
1. **Hard refresh:** `Ctrl+F5` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. **Clear cache:** Browser settings → Clear browsing data
3. **Check console:** Look for JavaScript errors

**Detailed Solutions:**
```bash
# If using Docker
docker-compose down
docker-compose up --build

# If running locally
npm run dev
```

### 2. Login/Authentication Issues

**Symptoms:**
- Can't log in with valid credentials
- Automatic logout after page refresh
- 401 Unauthorized errors

**Quick Fixes:**
1. **Clear authentication data:**
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   ```

2. **Check API Gateway:**
   ```bash
   curl -X POST http://localhost:8000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password"}'
   ```

3. **Verify services are running:**
   ```bash
   docker ps | grep route-wars
   ```

### 3. Map Not Loading

**Symptoms:**
- Gray area where map should be
- "Map container not found" error
- Tiles not loading

**Quick Fixes:**
1. **Check internet connection** (map tiles require internet)
2. **Verify HTTPS** (required for geolocation)
3. **Check browser permissions** for location access

**Detailed Solutions:**
```javascript
// Test map tile access
fetch('https://tile.openstreetmap.org/1/0/0.png')
  .then(response => console.log('Tile server accessible:', response.ok))
  .catch(error => console.error('Tile server error:', error));

// Test geolocation
navigator.geolocation.getCurrentPosition(
  position => console.log('Location:', position.coords),
  error => console.error('Geolocation error:', error)
);
```

### 4. Real-time Updates Not Working

**Symptoms:**
- Territory changes not appearing
- Notifications not received
- WebSocket connection failed

**Quick Fixes:**
1. **Check WebSocket connection:**
   ```javascript
   // In browser console
   const ws = new WebSocket('ws://localhost:8000/ws');
   ws.onopen = () => console.log('WebSocket connected');
   ws.onerror = (error) => console.error('WebSocket error:', error);
   ```

2. **Verify notification service:**
   ```bash
   curl http://localhost:8006/health
   ```

3. **Check firewall/proxy settings** (may block WebSocket connections)

### 5. GPS/Location Issues

**Symptoms:**
- "Location access denied"
- Inaccurate GPS coordinates
- GPS not working

**Quick Fixes:**
1. **Enable location services** in browser settings
2. **Use HTTPS** (required for geolocation API)
3. **Check device GPS** is enabled

**Browser-Specific Solutions:**

**Chrome:**
- Settings → Privacy and security → Site Settings → Location
- Allow location access for your site

**Firefox:**
- Address bar → Shield icon → Permissions → Location

**Safari:**
- Safari → Preferences → Websites → Location

### 6. Performance Issues

**Symptoms:**
- Slow page loading
- Laggy map interactions
- High memory usage

**Quick Fixes:**
1. **Close other browser tabs**
2. **Disable browser extensions**
3. **Check network speed**

**Performance Debugging:**
```javascript
// Check performance metrics
const report = performanceMonitor.getPerformanceReport();
console.log('Performance Report:', report);

// Monitor memory usage
console.log('Memory:', performance.memory);
```

### 7. API Connection Problems

**Symptoms:**
- Network errors
- Timeout errors
- 502/503 errors

**Quick Fixes:**
1. **Check API Gateway status:**
   ```bash
   curl http://localhost:8000/health
   ```

2. **Verify Docker containers:**
   ```bash
   docker-compose ps
   ```

3. **Check logs:**
   ```bash
   docker-compose logs api-gateway
   ```

**Connection Testing:**
```javascript
// Test API connectivity
const endpoints = [
  '/health',
  '/api/v1/auth/health',
  '/api/v1/users/health',
  '/api/v1/routes/health'
];

endpoints.forEach(async (endpoint) => {
  try {
    const response = await fetch(endpoint);
    console.log(`${endpoint}: ${response.status}`);
  } catch (error) {
    console.error(`${endpoint}: ${error.message}`);
  }
});
```

## Environment-Specific Issues

### Development Environment

**Common Issues:**
- Hot reload not working
- Environment variables not loaded
- CORS errors

**Solutions:**
```bash
# Restart development server
npm run dev

# Check environment variables
cat .env.local

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Production Environment

**Common Issues:**
- Build failures
- Missing environment variables
- Static file serving issues

**Solutions:**
```bash
# Build and test locally
npm run build
npm run preview

# Check production environment variables
echo $VITE_API_URL
echo $VITE_WS_URL
```

## Browser-Specific Issues

### Chrome
- **Issue:** WebSocket connections blocked
- **Solution:** Check site permissions and disable ad blockers

### Firefox
- **Issue:** Geolocation not working
- **Solution:** Enable `geo.enabled` in about:config

### Safari
- **Issue:** WebSocket connections unstable
- **Solution:** Update to latest Safari version

### Mobile Browsers
- **Issue:** Touch gestures not working
- **Solution:** Ensure touch event handlers are properly implemented

## Network and Connectivity

### Corporate Networks/Firewalls

**Common Blocks:**
- WebSocket connections (port 8000)
- External map tile servers
- Geolocation services

**Solutions:**
1. **Contact IT department** for WebSocket whitelist
2. **Use VPN** if available
3. **Test on mobile hotspot** to isolate network issues

### Proxy Servers

**Issues:**
- API requests failing
- WebSocket connections blocked
- Mixed content warnings

**Solutions:**
```javascript
// Configure proxy in vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true
      }
    }
  }
});
```

## Data and State Issues

### Corrupted Local Storage

**Symptoms:**
- App behaves unexpectedly
- Login state inconsistent
- Settings not persisting

**Solution:**
```javascript
// Clear all local storage
localStorage.clear();
sessionStorage.clear();

// Clear specific items
localStorage.removeItem('access_token');
localStorage.removeItem('refresh_token');
localStorage.removeItem('user_id');
```

### Cache Issues

**Symptoms:**
- Old data displayed
- Changes not reflected
- Stale API responses

**Solutions:**
```javascript
// Clear React Query cache
queryClient.clear();

// Invalidate specific queries
queryClient.invalidateQueries(['user', 'profile']);

// Force refetch
queryClient.refetchQueries();
```

## Debugging Tools Usage

### Built-in Debug Panel

**Access:** Press `Ctrl+Shift+D` or click "Debug" button

**Features:**
- Real-time logs
- Performance metrics
- Network monitoring
- System information

### React Query DevTools

**Access:** Click React Query logo in development mode

**Use Cases:**
- Monitor query states
- Debug cache issues
- Analyze performance

### Browser DevTools

**Network Tab:**
- Monitor API requests
- Check response times
- Identify failed requests

**Console Tab:**
- View error messages
- Run diagnostic commands
- Check application state

**Application Tab:**
- Inspect local storage
- Check service workers
- Monitor cache

## Emergency Procedures

### Complete Reset

If all else fails, perform a complete reset:

```bash
# Stop all services
docker-compose down -v

# Clear Docker cache
docker system prune -a

# Clear browser data
# (Use browser settings to clear all site data)

# Restart services
docker-compose up --build
```

### Backup and Restore

**Backup user data:**
```javascript
// Export user data
const userData = {
  profile: localStorage.getItem('user_profile'),
  settings: localStorage.getItem('user_settings'),
  routes: localStorage.getItem('user_routes')
};
console.log('Backup data:', JSON.stringify(userData));
```

**Restore user data:**
```javascript
// Restore from backup
const backupData = /* your backup data */;
Object.entries(backupData).forEach(([key, value]) => {
  if (value) localStorage.setItem(key, value);
});
```

## Getting Additional Help

### Log Collection

Before seeking help, collect these logs:

1. **Browser console logs**
2. **Debug panel export**
3. **Network tab HAR file**
4. **Docker container logs**

### Information to Include

When reporting issues:
- Browser and version
- Operating system
- Network environment (corporate, home, mobile)
- Steps to reproduce
- Expected vs actual behavior
- Error messages and screenshots

### Support Channels

1. **Check documentation** first
2. **Search existing issues** in project repository
3. **Create detailed bug report** with logs and reproduction steps

## Prevention Tips

### Regular Maintenance

1. **Keep browser updated**
2. **Clear cache periodically**
3. **Monitor performance metrics**
4. **Update dependencies regularly**

### Best Practices

1. **Use HTTPS in production**
2. **Enable error reporting**
3. **Monitor service health**
4. **Test on multiple browsers**
5. **Implement proper error boundaries**

This troubleshooting guide should help you quickly identify and resolve most common issues. For complex problems, use the debugging tools and collect detailed information before seeking additional help.