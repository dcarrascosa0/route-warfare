# GPS Simulator Development Guide

The GPS Simulator is a development tool that allows you to test route tracking functionality without physically moving around. It replaces the browser's native geolocation API with simulated GPS coordinates following predefined movement patterns.

## How to Use

### 1. Access the GPS Simulator

**Option A: Through Dev Tools Panel**
1. Open the application in development mode
2. Press `Ctrl+Shift+D` (or `Cmd+Shift+D` on Mac) to open Dev Tools
3. Click on the "GPS Simulator" tab

**Option B: Direct Integration**
Add the GPS Simulator component directly to any page during development:

```tsx
import GPSSimulator from '@/components/gps-simulator';

function MyPage() {
  return (
    <div>
      {/* Your page content */}
      {process.env.NODE_ENV === 'development' && (
        <GPSSimulator />
      )}
    </div>
  );
}
```

### 2. Configure Your Route

1. **Select Route Pattern**: Choose from predefined patterns:
   - **Square Loop**: Simple 200m x 200m square path
   - **Circular Route**: Circular path with 150m radius  
   - **Figure 8**: Figure-8 pattern for complex territory shapes
   - **Random Walk**: Random movement with eventual return to start

2. **Set Starting Position**: 
   - Enter latitude and longitude coordinates
   - Default is NYC coordinates (40.7589, -73.9851)
   - Use your actual location or any coordinates you want to test

3. **Adjust Movement Speed**:
   - Set speed in meters per second (m/s)
   - Common speeds:
     - 1-2 m/s: Slow walk
     - 2-4 m/s: Normal walk  
     - 4-7 m/s: Jog
     - 7+ m/s: Run

4. **Enable Auto-Loop**: Toggle whether the route should automatically restart when completed

### 3. Start Simulation

1. Click "Start Simulation" to begin GPS simulation
2. The simulator will replace the browser's geolocation API
3. Your route tracking components will receive simulated GPS coordinates
4. Progress bar shows completion percentage

### 4. Test Route Tracking

1. With simulation running, go to the route tracking page
2. Start a new route using the RouteTracker component
3. Watch as the simulated GPS coordinates are processed
4. The route will follow your selected pattern automatically

### 5. Stop Simulation

1. Click "Stop Simulation" to end GPS simulation
2. The browser's native geolocation API will be restored
3. Any active route tracking will continue with real GPS (if available)

## Route Patterns Explained

### Square Loop
- Creates a simple rectangular path
- Good for testing basic territory claiming
- Predictable closed-loop shape
- 200m x 200m default size

### Circular Route  
- Perfect circle with configurable radius
- Tests curved boundary detection
- Good for testing area calculations
- 150m radius default

### Figure 8
- Complex shape with self-intersection
- Tests advanced territory algorithms
- Creates interesting boundary shapes
- Good for testing overlap detection

### Random Walk
- Unpredictable movement pattern
- Tests real-world GPS noise and variations
- Eventually returns to starting point
- Good for stress testing coordinate processing

## Development Tips

### Testing Different Scenarios

1. **Territory Claiming**: Use Square or Circle patterns to test successful territory claims
2. **Complex Boundaries**: Use Figure 8 to test complex polygon processing
3. **GPS Noise**: Use Random Walk to simulate real-world GPS variations
4. **Speed Variations**: Test different movement speeds to ensure proper coordinate processing

### Debugging GPS Issues

1. **Check Console**: GPS coordinates are logged during simulation
2. **Monitor Network**: Watch API calls to route service in DevTools
3. **Verify Coordinates**: Current position is displayed in simulator UI
4. **Test Accuracy**: Adjust accuracy values to test error handling

### Integration with Route Tracking

The simulator works seamlessly with your existing route tracking components:

```tsx
// Your existing route tracker will automatically use simulated GPS
function MyRouteTracker() {
  const { start, stop, isTracking } = useRouteTracker(userId);
  
  // This will use simulated coordinates when GPS simulator is active
  const handleStart = () => start();
  
  return (
    <div>
      <button onClick={handleStart}>Start Route</button>
      {/* GPS Simulator can run alongside */}
      {process.env.NODE_ENV === 'development' && (
        <GPSSimulator />
      )}
    </div>
  );
}
```

## Troubleshooting

### Simulation Not Working
- Ensure you're in development mode
- Check browser console for errors
- Verify the simulator shows "Simulating" status
- Make sure route tracking is started after simulation begins

### Coordinates Not Updating
- Check if auto-loop is enabled for continuous movement
- Verify movement speed is not too slow
- Ensure the selected route pattern has valid coordinates

### Route Not Completing
- Some patterns may take time to complete full loops
- Check if the route service requires minimum distance/time
- Verify the route completion logic in your backend

### Performance Issues
- Reduce coordinate batch size if needed
- Adjust update frequency in the simulator
- Monitor memory usage with large route patterns

## Advanced Usage

### Custom Route Patterns

You can extend the simulator with custom route patterns:

```tsx
// Add to ROUTE_PATTERNS in gps-simulator.tsx
custom_pattern: {
  name: "Custom Route",
  description: "Your custom description",
  points: [
    { lat: 40.7589, lng: -73.9851 },
    { lat: 40.7600, lng: -73.9860 },
    // ... more points
  ]
}
```

### Integration with Testing

Use the simulator in automated tests:

```tsx
// In your test files
import { render, screen } from '@testing-library/react';
import GPSSimulator from '@/components/gps-simulator';

test('GPS simulation works', async () => {
  render(<GPSSimulator />);
  
  // Start simulation
  const startButton = screen.getByText('Start Simulation');
  fireEvent.click(startButton);
  
  // Verify simulation is active
  expect(screen.getByText('Simulating')).toBeInTheDocument();
});
```

## Best Practices

1. **Always Stop Simulation**: Remember to stop GPS simulation when done testing
2. **Use Realistic Speeds**: Test with realistic human movement speeds
3. **Test Edge Cases**: Use different patterns to test various scenarios
4. **Monitor Performance**: Watch for memory leaks during long simulations
5. **Clean Up**: Ensure geolocation API is properly restored after simulation

The GPS Simulator makes it easy to develop and test location-based features without leaving your desk!