/**
 * API Connection Test component for real-time service health monitoring
 * Provides detailed testing and debugging capabilities for API endpoints
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Clock
} from 'lucide-react';

export interface ApiTestResult {
  id: string;
  timestamp: Date;
  method: string;
  url: string;
  status?: number;
  statusText?: string;
  responseTime: number;
  success: boolean;
  error?: string;
  responseBody?: string;
}

export function ApiConnectionTest() {
  const [testUrl, setTestUrl] = useState('/api/v1/health');
  const [testMethod, setTestMethod] = useState('GET');
  const [testBody, setTestBody] = useState('');
  const [testResults, setTestResults] = useState<ApiTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTest = async () => {
    setIsRunning(true);
    const startTime = Date.now();
    
    try {
      const response = await fetch(testUrl, {
        method: testMethod,
        headers: {
          'Content-Type': 'application/json',
        },
        body: testMethod !== 'GET' ? testBody : undefined,
      });
      
      const responseTime = Date.now() - startTime;
      const responseBody = await response.text();
      
      const result: ApiTestResult = {
        id: Date.now().toString(),
        timestamp: new Date(),
        method: testMethod,
        url: testUrl,
        status: response.status,
        statusText: response.statusText,
        responseTime,
        success: response.ok,
        responseBody,
      };
      
      setTestResults(prev => [result, ...prev.slice(0, 9)]);
    } catch (error) {
      const result: ApiTestResult = {
        id: Date.now().toString(),
        timestamp: new Date(),
        method: testMethod,
        url: testUrl,
        responseTime: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      
      setTestResults(prev => [result, ...prev.slice(0, 9)]);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API Connection Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Method</label>
              <select 
                value={testMethod} 
                onChange={(e) => setTestMethod(e.target.value)}
                className="w-full mt-1 p-2 border rounded"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">URL</label>
              <Input
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                placeholder="/api/v1/endpoint"
              />
            </div>
          </div>
          
          {testMethod !== 'GET' && (
            <div>
              <label className="text-sm font-medium">Request Body (JSON)</label>
              <Textarea
                value={testBody}
                onChange={(e) => setTestBody(e.target.value)}
                placeholder='{"key": "value"}'
                rows={3}
              />
            </div>
          )}
          
          <Button onClick={runTest} disabled={isRunning} className="w-full">
            <Play className="h-4 w-4 mr-2" />
            {isRunning ? 'Running Test...' : 'Run Test'}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Test Results</h3>
        {testResults.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No test results yet. Run a test to see results here.
            </CardContent>
          </Card>
        ) : (
          testResults.map((result) => (
            <Card key={result.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="font-medium">{result.method} {result.url}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={result.success ? 'default' : 'destructive'}>
                      {result.status || 'Error'}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {result.responseTime}ms
                    </div>
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground mb-2">
                  {result.timestamp.toLocaleString()}
                </div>
                
                {result.error && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    {result.error}
                  </div>
                )}
                
                {result.responseBody && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium">
                      Response Body
                    </summary>
                    <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                      {result.responseBody}
                    </pre>
                  </details>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default ApiConnectionTest;