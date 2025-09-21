/**
 * Tests for coordinate buffer functionality.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  initializeCoordinateBuffer, 
  getCoordinateBuffer 
} from '../coordinate-buffer';
import { GPSCoordinate } from '../../../types/route';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock API
vi.mock('../../api', () => ({
  GatewayAPI: {
    addCoordinates: vi.fn(),
  },
}));

describe('CoordinateBuffer', () => {
  let buffer: any;
  const mockCoordinates: GPSCoordinate[] = [
    {
      latitude: 40.7128,
      longitude: -74.0060,
      accuracy: 5.0,
      speed: 0.0,
      bearing: 0.0,
      timestamp: new Date('2023-01-01T10:00:00Z'),
    },
    {
      latitude: 40.7129,
      longitude: -74.0061,
      accuracy: 4.0,
      speed: 1.5,
      bearing: 45.0,
      timestamp: new Date('2023-01-01T10:00:05Z'),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    buffer = initializeCoordinateBuffer({
      maxBufferSize: 100,
      maxRetries: 3,
      retryDelayMs: 1000,
      batchSize: 5,
      compressionEnabled: false,
      adaptiveBatching: true,
    });
  });

  afterEach(() => {
    if (buffer) {
      buffer.clearBuffer();
    }
  });

  describe('Coordinate Addition', () => {
    it('should add coordinates to buffer', () => {
      buffer.addCoordinates(
        mockCoordinates,
        'route-123',
        'user-456',
        {
          isOnline: true,
          isSlowConnection: false,
          connectionType: 'wifi',
          effectiveType: '4g',
        },
        'mobile'
      );

      const stats = buffer.getStats();
      expect(stats.totalBuffered).toBe(2);
      expect(stats.pendingSync).toBe(2);
    });

    it('should enforce buffer size limit', () => {
      const smallBuffer = initializeCoordinateBuffer({
        maxBufferSize: 3,
      });

      // Add more coordinates than the limit
      for (let i = 0; i < 5; i++) {
        smallBuffer.addCoordinates(
          [mockCoordinates[0]],
          'route-123',
          'user-456',
          { isOnline: true, isSlowConnection: false, connectionType: 'wifi', effectiveType: '4g' },
          'mobile'
        );
      }

      const stats = smallBuffer.getStats();
      expect(stats.totalBuffered).toBe(3); // Should be limited to maxBufferSize
    });

    it('should save to localStorage', () => {
      buffer.addCoordinates(
        mockCoordinates,
        'route-123',
        'user-456',
        { isOnline: true, isSlowConnection: false, connectionType: 'wifi', effectiveType: '4g' },
        'mobile'
      );

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'gps_coordinate_buffer',
        expect.any(String)
      );
    });
  });

  describe('Coordinate Synchronization', () => {
    beforeEach(() => {
      // Mock successful API response
      const { GatewayAPI } = require('../../api');
      GatewayAPI.addCoordinates.mockResolvedValue({ ok: true, data: {} });
    });

    it('should sync coordinates when online', async () => {
      buffer.addCoordinates(
        mockCoordinates,
        'route-123',
        'user-456',
        { isOnline: true, isSlowConnection: false, connectionType: 'wifi', effectiveType: '4g' },
        'mobile'
      );

      await buffer.syncCoordinates({
        isOnline: true,
        isSlowConnection: false,
        connectionType: 'wifi',
        effectiveType: '4g',
      });

      const { GatewayAPI } = require('../../api');
      expect(GatewayAPI.addCoordinates).toHaveBeenCalledWith(
        'route-123',
        'user-456',
        expect.arrayContaining([
          expect.objectContaining({
            latitude: 40.7128,
            longitude: -74.0060,
          }),
        ])
      );
    });

    it('should not sync when offline', async () => {
      buffer.addCoordinates(
        mockCoordinates,
        'route-123',
        'user-456',
        { isOnline: false, isSlowConnection: false, connectionType: 'none', effectiveType: 'none' },
        'mobile'
      );

      await buffer.syncCoordinates({
        isOnline: false,
        isSlowConnection: false,
        connectionType: 'none',
        effectiveType: 'none',
      });

      const { GatewayAPI } = require('../../api');
      expect(GatewayAPI.addCoordinates).not.toHaveBeenCalled();
    });

    it('should handle sync failures with retry', async () => {
      const { GatewayAPI } = require('../../api');
      GatewayAPI.addCoordinates.mockRejectedValue(new Error('Network error'));

      buffer.addCoordinates(
        mockCoordinates,
        'route-123',
        'user-456',
        { isOnline: true, isSlowConnection: false, connectionType: 'wifi', effectiveType: '4g' },
        'mobile'
      );

      await buffer.syncCoordinates({
        isOnline: true,
        isSlowConnection: false,
        connectionType: 'wifi',
        effectiveType: '4g',
      });

      // Coordinates should still be in buffer after failed sync
      const stats = buffer.getStats();
      expect(stats.pendingSync).toBe(2);
    });

    it('should remove coordinates after max retries', async () => {
      const { GatewayAPI } = require('../../api');
      GatewayAPI.addCoordinates.mockRejectedValue(new Error('Network error'));

      buffer.addCoordinates(
        mockCoordinates,
        'route-123',
        'user-456',
        { isOnline: true, isSlowConnection: false, connectionType: 'wifi', effectiveType: '4g' },
        'mobile'
      );

      // Simulate multiple failed sync attempts
      for (let i = 0; i < 4; i++) {
        await buffer.syncCoordinates({
          isOnline: true,
          isSlowConnection: false,
          connectionType: 'wifi',
          effectiveType: '4g',
        });
      }

      const stats = buffer.getStats();
      expect(stats.failedCoordinates).toBe(2); // Should be marked as failed
    });
  });

  describe('Adaptive Batching', () => {
    it('should use smaller batches for slow connections', async () => {
      const { GatewayAPI } = require('../../api');
      GatewayAPI.addCoordinates.mockResolvedValue({ ok: true, data: {} });

      // Add many coordinates
      const manyCoordinates = Array(20).fill(null).map((_, i) => ({
        ...mockCoordinates[0],
        latitude: mockCoordinates[0].latitude + i * 0.0001,
      }));

      buffer.addCoordinates(
        manyCoordinates,
        'route-123',
        'user-456',
        { isOnline: true, isSlowConnection: true, connectionType: '2g', effectiveType: '2g' },
        'mobile'
      );

      await buffer.syncCoordinates({
        isOnline: true,
        isSlowConnection: true,
        connectionType: '2g',
        effectiveType: '2g',
      });

      // Should make multiple API calls with smaller batches
      expect(GatewayAPI.addCoordinates).toHaveBeenCalledTimes(
        expect.any(Number)
      );
    });

    it('should use larger batches for fast connections', async () => {
      const { GatewayAPI } = require('../../api');
      GatewayAPI.addCoordinates.mockResolvedValue({ ok: true, data: {} });

      const manyCoordinates = Array(10).fill(null).map((_, i) => ({
        ...mockCoordinates[0],
        latitude: mockCoordinates[0].latitude + i * 0.0001,
      }));

      buffer.addCoordinates(
        manyCoordinates,
        'route-123',
        'user-456',
        { isOnline: true, isSlowConnection: false, connectionType: 'wifi', effectiveType: '4g' },
        'mobile'
      );

      await buffer.syncCoordinates({
        isOnline: true,
        isSlowConnection: false,
        connectionType: 'wifi',
        effectiveType: '4g',
      });

      // Should make fewer API calls with larger batches
      expect(GatewayAPI.addCoordinates).toHaveBeenCalled();
    });
  });

  describe('Storage Management', () => {
    it('should load coordinates from localStorage on initialization', () => {
      const storedData = {
        coordinates: [
          {
            ...mockCoordinates[0],
            id: 'coord-1',
            routeId: 'route-123',
            userId: 'user-456',
            bufferedAt: Date.now(),
            retryCount: 0,
            networkCondition: 'online',
            deviceType: 'mobile',
          },
        ],
        lastUpdated: Date.now(),
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedData));

      const newBuffer = initializeCoordinateBuffer();
      const stats = newBuffer.getStats();

      expect(stats.totalBuffered).toBe(1);
    });

    it('should clean up old coordinates on load', () => {
      const oldTimestamp = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago
      const storedData = {
        coordinates: [
          {
            ...mockCoordinates[0],
            id: 'coord-1',
            routeId: 'route-123',
            userId: 'user-456',
            bufferedAt: oldTimestamp,
            retryCount: 0,
            networkCondition: 'online',
            deviceType: 'mobile',
          },
        ],
        lastUpdated: oldTimestamp,
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedData));

      const newBuffer = initializeCoordinateBuffer();
      const stats = newBuffer.getStats();

      expect(stats.totalBuffered).toBe(0); // Old coordinates should be cleaned up
    });

    it('should handle localStorage quota exceeded error', () => {
      localStorageMock.setItem.mockImplementation(() => {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });

      // Should not throw error
      expect(() => {
        buffer.addCoordinates(
          mockCoordinates,
          'route-123',
          'user-456',
          { isOnline: true, isSlowConnection: false, connectionType: 'wifi', effectiveType: '4g' },
          'mobile'
        );
      }).not.toThrow();
    });
  });

  describe('Statistics and Monitoring', () => {
    it('should provide accurate buffer statistics', () => {
      buffer.addCoordinates(
        mockCoordinates,
        'route-123',
        'user-456',
        { isOnline: true, isSlowConnection: false, connectionType: 'wifi', effectiveType: '4g' },
        'mobile'
      );

      const stats = buffer.getStats();

      expect(stats).toMatchObject({
        totalBuffered: 2,
        pendingSync: 2,
        failedCoordinates: 0,
        lastSyncTime: null,
        bufferSizeBytes: expect.any(Number),
        compressionRatio: 1.0,
      });
    });

    it('should notify subscribers of stats changes', () => {
      const listener = vi.fn();
      const unsubscribe = buffer.subscribe(listener);

      // Should be called immediately with current stats
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          totalBuffered: 0,
          pendingSync: 0,
        })
      );

      // Add coordinates and check if listener is called
      buffer.addCoordinates(
        mockCoordinates,
        'route-123',
        'user-456',
        { isOnline: true, isSlowConnection: false, connectionType: 'wifi', effectiveType: '4g' },
        'mobile'
      );

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          totalBuffered: 2,
          pendingSync: 2,
        })
      );

      unsubscribe();
    });
  });

  describe('Route-specific Operations', () => {
    it('should get pending coordinates for specific route', () => {
      buffer.addCoordinates(
        [mockCoordinates[0]],
        'route-123',
        'user-456',
        { isOnline: true, isSlowConnection: false, connectionType: 'wifi', effectiveType: '4g' },
        'mobile'
      );

      buffer.addCoordinates(
        [mockCoordinates[1]],
        'route-456',
        'user-456',
        { isOnline: true, isSlowConnection: false, connectionType: 'wifi', effectiveType: '4g' },
        'mobile'
      );

      const route123Coords = buffer.getPendingCoordinates('route-123', 'user-456');
      const route456Coords = buffer.getPendingCoordinates('route-456', 'user-456');

      expect(route123Coords).toHaveLength(1);
      expect(route456Coords).toHaveLength(1);
      expect(route123Coords[0].latitude).toBe(40.7128);
      expect(route456Coords[0].latitude).toBe(40.7129);
    });

    it('should force sync all coordinates', async () => {
      const { GatewayAPI } = require('../../api');
      GatewayAPI.addCoordinates.mockResolvedValue({ ok: true, data: {} });

      buffer.addCoordinates(
        mockCoordinates,
        'route-123',
        'user-456',
        { isOnline: true, isSlowConnection: false, connectionType: 'wifi', effectiveType: '4g' },
        'mobile'
      );

      await buffer.forceSyncAll({
        isOnline: true,
        isSlowConnection: false,
        connectionType: 'wifi',
        effectiveType: '4g',
      });

      expect(GatewayAPI.addCoordinates).toHaveBeenCalled();
    });
  });

  describe('Configuration Management', () => {
    it('should return current configuration', () => {
      const config = buffer.getConfig();

      expect(config).toMatchObject({
        maxBufferSize: 100,
        maxRetries: 3,
        retryDelayMs: 1000,
        batchSize: 5,
        compressionEnabled: false,
        adaptiveBatching: true,
      });
    });

    it('should update configuration', () => {
      buffer.updateConfig({
        maxBufferSize: 200,
        batchSize: 10,
      });

      const config = buffer.getConfig();

      expect(config.maxBufferSize).toBe(200);
      expect(config.batchSize).toBe(10);
      expect(config.maxRetries).toBe(3); // Should keep existing values
    });
  });

  describe('Buffer Cleanup', () => {
    it('should clear all buffered coordinates', () => {
      buffer.addCoordinates(
        mockCoordinates,
        'route-123',
        'user-456',
        { isOnline: true, isSlowConnection: false, connectionType: 'wifi', effectiveType: '4g' },
        'mobile'
      );

      expect(buffer.getStats().totalBuffered).toBe(2);

      buffer.clearBuffer();

      expect(buffer.getStats().totalBuffered).toBe(0);
    });
  });
});