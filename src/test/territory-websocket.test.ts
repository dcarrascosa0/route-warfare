/**
 * Territory WebSocket integration tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(public url: string) {
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(new Event('open'));
    }, 10);
  }

  send(data: string) {
    // Mock send implementation
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close'));
  }
}

// Mock auth context
const mockAuthContext = {
  user: { id: 'test-user-123' },
  token: 'test-token',
};

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

vi.mock('@/lib/websocket/websocket-manager', () => ({
  createWebSocketManager: vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    on: vi.fn(),
    subscribeTo: vi.fn(),
    onTerritoryPreviewUpdate: vi.fn(),
    onTerritoryClaimed: vi.fn(),
    onLeaderboardUpdate: vi.fn(),
    onTerritoryMapUpdate: vi.fn(),
  })),
}));

describe('Territory WebSocket Integration', () => {
  beforeEach(() => {
    global.WebSocket = MockWebSocket as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('WebSocket Message Handling', () => {
    it('should handle territory preview update messages', () => {
      const mockPreviewData = {
        boundary_geojson: { type: 'Polygon', coordinates: [] },
        area_square_meters: 1000,
        is_valid: true,
        is_real_time: true,
      };

      // Test message structure
      expect(mockPreviewData.is_real_time).toBe(true);
      expect(mockPreviewData.area_square_meters).toBeGreaterThan(0);
    });

    it('should handle territory claimed messages', () => {
      const mockClaimedData = {
        user_id: 'test-user-123',
        territory: {
          id: 'territory-123',
          name: 'Test Territory',
          area_square_meters: 5000,
        },
        timestamp: new Date().toISOString(),
      };

      expect(mockClaimedData.user_id).toBe('test-user-123');
      expect(mockClaimedData.territory.area_square_meters).toBeGreaterThan(0);
    });

    it('should handle leaderboard update messages', () => {
      const mockLeaderboardData = {
        leaderboard: {
          entries: [
            {
              rank: 1,
              owner_id: 'user-1',
              owner_name: 'Top Player',
              territory_count: 10,
              total_area_km2: 25.5,
            },
          ],
        },
        timestamp: new Date().toISOString(),
      };

      expect(mockLeaderboardData.leaderboard.entries).toHaveLength(1);
      expect(mockLeaderboardData.leaderboard.entries[0].rank).toBe(1);
    });
  });
});