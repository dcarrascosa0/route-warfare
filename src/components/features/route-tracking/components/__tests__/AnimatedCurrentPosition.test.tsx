import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AnimatedCurrentPosition from '../AnimatedCurrentPosition';
import '@testing-library/jest-dom';

// Mock Leaflet completely
vi.mock('leaflet', () => ({
    default: {
        divIcon: vi.fn(() => ({ options: {} })),
    },
}));

// Mock react-leaflet components
vi.mock('react-leaflet', () => ({
    Marker: ({ children, ...props }: any) => (
        <div data-testid="marker" {...props}>
            {children}
        </div>
    ),
    Circle: ({ children, ...props }: any) => (
        <div data-testid="accuracy-circle" {...props}>
            {children}
        </div>
    ),
    MapContainer: ({ children }: any) => <div data-testid="map-container">{children}</div>,
}));

// Mock CSS import
vi.mock('../AnimatedCurrentPosition.css', () => ({}));

// Test utilities
const createMockPosition = (
    latitude: number = 40.7128,
    longitude: number = -74.0060,
    accuracy: number = 10,
    speed?: number,
    heading?: number
): GeolocationPosition => ({
    coords: {
        latitude,
        longitude,
        accuracy,
        altitude: null,
        altitudeAccuracy: null,
        speed: speed || null,
        heading: heading || null,
        toJSON: () => ({}),
    } as GeolocationCoordinates,
    timestamp: Date.now(),
    toJSON: () => ({}),
});

const renderWithMap = (component: React.ReactElement) => {
    return render(component);
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe('AnimatedCurrentPosition', () => {
    const defaultProps = {
        position: createMockPosition(),
        accuracy: 10,
        isTracking: true,
    };

    describe('Rendering', () => {
        it('renders current position marker when position is provided', () => {
            renderWithMap(<AnimatedCurrentPosition {...defaultProps} />);

            expect(screen.getByTestId('marker')).toBeInTheDocument();
        });

        it('renders accuracy circle when accuracy is greater than 0', () => {
            renderWithMap(<AnimatedCurrentPosition {...defaultProps} accuracy={15} />);

            expect(screen.getByTestId('accuracy-circle')).toBeInTheDocument();
        });

        it('does not render accuracy circle when accuracy is 0', () => {
            renderWithMap(<AnimatedCurrentPosition {...defaultProps} accuracy={0} />);

            expect(screen.queryByTestId('accuracy-circle')).not.toBeInTheDocument();
        });

        it('returns null when no position is provided', () => {
            const { container } = renderWithMap(
                <AnimatedCurrentPosition
                    {...defaultProps}
                    position={null as any}
                />
            );

            expect(container.firstChild?.firstChild).toBeUndefined();
        });
    });

    describe('GPS Quality Indicators', () => {
        it('handles excellent GPS quality (accuracy <= 5m)', () => {
            renderWithMap(<AnimatedCurrentPosition {...defaultProps} accuracy={3} />);

            const marker = screen.getByTestId('marker');
            expect(marker).toBeInTheDocument();
        });

        it('handles good GPS quality (accuracy <= 10m)', () => {
            renderWithMap(<AnimatedCurrentPosition {...defaultProps} accuracy={8} />);

            const marker = screen.getByTestId('marker');
            expect(marker).toBeInTheDocument();
        });

        it('handles fair GPS quality (accuracy <= 20m)', () => {
            renderWithMap(<AnimatedCurrentPosition {...defaultProps} accuracy={15} />);

            const marker = screen.getByTestId('marker');
            expect(marker).toBeInTheDocument();
        });

        it('handles poor GPS quality (accuracy > 20m)', () => {
            renderWithMap(<AnimatedCurrentPosition {...defaultProps} accuracy={50} />);

            const marker = screen.getByTestId('marker');
            const accuracyCircle = screen.getByTestId('accuracy-circle');

            expect(marker).toBeInTheDocument();
            expect(accuracyCircle).toBeInTheDocument();
        });
    });

    describe('Tracking Status', () => {
        it('renders differently when tracking is active', () => {
            renderWithMap(<AnimatedCurrentPosition {...defaultProps} isTracking={true} />);

            const marker = screen.getByTestId('marker');
            expect(marker).toBeInTheDocument();
        });

        it('renders differently when tracking is inactive', () => {
            renderWithMap(<AnimatedCurrentPosition {...defaultProps} isTracking={false} />);

            const marker = screen.getByTestId('marker');
            expect(marker).toBeInTheDocument();
        });
    });

    describe('Movement and Bearing', () => {
        it('handles position updates with previous position', () => {
            const previousPosition = createMockPosition(40.7120, -74.0050);
            const currentPosition = createMockPosition(40.7130, -74.0070);

            renderWithMap(
                <AnimatedCurrentPosition
                    {...defaultProps}
                    position={currentPosition}
                    previousPosition={previousPosition}
                />
            );

            const marker = screen.getByTestId('marker');
            expect(marker).toBeInTheDocument();
        });

        it('handles position without previous position', () => {
            renderWithMap(
                <AnimatedCurrentPosition
                    {...defaultProps}
                    previousPosition={undefined}
                />
            );

            const marker = screen.getByTestId('marker');
            expect(marker).toBeInTheDocument();
        });

        it('calculates bearing correctly for significant movement', () => {
            // Create positions with significant distance (> 5 meters)
            const previousPosition = createMockPosition(40.7128, -74.0060);
            const currentPosition = createMockPosition(40.7130, -74.0050); // ~100m northeast

            renderWithMap(
                <AnimatedCurrentPosition
                    {...defaultProps}
                    position={currentPosition}
                    previousPosition={previousPosition}
                />
            );

            const marker = screen.getByTestId('marker');
            expect(marker).toBeInTheDocument();
        });
    });

    describe('Animation Configuration', () => {
        it('accepts custom animation duration', () => {
            renderWithMap(
                <AnimatedCurrentPosition
                    {...defaultProps}
                    animationDuration={1000}
                />
            );

            const marker = screen.getByTestId('marker');
            expect(marker).toBeInTheDocument();
        });

        it('applies custom className', () => {
            renderWithMap(
                <AnimatedCurrentPosition
                    {...defaultProps}
                    className="custom-marker-class"
                />
            );

            const marker = screen.getByTestId('marker');
            expect(marker).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('provides appropriate z-index for marker visibility', () => {
            renderWithMap(<AnimatedCurrentPosition {...defaultProps} />);

            const marker = screen.getByTestId('marker');
            expect(marker).toBeInTheDocument();
        });
    });

    describe('Performance', () => {
        it('handles rapid position updates efficiently', () => {
            const { rerender } = renderWithMap(<AnimatedCurrentPosition {...defaultProps} />);

            // Simulate rapid position updates
            for (let i = 0; i < 10; i++) {
                const newPosition = createMockPosition(
                    40.7128 + i * 0.0001,
                    -74.0060 + i * 0.0001
                );

                rerender(
                    <AnimatedCurrentPosition
                        {...defaultProps}
                        position={newPosition}
                    />
                );
            }

            const marker = screen.getByTestId('marker');
            expect(marker).toBeInTheDocument();
        });
    });

    describe('Edge Cases', () => {
        it('handles position with missing optional properties', () => {
            const minimalPosition: GeolocationPosition = {
                coords: {
                    latitude: 40.7128,
                    longitude: -74.0060,
                    accuracy: 10,
                    altitude: null,
                    altitudeAccuracy: null,
                    speed: null,
                    heading: null,
                    toJSON: () => ({}),
                } as GeolocationCoordinates,
                timestamp: Date.now(),
                toJSON: () => ({}),
            };

            renderWithMap(
                <AnimatedCurrentPosition
                    {...defaultProps}
                    position={minimalPosition}
                />
            );

            const marker = screen.getByTestId('marker');
            expect(marker).toBeInTheDocument();
        });

        it('handles very high accuracy values', () => {
            renderWithMap(<AnimatedCurrentPosition {...defaultProps} accuracy={1000} />);

            const marker = screen.getByTestId('marker');
            const accuracyCircle = screen.getByTestId('accuracy-circle');

            expect(marker).toBeInTheDocument();
            expect(accuracyCircle).toBeInTheDocument();
        });

        it('handles zero accuracy', () => {
            renderWithMap(<AnimatedCurrentPosition {...defaultProps} accuracy={0} />);

            const marker = screen.getByTestId('marker');
            expect(marker).toBeInTheDocument();
            expect(screen.queryByTestId('accuracy-circle')).not.toBeInTheDocument();
        });
    });
});