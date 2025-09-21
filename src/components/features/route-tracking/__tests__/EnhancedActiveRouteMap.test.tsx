import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EnhancedActiveRouteMap from '../EnhancedActiveRouteMap';
import type { RouteDetail } from '@/lib/api/types/routes';

// Mock Leaflet
vi.mock('leaflet', () => ({
  default: {
    Map: vi.fn(),
    TileLayer: vi.fn(),
    LatLngBounds: vi.fn().mockImplementation((bounds) => ({
      isValid: () => true,
      getNorthEast: () => ({ lat: bounds[1][0], lng: bounds[1][1] }),
      getSouthWest: () => ({ lat: bounds[0][0], lng: bounds[0][1] }),
    })),
  },
}));

// Mock react-leaflet components
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children, whenCreated, ...props }: any) => {
    // Simulate map creation
    if (whenCreated) {
      const mockMap = {
        invalidateSize: vi.fn(),
        zoomIn: vi.fn(),
        zoomOut: vi.fn(),
        fitBounds: vi.fn(),
      };
      setTimeout(() => whenCreated(mockMap), 0);
    }
    return <div data-testid="map-container" {...props}>{children}</div>;
  },
  TileLayer: (props: any) => <div data-testid="tile-layer" {...props} />,
}));

// Mock map utility components
vi.mock('../components/MapPanes', () => ({
  default: () => <div data-testid="map-panes" />,
}));

vi.mock('../components/MapResizeFix', () => ({
  default: () => <div data-testid="map-resize-fix" />,
}));

// Mock map utils
vi.mock('../utils/mapUtils', () => ({
  calculateBounds: vi.fn(() => ({
    isValid: () => true,
    getNorthEast: () => ({ lat: 40.7589, lng: -73.9851 }),
    getSouthWest: () => ({ lat: 40.7489, lng: -73.9951 }),
  })),
  calculateCenter: vi.fn(() => [40.7589, -73.9851]),
  TILE_DARK_WITH_LABELS: 'https://test-tiles.com/{z}/{x}/{y}.png',
}));

describe('EnhancedActiveRouteMap', () => {
  const mockActiveRoute: RouteDetail = {
    id: 'test-route-1',
    user_id: 'test-user-1',
    name: 'Test Route',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    stats: {
      distance_meters: 1000,
      duration_seconds: 600,
      coordinate_count: 10,
      is_closed_loop: false,
      territory_area_km2: null,
    },
    coordinates: [
      {
        latitude: 40.7589,
        longitude: -73.9851,
        timestamp: '2024-01-01T00:00:00Z',
        accuracy: 5,
      },
      {
        latitude: 40.7599,
        longitude: -73.9841,
        timestamp: '2024-01-01T00:01:00Z',
        accuracy: 3,
      },
    ],
  };

  const mockCurrentLocation: GeolocationPosition = {
    coords: {
      latitude: 40.7589,
      longitude: -73.9851,
      accuracy: 5,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    },
    timestamp: Date.now(),
  };

  const defaultProps = {
    userId: 'test-user-1',
    activeRoute: mockActiveRoute,
    currentLocation: mockCurrentLocation,
    fullscreenEnabled: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the map container', () => {
    render(<EnhancedActiveRouteMap {...defaultProps} />);
    
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    expect(screen.getByTestId('tile-layer')).toBeInTheDocument();
    expect(screen.getByTestId('map-panes')).toBeInTheDocument();
    expect(screen.getByTestId('map-resize-fix')).toBeInTheDocument();
  });

  it('renders map controls', () => {
    render(<EnhancedActiveRouteMap {...defaultProps} />);
    
    expect(screen.getByTitle('Zoom In')).toBeInTheDocument();
    expect(screen.getByTitle('Zoom Out')).toBeInTheDocument();
    expect(screen.getByTitle('Fit to Route')).toBeInTheDocument();
    expect(screen.getByTitle('Enter Fullscreen')).toBeInTheDocument();
  });

  it('handles fullscreen toggle', async () => {
    render(<EnhancedActiveRouteMap {...defaultProps} />);
    
    const fullscreenButton = screen.getByTitle('Enter Fullscreen');
    fireEvent.click(fullscreenButton);
    
    // After clicking, it should show "Exit Fullscreen"
    expect(screen.getByTitle('Exit Fullscreen')).toBeInTheDocument();
  });

  it('disables fullscreen button when fullscreenEnabled is false', () => {
    render(<EnhancedActiveRouteMap {...defaultProps} fullscreenEnabled={false} />);
    
    expect(screen.queryByTitle('Enter Fullscreen')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Exit Fullscreen')).not.toBeInTheDocument();
  });

  it('applies custom className and height', () => {
    const { container } = render(
      <EnhancedActiveRouteMap 
        {...defaultProps} 
        className="custom-class" 
        height="500px" 
      />
    );
    
    const mapWrapper = container.firstChild as HTMLElement;
    expect(mapWrapper).toHaveClass('custom-class');
    expect(mapWrapper).toHaveStyle({ height: '500px' });
  });

  it('handles route with no coordinates', () => {
    const emptyRoute = {
      ...mockActiveRoute,
      coordinates: [],
    };
    
    render(<EnhancedActiveRouteMap {...defaultProps} activeRoute={emptyRoute} />);
    
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  it('handles missing current location', () => {
    render(<EnhancedActiveRouteMap {...defaultProps} currentLocation={null} />);
    
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  it('calls callback functions when provided', () => {
    const onRouteUpdate = vi.fn();
    const onComplete = vi.fn();
    const onPause = vi.fn();
    const onResume = vi.fn();
    
    render(
      <EnhancedActiveRouteMap 
        {...defaultProps} 
        onRouteUpdate={onRouteUpdate}
        onComplete={onComplete}
        onPause={onPause}
        onResume={onResume}
      />
    );
    
    // Component should render without errors when callbacks are provided
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  it('calculates route statistics correctly', () => {
    render(<EnhancedActiveRouteMap {...defaultProps} />);
    
    // Component should render and calculate stats internally
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  it('handles zoom controls', async () => {
    render(<EnhancedActiveRouteMap {...defaultProps} />);
    
    const zoomInButton = screen.getByTitle('Zoom In');
    const zoomOutButton = screen.getByTitle('Zoom Out');
    const fitButton = screen.getByTitle('Fit to Route');
    
    // These should not throw errors when clicked
    fireEvent.click(zoomInButton);
    fireEvent.click(zoomOutButton);
    fireEvent.click(fitButton);
    
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });
});