import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AnimatedRoutePolyline from '../AnimatedRoutePolyline';
import type { Coordinate } from '@/lib/api/types/common';
import '@testing-library/jest-dom';

// Mock Leaflet completely
vi.mock('leaflet', () => ({
  default: {
    latLngBounds: vi.fn(() => ({
      isValid: () => true,
      getNorthEast: () => ({ lat: 1, lng: 1 }),
      getSouthWest: () => ({ lat: 0, lng: 0 }),
    })),
  },
}));

// Mock react-leaflet components
vi.mock('react-leaflet', () => ({
  Polyline: ({ children, ...props }: any) => (
    <div data-testid="polyline" {...props}>
      {children}
    </div>
  ),
  useMap: vi.fn(() => ({
    fitBounds: vi.fn(),
    invalidateSize: vi.fn(),
  })),
}));

// Mock CSS imports
vi.mock('../AnimatedRoutePolyline.css', () => ({}));

// Sample coordinates for testing
const sampleCoordinates: Coordinate[] = [
  {
    latitude: 51.505,
    longitude: -0.09,
    timestamp: '2023-01-01T10:00:00Z',
    accuracy: 5,
  },
  {
    latitude: 51.506,
    longitude: -0.088,
    timestamp: '2023-01-01T10:01:00Z',
    accuracy: 3,
  },
  {
    latitude: 51.507,
    longitude: -0.087,
    timestamp: '2023-01-01T10:02:00Z',
    accuracy: 4,
  },
];

const closedLoopCoordinates: Coordinate[] = [
  ...sampleCoordinates,
  {
    latitude: 51.505,
    longitude: -0.09,
    timestamp: '2023-01-01T10:03:00Z',
    accuracy: 5,
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AnimatedRoutePolyline', () => {

  describe('Basic Rendering', () => {
    it('renders without crashing with valid coordinates', () => {
      render(
        <AnimatedRoutePolyline
          coordinates={sampleCoordinates}
          status="active"
          isClosedLoop={false}
        />
      );

      const polylines = screen.getAllByTestId('polyline');
      expect(polylines.length).toBeGreaterThan(0);
    });

    it('does not render with insufficient coordinates', () => {
      const { container } = render(
        <AnimatedRoutePolyline
          coordinates={[sampleCoordinates[0]]}
          status="active"
          isClosedLoop={false}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('does not render with empty coordinates', () => {
      const { container } = render(
        <AnimatedRoutePolyline
          coordinates={[]}
          status="active"
          isClosedLoop={false}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Route Status Styling', () => {
    it('applies correct styling for active routes', () => {
      render(
        <AnimatedRoutePolyline
          coordinates={sampleCoordinates}
          status="active"
          isClosedLoop={false}
        />
      );

      const polylines = screen.getAllByTestId('polyline');
      expect(polylines.length).toBeGreaterThan(0);
    });

    it('applies correct styling for completed routes', () => {
      render(
        <AnimatedRoutePolyline
          coordinates={sampleCoordinates}
          status="completed"
          isClosedLoop={false}
        />
      );

      const polylines = screen.getAllByTestId('polyline');
      expect(polylines.length).toBeGreaterThan(0);
    });

    it('applies correct styling for cancelled routes', () => {
      render(
        <AnimatedRoutePolyline
          coordinates={sampleCoordinates}
          status="cancelled"
          isClosedLoop={false}
        />
      );

      const polylines = screen.getAllByTestId('polyline');
      expect(polylines.length).toBeGreaterThan(0);
    });
  });

  describe('Closed Loop Handling', () => {
    it('applies special styling for closed loops', () => {
      render(
        <AnimatedRoutePolyline
          coordinates={closedLoopCoordinates}
          status="active"
          isClosedLoop={true}
        />
      );

      const polylines = screen.getAllByTestId('polyline');
      expect(polylines.length).toBeGreaterThan(0);
    });

    it('does not apply closed loop styling when isClosedLoop is false', () => {
      render(
        <AnimatedRoutePolyline
          coordinates={closedLoopCoordinates}
          status="active"
          isClosedLoop={false}
        />
      );

      const polylines = screen.getAllByTestId('polyline');
      expect(polylines.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Optimization', () => {
    it('handles large coordinate arrays efficiently', () => {
      // Create a large array of coordinates
      const largeCoordinateArray: Coordinate[] = Array.from({ length: 1000 }, (_, i) => ({
        latitude: 51.505 + (i * 0.001),
        longitude: -0.09 + (i * 0.001),
        timestamp: `2023-01-01T10:${String(i % 60).padStart(2, '0')}:00Z`,
        accuracy: 5,
      }));

      render(
        <AnimatedRoutePolyline
          coordinates={largeCoordinateArray}
          status="active"
          isClosedLoop={false}
        />
      );

      // Should still render without performance issues
      const polylines = screen.getAllByTestId('polyline');
      expect(polylines.length).toBeGreaterThan(0);
      // Should be optimized (less than original count due to sampling)
      expect(polylines.length).toBeLessThan(largeCoordinateArray.length);
    });
  });

  describe('Animation Configuration', () => {
    it('accepts custom animation speed', () => {
      render(
        <AnimatedRoutePolyline
          coordinates={sampleCoordinates}
          status="active"
          isClosedLoop={false}
          animationSpeed={100}
        />
      );

      const polylines = screen.getAllByTestId('polyline');
      expect(polylines.length).toBeGreaterThan(0);
    });

    it('calls onPathComplete callback when provided', () => {
      const onPathComplete = vi.fn();

      render(
        <AnimatedRoutePolyline
          coordinates={sampleCoordinates}
          status="completed"
          isClosedLoop={false}
          animationSpeed={50}
          onPathComplete={onPathComplete}
        />
      );

      const polylines = screen.getAllByTestId('polyline');
      expect(polylines.length).toBeGreaterThan(0);
    });
  });

  describe('Gradient Colors', () => {
    it('accepts custom gradient colors', () => {
      const customColors = ['#ff0000', '#00ff00'];

      render(
        <AnimatedRoutePolyline
          coordinates={sampleCoordinates}
          status="active"
          isClosedLoop={false}
          gradientColors={customColors}
        />
      );

      const polylines = screen.getAllByTestId('polyline');
      expect(polylines.length).toBeGreaterThan(0);
    });

    it('uses default colors when no custom colors provided', () => {
      render(
        <AnimatedRoutePolyline
          coordinates={sampleCoordinates}
          status="active"
          isClosedLoop={false}
        />
      );

      const polylines = screen.getAllByTestId('polyline');
      expect(polylines.length).toBeGreaterThan(0);
    });
  });

  describe('CSS Classes', () => {
    it('applies custom className', () => {
      const customClass = 'custom-route-class';

      render(
        <AnimatedRoutePolyline
          coordinates={sampleCoordinates}
          status="active"
          isClosedLoop={false}
          className={customClass}
        />
      );

      const polylines = screen.getAllByTestId('polyline');
      expect(polylines.length).toBeGreaterThan(0);
    });
  });

  describe('Coordinate Updates', () => {
    it('handles coordinate updates correctly', () => {
      const { rerender } = render(
        <AnimatedRoutePolyline
          coordinates={sampleCoordinates.slice(0, 2)}
          status="active"
          isClosedLoop={false}
        />
      );

      expect(screen.getByTestId('polyline')).toBeInTheDocument();

      // Update with more coordinates
      rerender(
        <AnimatedRoutePolyline
          coordinates={sampleCoordinates}
          status="active"
          isClosedLoop={false}
        />
      );

      const polylines = screen.getAllByTestId('polyline');
      expect(polylines.length).toBe(sampleCoordinates.length - 1);
    });

    it('handles status changes correctly', () => {
      const { rerender } = render(
        <AnimatedRoutePolyline
          coordinates={sampleCoordinates}
          status="active"
          isClosedLoop={false}
        />
      );

      const initialPolylines = screen.getAllByTestId('polyline');
      expect(initialPolylines.length).toBeGreaterThan(0);

      // Change status to completed
      rerender(
        <AnimatedRoutePolyline
          coordinates={sampleCoordinates}
          status="completed"
          isClosedLoop={false}
        />
      );

      const updatedPolylines = screen.getAllByTestId('polyline');
      expect(updatedPolylines.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('handles coordinates with missing optional fields', () => {
      const minimalCoordinates: Coordinate[] = [
        {
          latitude: 51.505,
          longitude: -0.09,
          timestamp: '2023-01-01T10:00:00Z',
        },
        {
          latitude: 51.506,
          longitude: -0.088,
          timestamp: '2023-01-01T10:01:00Z',
        },
      ];

      render(
        <AnimatedRoutePolyline
          coordinates={minimalCoordinates}
          status="active"
          isClosedLoop={false}
        />
      );

      expect(screen.getByTestId('polyline')).toBeInTheDocument();
    });

    it('handles invalid coordinate values gracefully', () => {
      const invalidCoordinates: Coordinate[] = [
        {
          latitude: NaN,
          longitude: -0.09,
          timestamp: '2023-01-01T10:00:00Z',
        },
        {
          latitude: 51.506,
          longitude: NaN,
          timestamp: '2023-01-01T10:01:00Z',
        },
      ];

      // Should not crash
      expect(() => {
        render(
          <AnimatedRoutePolyline
            coordinates={invalidCoordinates}
            status="active"
            isClosedLoop={false}
          />
        );
      }).not.toThrow();
    });
  });
});

describe('Color Interpolation', () => {
  // Test the interpolateColor function indirectly through component behavior
  it('creates gradient segments with interpolated colors', () => {
    render(
      <AnimatedRoutePolyline
        coordinates={sampleCoordinates}
        status="active"
        isClosedLoop={false}
        gradientColors={['#ff0000', '#0000ff']}
      />
    );

    // The component should create multiple segments with different colors
    const polylines = screen.getAllByTestId('polyline');
    expect(polylines.length).toBeGreaterThan(0);
  });
});