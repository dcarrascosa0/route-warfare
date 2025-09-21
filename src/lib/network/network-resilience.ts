/**
 * Network resilience manager for handling poor network conditions and failures.
 */

// NetworkStatus interface for network monitoring
export interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string;
  effectiveType: string;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitterEnabled: boolean;
}

export interface NetworkAdaptiveConfig {
  slowConnectionThreshold: number; // Mbps
  timeoutMultiplier: {
    fast: number;
    normal: number;
    slow: number;
    offline: number;
  };
  batchSizeMultiplier: {
    fast: number;
    normal: number;
    slow: number;
  };
  retryDelayMultiplier: {
    fast: number;
    normal: number;
    slow: number;
  };
}

export interface RequestOptions {
  timeout?: number;
  retries?: number;
  priority?: 'high' | 'normal' | 'low';
  adaptToNetwork?: boolean;
}

export interface QueuedRequest {
  id: string;
  request: () => Promise<any>;
  options: RequestOptions;
  timestamp: number;
  retryCount: number;
  lastError?: Error;
}

export type NetworkConditionType = 'fast' | 'normal' | 'slow' | 'offline';

class NetworkResilienceManager {
  private retryConfig: RetryConfig;
  private adaptiveConfig: NetworkAdaptiveConfig;
  private requestQueue: QueuedRequest[] = [];
  private isProcessingQueue = false;
  private networkStatus: NetworkStatus | null = null;
  private listeners: ((status: NetworkStatus) => void)[] = [];

  constructor(
    retryConfig: Partial<RetryConfig> = {},
    adaptiveConfig: Partial<NetworkAdaptiveConfig> = {}
  ) {
    this.retryConfig = {
      maxRetries: 5,
      baseDelayMs: 1000,
      maxDelayMs: 30000,
      backoffMultiplier: 2,
      jitterEnabled: true,
      ...retryConfig
    };

    this.adaptiveConfig = {
      slowConnectionThreshold: 1.0, // 1 Mbps
      timeoutMultiplier: {
        fast: 1.0,
        normal: 1.5,
        slow: 3.0,
        offline: 0 // No timeout for offline (will queue)
      },
      batchSizeMultiplier: {
        fast: 2.0,
        normal: 1.0,
        slow: 0.5
      },
      retryDelayMultiplier: {
        fast: 0.5,
        normal: 1.0,
        slow: 2.0
      },
      ...adaptiveConfig
    };

    this.setupNetworkMonitoring();
    this.startQueueProcessor();
  }

  /**
   * Setup network monitoring
   */
  private setupNetworkMonitoring(): void {
    // Monitor network status changes
    window.addEventListener('online', this.handleNetworkChange.bind(this));
    window.addEventListener('offline', this.handleNetworkChange.bind(this));

    // Monitor connection changes
    const connection = (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    if (connection) {
      connection.addEventListener('change', this.handleNetworkChange.bind(this));
    }

    // Initial network status
    this.updateNetworkStatus();
  }

  /**
   * Handle network status changes
   */
  private handleNetworkChange(): void {
    this.updateNetworkStatus();

    // Process queue when coming back online
    if (this.networkStatus?.isOnline && this.requestQueue.length > 0) {
      this.processQueue();
    }
  }

  /**
   * Update current network status
   */
  private updateNetworkStatus(): void {
    const connection = (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    const isSlowConnection = connection ?
      (connection.effectiveType === 'slow-2g' ||
        connection.effectiveType === '2g' ||
        connection.downlink < this.adaptiveConfig.slowConnectionThreshold) : false;

    this.networkStatus = {
      isOnline: navigator.onLine,
      isSlowConnection,
      connectionType: connection?.type || 'unknown',
      effectiveType: connection?.effectiveType || 'unknown',
    };

    // Notify listeners
    this.listeners.forEach(listener => listener(this.networkStatus!));
  }

  /**
   * Determine network condition type
   */
  private getNetworkCondition(): NetworkConditionType {
    if (!this.networkStatus?.isOnline) return 'offline';

    const connection = (navigator as any).connection;
    if (!connection) return 'normal';

    if (connection.effectiveType === '4g' || connection.effectiveType === '5g') {
      return 'fast';
    } else if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
      return 'slow';
    }

    return 'normal';
  }

  /**
   * Execute request with network resilience
   */
  async executeWithResilience<T>(
    requestFn: () => Promise<T>,
    options: RequestOptions = {}
  ): Promise<T> {
    const condition = this.getNetworkCondition();

    // If offline, queue the request
    if (condition === 'offline') {
      return this.queueRequest(requestFn, options);
    }

    // Adapt options based on network conditions
    const adaptedOptions = this.adaptOptionsToNetwork(options, condition);

    return this.executeWithRetry(requestFn, adaptedOptions, condition);
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetry<T>(
    requestFn: () => Promise<T>,
    options: RequestOptions,
    condition: NetworkConditionType,
    retryCount = 0
  ): Promise<T> {
    try {
      // Apply timeout if specified
      if (options.timeout) {
        return await Promise.race([
          requestFn(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), options.timeout)
          )
        ]);
      }

      return await requestFn();
    } catch (error) {
      const maxRetries = options.retries ?? this.retryConfig.maxRetries;

      if (retryCount >= maxRetries) {
        throw error;
      }

      // Calculate retry delay with backoff and jitter
      const delay = this.calculateRetryDelay(retryCount, condition);

      console.warn(`Request failed, retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries + 1})`, error);

      await this.sleep(delay);

      // Check if network condition changed
      const newCondition = this.getNetworkCondition();
      if (newCondition === 'offline') {
        // Network went offline, queue the request
        return this.queueRequest(requestFn, options);
      }

      return this.executeWithRetry(requestFn, options, newCondition, retryCount + 1);
    }
  }

  /**
   * Calculate retry delay with exponential backoff and jitter
   */
  private calculateRetryDelay(retryCount: number, condition: NetworkConditionType): number {
    const baseDelay = this.retryConfig.baseDelayMs;
    const multiplier = this.adaptiveConfig.retryDelayMultiplier[condition];

    let delay = baseDelay * Math.pow(this.retryConfig.backoffMultiplier, retryCount) * multiplier;

    // Apply jitter to avoid thundering herd
    if (this.retryConfig.jitterEnabled) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }

    return Math.min(delay, this.retryConfig.maxDelayMs);
  }

  /**
   * Adapt request options based on network conditions
   */
  private adaptOptionsToNetwork(options: RequestOptions, condition: NetworkConditionType): RequestOptions {
    if (!options.adaptToNetwork) {
      return options;
    }

    const adapted = { ...options };

    // Adjust timeout based on network condition
    if (adapted.timeout) {
      const multiplier = this.adaptiveConfig.timeoutMultiplier[condition];
      adapted.timeout = Math.floor(adapted.timeout * multiplier);
    }

    return adapted;
  }

  /**
   * Queue request for later execution
   */
  private async queueRequest<T>(requestFn: () => Promise<T>, options: RequestOptions): Promise<T> {
    return new Promise((resolve, reject) => {
      const queuedRequest: QueuedRequest = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        request: async () => {
          try {
            const result = await requestFn();
            resolve(result);
            return result;
          } catch (error) {
            reject(error);
            throw error;
          }
        },
        options,
        timestamp: Date.now(),
        retryCount: 0
      };

      // Insert based on priority
      const priority = options.priority || 'normal';
      const insertIndex = this.findInsertIndex(priority);
      this.requestQueue.splice(insertIndex, 0, queuedRequest);

      // Start processing if not already running
      if (!this.isProcessingQueue) {
        this.processQueue();
      }
    });
  }

  /**
   * Find insertion index based on priority
   */
  private findInsertIndex(priority: 'high' | 'normal' | 'low'): number {
    const priorityOrder = { high: 3, normal: 2, low: 1 };
    const targetPriority = priorityOrder[priority];

    for (let i = 0; i < this.requestQueue.length; i++) {
      const queuePriority = priorityOrder[this.requestQueue[i].options.priority || 'normal'];
      if (targetPriority > queuePriority) {
        return i;
      }
    }

    return this.requestQueue.length;
  }

  /**
   * Start queue processor
   */
  private startQueueProcessor(): void {
    // Process queue every 5 seconds
    setInterval(() => {
      if (this.networkStatus?.isOnline && this.requestQueue.length > 0) {
        this.processQueue();
      }
    }, 5000);
  }

  /**
   * Process queued requests
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || !this.networkStatus?.isOnline) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      const condition = this.getNetworkCondition();
      const batchSize = this.calculateQueueBatchSize(condition);

      // Process requests in batches
      while (this.requestQueue.length > 0 && this.networkStatus?.isOnline) {
        const batch = this.requestQueue.splice(0, batchSize);

        // Execute batch with some concurrency control
        const promises = batch.map(queuedRequest =>
          this.executeQueuedRequest(queuedRequest, condition)
        );

        await Promise.allSettled(promises);

        // Small delay between batches to avoid overwhelming the network
        if (this.requestQueue.length > 0) {
          await this.sleep(100);
        }
      }
    } catch (error) {
      console.error('Queue processing error:', error);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Execute a queued request
   */
  private async executeQueuedRequest(queuedRequest: QueuedRequest, condition: NetworkConditionType): Promise<void> {
    try {
      await this.executeWithRetry(queuedRequest.request, queuedRequest.options, condition);
    } catch (error) {
      queuedRequest.lastError = error as Error;
      queuedRequest.retryCount++;

      const maxRetries = queuedRequest.options.retries ?? this.retryConfig.maxRetries;

      if (queuedRequest.retryCount < maxRetries) {
        // Re-queue for retry
        this.requestQueue.push(queuedRequest);
      } else {
        console.error('Queued request failed after max retries:', error);
      }
    }
  }

  /**
   * Calculate optimal batch size for queue processing
   */
  private calculateQueueBatchSize(condition: NetworkConditionType): number {
    const baseBatchSize = 5;
    const multiplier = this.adaptiveConfig.batchSizeMultiplier[condition];
    return Math.max(1, Math.floor(baseBatchSize * multiplier));
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current network status
   */
  getNetworkStatus(): NetworkStatus | null {
    return this.networkStatus;
  }

  /**
   * Get queue statistics
   */
  getQueueStats() {
    const now = Date.now();
    const oldRequests = this.requestQueue.filter(req => now - req.timestamp > 300000); // 5 minutes

    return {
      totalQueued: this.requestQueue.length,
      highPriority: this.requestQueue.filter(req => req.options.priority === 'high').length,
      normalPriority: this.requestQueue.filter(req => req.options.priority === 'normal').length,
      lowPriority: this.requestQueue.filter(req => req.options.priority === 'low').length,
      oldRequests: oldRequests.length,
      isProcessing: this.isProcessingQueue
    };
  }

  /**
   * Clear queue
   */
  clearQueue(): void {
    this.requestQueue = [];
  }

  /**
   * Subscribe to network status changes
   */
  subscribe(listener: (status: NetworkStatus) => void): () => void {
    this.listeners.push(listener);

    // Immediately notify with current status
    if (this.networkStatus) {
      listener(this.networkStatus);
    }

    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Update configuration
   */
  updateRetryConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config };
  }

  updateAdaptiveConfig(config: Partial<NetworkAdaptiveConfig>): void {
    this.adaptiveConfig = { ...this.adaptiveConfig, ...config };
  }
}

// Global instance
let networkResilienceManager: NetworkResilienceManager | null = null;

export const initializeNetworkResilience = (
  retryConfig?: Partial<RetryConfig>,
  adaptiveConfig?: Partial<NetworkAdaptiveConfig>
): NetworkResilienceManager => {
  if (!networkResilienceManager) {
    networkResilienceManager = new NetworkResilienceManager(retryConfig, adaptiveConfig);
  }
  return networkResilienceManager;
};

export const getNetworkResilienceManager = (): NetworkResilienceManager | null => {
  return networkResilienceManager;
};

// React hook for using network resilience
export const useNetworkResilience = () => {
  const manager = getNetworkResilienceManager();

  if (!manager) {
    throw new Error('Network resilience manager not initialized. Call initializeNetworkResilience first.');
  }

  return manager;
};

// Utility function to wrap API calls with resilience
export const withNetworkResilience = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options: RequestOptions = {}
) => {
  return async (...args: T): Promise<R> => {
    const manager = getNetworkResilienceManager();
    if (!manager) {
      return fn(...args);
    }

    return manager.executeWithResilience(() => fn(...args), options);
  };
};