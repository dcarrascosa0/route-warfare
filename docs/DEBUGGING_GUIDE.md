# Frontend Debugging Guide

This guide provides comprehensive debugging and troubleshooting information for the Route Wars frontend application.

## Table of Contents

1. [Development Tools](#development-tools)
2. [Common Issues](#common-issues)
3. [API Integration Debugging](#api-integration-debugging)
4. [Performance Debugging](#performance-debugging)
5. [WebSocket Debugging](#websocket-debugging)
6. [Error Handling](#error-handling)
7. [Logging and Monitoring](#logging-and-monitoring)

## Development Tools

### Built-in Debug Panel

The application includes a comprehensive debug panel accessible in development mode:

**Activation:**
- Press `Ctrl+Shift+D` (Windows/Linux) or `Cmd+Shift+D` (Mac)
- Click the "Dev Tools" button in the bottom-left corner
- Use the "Debug" button for the detailed debug panel

**Features:**
- Real-time log viewing and filtering
- Performance metrics monitoring
- Network request inspection
- System information display
- Export functionality for debugging data

### React Query DevTools

Monitor and debug data fetching with React Query DevTools:

**Access:**
- Available automatically in development mode
- Click the React Query logo in the bottom-right corner
- View queries, mutations, and cache state

**Key Features:**
- Query state inspection
- Cache invalidation monitoring
- Mutation lifecycle tracking
- Performance analysis

### Health Check Dashboard

Monitor backend service connectivity:

**Location:** Dev Tools → Health Monitor tab

**Features:**
- Real-time service health monitoring
- Response time tracking
- Auto-refresh capabilities
- Service status indicators

### API Connection Tester

Test and debug API endpoints:

**Location:** Dev Tools → API Testing tab

**Features:**
- Predefined endpoint testing
- Custom request builder
- Response inspection
- Auto-testing capabilities

## Common Issues

### 1. Authentication Problems

**Symptoms:**
- 401 Unauthorized errors
- Automatic logout
- Token refresh failures

**Debugging Steps:**
1. Check browser localStorage for tokens:
   ```javascript
   localStorage.getItem('access_token')
   localStorage.getItem('refresh_token')
   ```

2. Verify token expiration:
   ```javascript
   // Decode JWT token (base64)
   const token = localStorage.getItem('access_token');
   const payload = JSON.parse(atob(token.split('.')[1]));
   console.log('Token expires:', new Date(payload.exp * 1000));
   ```

3. Check network requests in DevTools:
   - Look for 401 responses
   - Verify Authorization headers

**Solutions:**
- Clear localStorage and re-login
- Check API Gateway authentication configuration
- Verify JWT secret keys match between frontend and backend

### 2. API Connection Issues

**Symptoms:**
- Network errors
- Timeout errors
- CORS issues

**Debugging Steps:**
1. Use the API Connection Tester
2. Check browser Network tab for failed requests
3. Verify API Gateway is running on correct port
4. Check CORS configuration

**Solutions:**
- Verify API_URL environment variable
- Check Docker containers are running
- Review API Gateway logs
- Update CORS settings if needed

### 3. WebSocket Connection Problems

**Symptoms:**
- Real-time updates not working
- Connection failed errors
- Frequent reconnections

**Debugging Steps:**
1. Check WebSocket connection in Network tab
2. Monitor connection status in Debug Panel
3. Verify WebSocket URL configuration

**Solutions:**
- Check WebSocket server is running
- Verify WS_URL environment variable
- Review firewall/proxy settings

### 4. Map and GPS Issues

**Symptoms:**
- Map not loading
- GPS permission denied
- Inaccurate location data

**Debugging Steps:**
1. Check browser console for Leaflet errors
2. Verify GPS permissions in browser settings
3. Test location services manually

**Solutions:**
- Enable location services
- Check HTTPS requirement for GPS
- Verify map tile server accessibility

## API Integration Debugging

### Request/Response Inspection

**Using Debug Panel:**
1. Open Debug Panel (`Ctrl+Shift+D`)
2. Go to Logs tab
3. Filter by "api-client" component
4. Inspect request/response details

**Using Browser DevTools:**
1. Open Network tab
2. Filter by XHR/Fetch requests
3. Inspect headers, payload, and response

### Common API Errors

| Status Code | Meaning | Common Causes |
|-------------|---------|---------------|
| 400 | Bad Request | Invalid request data, validation errors |
| 401 | Unauthorized | Missing/invalid authentication token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Endpoint doesn't exist, resource not found |
| 429 | Too Many Requests | Rate limiting triggered |
| 500 | Internal Server Error | Backend service error |
| 502 | Bad Gateway | API Gateway can't reach service |
| 503 | Service Unavailable | Service is down or overloaded |

### Correlation ID Tracking

Every API request includes a correlation ID for tracking:

```javascript
// Find requests by correlation ID in logs
const logs = logger.getLogs();
const requestLogs = logs.filter(log => 
  log.context.correlationId === 'your-correlation-id'
);
```

## Performance Debugging

### Performance Monitoring

**Built-in Metrics:**
- API response times
- Component render performance
- Navigation timing
- Custom metrics

**Accessing Performance Data:**
```javascript
// Get performance report
const report = performanceMonitor.getPerformanceReport();
console.log('API Stats:', report.api);
console.log('Render Stats:', report.render);
console.log('Slow Operations:', report.slowOperations);
```

### Performance Thresholds

Default thresholds for performance warnings:
- API Response: 1000ms
- Component Render: 16ms (60fps)
- Navigation: 2000ms

**Customizing Thresholds:**
```javascript
performanceMonitor.setThresholds({
  apiResponse: 500,    // 500ms
  componentRender: 10, // 10ms
  navigation: 1000     // 1s
});
```

### Common Performance Issues

**Slow API Responses:**
- Check network conditions
- Review backend service performance
- Consider implementing caching

**Slow Component Renders:**
- Use React DevTools Profiler
- Check for unnecessary re-renders
- Optimize component dependencies

**Memory Leaks:**
- Monitor memory usage in DevTools
- Check for uncleared intervals/timeouts
- Review event listener cleanup

## WebSocket Debugging

### Connection Status Monitoring

**Check Connection State:**
```javascript
// In NotificationContext
const { isConnected, connectionError } = useNotifications();
console.log('WebSocket Connected:', isConnected);
console.log('Connection Error:', connectionError);
```

### WebSocket Events

**Monitor WebSocket Events:**
1. Open Debug Panel
2. Filter logs by "websocket" or "notification"
3. Look for connection/disconnection events

**Common WebSocket Issues:**
- Connection refused: Check WebSocket server
- Frequent disconnections: Network instability
- No events received: Check event subscriptions

## Error Handling

### Error Boundaries

The application uses error boundaries to catch React errors:

**Global Error Boundary:**
- Catches unhandled component errors
- Displays user-friendly error messages
- Logs errors for debugging

**API Error Handling:**
- Automatic retry for transient errors
- User-friendly error messages
- Correlation ID tracking

### Error Logging

**Accessing Error Logs:**
```javascript
// Get error logs
const errorLogs = logger.getLogs().filter(log => log.level === 'error');
console.log('Recent Errors:', errorLogs);
```

**Error Context:**
Each error log includes:
- Correlation ID
- Component name
- Action being performed
- Error details
- Stack trace (in development)

## Logging and Monitoring

### Log Levels

- **Debug:** Detailed information for debugging
- **Info:** General information about application flow
- **Warn:** Warning conditions that should be noted
- **Error:** Error conditions that need attention

### Log Filtering

**In Debug Panel:**
1. Use search box to filter by message content
2. Select log level from dropdown
3. Filter by component or action

**Programmatically:**
```javascript
// Filter logs by component
const componentLogs = logger.getLogs().filter(log => 
  log.context.component === 'route-tracker'
);

// Filter logs by time range
const recentLogs = logger.getLogs().filter(log => 
  new Date(log.timestamp) > new Date(Date.now() - 3600000) // Last hour
);
```

### Exporting Debug Data

**From Debug Panel:**
1. Click "Export" button
2. Save JSON file with debug data

**Programmatically:**
```javascript
// Export all debug data
const debugData = {
  logs: logger.getLogs(),
  performance: performanceMonitor.exportMetrics(),
  timestamp: new Date().toISOString()
};
```

## Troubleshooting Checklist

### Before Reporting Issues

1. **Check Development Tools:**
   - [ ] Review error logs in Debug Panel
   - [ ] Check API connection status
   - [ ] Verify service health in Health Monitor

2. **Verify Environment:**
   - [ ] Confirm development/production mode
   - [ ] Check environment variables
   - [ ] Verify API endpoints are accessible

3. **Test Basic Functionality:**
   - [ ] Authentication works
   - [ ] API requests succeed
   - [ ] WebSocket connections establish

4. **Collect Debug Information:**
   - [ ] Export debug data from Debug Panel
   - [ ] Note browser and version
   - [ ] Document steps to reproduce

### Getting Help

When reporting issues, include:
- Debug data export
- Browser console logs
- Steps to reproduce
- Expected vs actual behavior
- Environment details (browser, OS, network)

## Advanced Debugging

### Custom Logging

**Add Custom Logs:**
```javascript
import { logger } from '../lib/logger';

// In your component
logger.info('Custom event occurred', {
  component: 'MyComponent',
  action: 'custom-action',
  metadata: { key: 'value' }
});
```

### Performance Tracking

**Track Custom Metrics:**
```javascript
import { performanceMonitor } from '../lib/performance-monitor';

// Time an operation
const endTiming = performanceMonitor.startTiming('customOperation');
// ... perform operation
const duration = endTiming();

// Record custom metric
performanceMonitor.recordCustomMetric('customMetric', duration, {
  operation: 'data-processing'
});
```

### Connection Testing

**Test Custom Endpoints:**
```javascript
import { connectionTester } from '../lib/connection-tester';

const result = await connectionTester.testEndpoint({
  name: 'Custom API',
  url: '/api/custom',
  method: 'GET'
});

console.log('Test Result:', result);
```

This debugging guide should help you identify and resolve issues quickly. For additional support, refer to the application logs and monitoring dashboards.