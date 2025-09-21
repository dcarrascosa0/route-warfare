/**
 * Health check dashboard showing service connectivity and status
 * Provides real-time monitoring of backend services and API health
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded' | 'unknown';
  responseTime?: number;
  lastCheck: Date;
  error?: string;
  details?: Record<string, any>;
}

export interface SystemHealth {
  overall: 'healthy' | 'unhealthy' | 'degraded';
  services: ServiceHealth[];
  lastUpdated: Date;
}

const SERVICES = [
  { name: 'API Gateway', endpoint: '/health' },
  { name: 'Auth Service', endpoint: '/api/v1/auth/health' },
  { name: 'User Service', endpoint: '/api/v1/users/health' },
  { name: 'Route Service', endpoint: '/api/v1/routes/health' },
  { name: 'Territory Service', endpoint: '/api/v1/territories/health' },
  { name: 'Leaderboard Service', endpoint: '/api/v1/leaderboard/health' },
  { name: 'Notification Service', endpoint: '/api/v1/notifications/health' },
];

export function HealthCheckDashboard() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    overall: 'healthy' as const,
    services: [],
    lastUpdated: new Date(),
  });
  const [isChecking, setIsChecking] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const checkServiceHealth = async (service: { name: string; endpoint: string }): Promise<ServiceHealth> => {
    const startTime = Date.now();
    
    try {
      const response = await fetch(service.endpoint, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const responseTime = Date.now() - startTime;
      const data = await response.json();
      
      return {
        name: service.name,
        status: response.ok ? 'healthy' : 'unhealthy',
        responseTime,
        lastCheck: new Date(),
        details: data,
      };
    } catch (error) {
      return {
        name: service.name,
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  const checkAllServices = async () => {
    setIsChecking(true);
    
    try {
      const healthChecks = await Promise.all(
        SERVICES.map(service => checkServiceHealth(service))
      );
      
      const healthyCount = healthChecks.filter(h => h.status === 'healthy').length;
      const unhealthyCount = healthChecks.filter(h => h.status === 'unhealthy').length;
      
      let overall: SystemHealth['overall'] = 'healthy';
      if (unhealthyCount > 0) {
        overall = unhealthyCount === healthChecks.length ? 'unhealthy' : 'degraded';
      }
      
      setSystemHealth({
        overall,
        services: healthChecks,
        lastUpdated: new Date(),
      });
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkAllServices();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(checkAllServices, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getStatusIcon = (status: ServiceHealth['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'unhealthy':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'degraded':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: ServiceHealth['status']) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-500">Healthy</Badge>;
      case 'unhealthy':
        return <Badge variant="destructive">Unhealthy</Badge>;
      case 'degraded':
        return <Badge variant="secondary">Degraded</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(systemHealth.overall)}
              System Health
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                Auto Refresh: {autoRefresh ? 'On' : 'Off'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={checkAllServices}
                disabled={isChecking}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            {getStatusBadge(systemHealth.overall)}
            <div className="text-sm text-muted-foreground">
              Last updated: {systemHealth.lastUpdated.toLocaleTimeString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {systemHealth.services.map((service) => (
          <Card key={service.name}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(service.status)}
                  <span className="font-medium">{service.name}</span>
                </div>
                {getStatusBadge(service.status)}
              </div>
              
              <div className="space-y-1 text-sm text-muted-foreground">
                {service.responseTime && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {service.responseTime}ms
                  </div>
                )}
                <div>
                  Last check: {service.lastCheck.toLocaleTimeString()}
                </div>
                {service.error && (
                  <div className="text-red-600 text-xs bg-red-50 p-2 rounded">
                    {service.error}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default HealthCheckDashboard;