# Route Tracking Components

This directory contains all components related to GPS route tracking functionality.

## Components

### Core Components
- **RouteMap** - Displays routes on an interactive map
- **EnhancedActiveRouteMap** - Enhanced map component with animations, fullscreen, and advanced controls
- **RouteTracker** - Main component for starting/stopping route tracking
- **RouteProgress** - Shows real-time progress of active routes
- **GPSStatus** - Displays GPS signal quality and status
- **RouteList** - Lists user's routes with filtering options

### Utility Components
- **MapPanes** - Sets up Leaflet map panes for proper layering
- **MapResizeFix** - Handles map resize issues

### Utils
- **mapUtils** - Map-related utility functions and configurations

## Usage Examples

```tsx
import { 
  RouteMap, 
  EnhancedActiveRouteMap, 
  RouteTracker, 
  GPSStatus 
} from '@/components/features/route-tracking';

// Basic route map
<RouteMap route={routeData} interactive={true} />

// Enhanced active route map with animations and controls
<EnhancedActiveRouteMap
  userId="user-123"
  activeRoute={activeRouteData}
  currentLocation={currentGPSPosition}
  onRouteUpdate={(coordinates) => console.log('Route updated:', coordinates)}
  onComplete={() => console.log('Route completed')}
  height="400px"
  fullscreenEnabled={true}
  className="rounded-lg shadow-lg"
/>

// Route tracker with callbacks
<RouteTracker 
  onRouteComplete={(route) => console.log('Route completed:', route)}
  isActive={true}
/>

// GPS status indicator
<GPSStatus accuracy={5} isTracking={true} />
```

## Types

All TypeScript interfaces and types are defined in `types.ts` and component files:
- `RouteDetail` - Complete route information
- `GPSCoordinate` - GPS coordinate with metadata
- `EnhancedGPSCoordinate` - Enhanced GPS coordinate with additional metadata
- `MapViewState` - Map view state management
- `AnimationConfig` - Animation configuration options
- `RouteStats` - Real-time route statistics
- Component prop interfaces

## Dependencies

- React Leaflet for map functionality
- Lucide React for icons
- Custom hooks for business logic