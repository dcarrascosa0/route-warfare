/**
 * Connection testing utilities for troubleshooting integration issues
 * Provides comprehensive connectivity testing and diagnostics
 */

export interface ServiceEndpoint {
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
  expectedStatus?: number[];
}

export interface ConnectionTestResult {
  service: string;
  endpoint: string;
  success: boolean;
  responseTime: number;
  status?: number;
  error?: string;
  timestamp: Date;
  details?: {
    dns?: number;
    tcp?: number;
    tls?: number;
    request?: number;
    response?: number;
  };
}

export interface ConnectivityReport {
  overall: 'healthy' | 'degraded' | 'failed';
  timestamp: Date;
  results: ConnectionTestResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    averageResponseTime: number;
  };
  recommendations: string[];
}

class ConnectionTester {
  /**
   * Test connection to a single endpoint
   */
  async testEndpoint(endpoint: ServiceEndpoint): Promise<ConnectionTestResult> {
    const startTime = performance.now();
    const timestamp = new Date();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), endpoint.timeout || 10000);
      
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          ...endpoint.headers,
        },
        body: endpoint.body,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const responseTime = performance.now() - startTime;
      
      const expectedStatuses = endpoint.expectedStatus || [200, 201, 204];
      const success = expectedStatuses.includes(response.status);
      
      return {
        service: endpoint.name,
        endpoint: endpoint.url,
        success,
        responseTime,
        status: response.status,
        timestamp,
      };
    } catch (error: any) {
      const responseTime = performance.now() - startTime;
      
      return {
        service: endpoint.name,
        endpoint: endpoint.url,
        success: false,
        responseTime,
        error: error.message || 'Unknown error',
        timestamp,
      };
    }
  }

  /**
   * Test connection with retry logic
   */
  async testEndpointWithRetry(endpoint: ServiceEndpoint): Promise<ConnectionTestResult> {
    const maxRetries = 3;
    let lastResult: ConnectionTestResult;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      lastResult = await this.testEndpoint(endpoint);
      
      if (lastResult.success) {
        return lastResult;
      }
      
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    
    return lastResult!;
  }

  /**
   * Test multiple endpoints
   */
  async testMultipleEndpoints(endpoints: ServiceEndpoint[]): Promise<ConnectionTestResult[]> {
    const results = await Promise.allSettled(
      endpoints.map(endpoint => this.testEndpointWithRetry(endpoint))
    );
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          service: endpoints[index].name,
          endpoint: endpoints[index].url,
          success: false,
          responseTime: 0,
          error: result.reason?.message || 'Test failed',
          timestamp: new Date(),
        };
      }
    });
  }

  /**
   * Ping test (using image loading as a proxy)
   */
  async pingTest(host: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const startTime = performance.now();
      const img = new Image();
      
      img.onload = () => {
        const responseTime = performance.now() - startTime;
        resolve(responseTime);
      };
      
      img.onerror = () => {
        reject(new Error('Ping failed'));
      };
      
      // Use a small image or favicon
      img.src = `${host}/favicon.ico?t=${Date.now()}`;
      
      // Timeout after 5 seconds
      setTimeout(() => {
        reject(new Error('Ping timeout'));
      }, 5000);
    });
  }

  /**
   * Test WebSocket connection
   */
  async testWebSocketConnection(url: string, timeout: number = 5000): Promise<ConnectionTestResult> {
    const startTime = performance.now();
    const timestamp = new Date();
    
    return new Promise((resolve) => {
      const ws = new WebSocket(url);
      let resolved = false;
      
      const cleanup = () => {
        if (!resolved) {
          resolved = true;
          ws.close();
        }
      };
      
      const timeoutId = setTimeout(() => {
        cleanup();
        resolve({
          service: 'WebSocket',
          endpoint: url,
          success: false,
          responseTime: performance.now() - startTime,
          error: 'Connection timeout',
          timestamp,
        });
      }, timeout);
      
      ws.onopen = () => {
        clearTimeout(timeoutId);
        cleanup();
        resolve({
          service: 'WebSocket',
          endpoint: url,
          success: true,
          responseTime: performance.now() - startTime,
          timestamp,
        });
      };
      
      ws.onerror = (error) => {
        clearTimeout(timeoutId);
        cleanup();
        resolve({
          service: 'WebSocket',
          endpoint: url,
          success: false,
          responseTime: performance.now() - startTime,
          error: 'WebSocket connection failed',
          timestamp,
        });
      };
    });
  }

  /**
   * Generate connectivity report
   */
  async generateConnectivityReport(endpoints: ServiceEndpoint[]): Promise<ConnectivityReport> {
    const results = await this.testMultipleEndpoints(endpoints);
    
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;
    const averageResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
    
    let overall: 'healthy' | 'degraded' | 'failed';
    if (failed === 0) {
      overall = 'healthy';
    } else if (successful > failed) {
      overall = 'degraded';
    } else {
      overall = 'failed';
    }
    
    const recommendations = this.generateRecommendations(results);
    
    return {
      overall,
      timestamp: new Date(),
      results,
      summary: {
        total: results.length,
        successful,
        failed,
        averageResponseTime,
      },
      recommendations,
    };
  }

  /**
   * Generate troubleshooting recommendations
   */
  private generateRecommendations(results: ConnectionTestResult[]): string[] {
    const recommendations: string[] = [];
    const failedResults = results.filter(r => !r.success);
    
    if (failedResults.length === 0) {
      recommendations.push('All connections are healthy');
      return recommendations;
    }
    
    // Check for common patterns
    const timeoutErrors = failedResults.filter(r => r.error?.includes('timeout'));
    const networkErrors = failedResults.filter(r => r.error?.includes('network') || r.error?.includes('fetch'));
    const corsErrors = failedResults.filter(r => r.error?.includes('CORS'));
    const authErrors = failedResults.filter(r => r.status === 401 || r.status === 403);
    
    if (timeoutErrors.length > 0) {
      recommendations.push('Multiple timeout errors detected. Check network connectivity and server response times.');
    }
    
    if (networkErrors.length > 0) {
      recommendations.push('Network errors detected. Verify internet connection and DNS resolution.');
    }
    
    if (corsErrors.length > 0) {
      recommendations.push('CORS errors detected. Check server CORS configuration.');
    }
    
    if (authErrors.length > 0) {
      recommendations.push('Authentication errors detected. Verify API keys and authentication tokens.');
    }
    
    // Check response times
    const slowResponses = results.filter(r => r.success && r.responseTime > 2000);
    if (slowResponses.length > 0) {
      recommendations.push('Slow response times detected. Consider optimizing server performance or using a CDN.');
    }
    
    // Service-specific recommendations
    const failedServices = new Set(failedResults.map(r => r.service));
    failedServices.forEach(service => {
      recommendations.push(`${service} service is experiencing issues. Check service status and logs.`);
    });
    
    return recommendations;
  }
}

// Default endpoints for Route Wars services
export const DEFAULT_ENDPOINTS: ServiceEndpoint[] = [
  {
    name: 'API Gateway',
    url: '/api/v1/health',
    method: 'GET',
    expectedStatus: [200],
  },
  {
    name: 'Auth Service',
    url: '/api/v1/auth/health',
    method: 'GET',
    expectedStatus: [200],
  },
  {
    name: 'User Service',
    url: '/api/v1/users/health',
    method: 'GET',
    expectedStatus: [200],
  },
  {
    name: 'Route Service',
    url: '/api/v1/routes/health',
    method: 'GET',
    expectedStatus: [200],
  },
  {
    name: 'Territory Service',
    url: '/api/v1/territories/health',
    method: 'GET',
    expectedStatus: [200],
  },
  {
    name: 'Leaderboard Service',
    url: '/api/v1/leaderboard/health',
    method: 'GET',
    expectedStatus: [200],
  },
  {
    name: 'Notification Service',
    url: '/api/v1/notifications/health',
    method: 'GET',
    expectedStatus: [200],
  },
];

// Global instance
export const connectionTester = new ConnectionTester();

// Convenience functions
export const testAllServices = () => connectionTester.generateConnectivityReport(DEFAULT_ENDPOINTS);
export const testService = (endpoint: ServiceEndpoint) => connectionTester.testEndpoint(endpoint);
export const testWebSocket = (url: string) => connectionTester.testWebSocketConnection(url);