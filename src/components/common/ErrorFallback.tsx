import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => {
  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleReload = () => {
    window.location.reload();
  };

  const getErrorMessage = (error: Error): string => {
    // Provide user-friendly error messages based on error type
    if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
      return 'The application has been updated. Please refresh the page to get the latest version.';
    }
    
    if (error.message.includes('Network Error') || error.message.includes('fetch')) {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }
    
    if (error.message.includes('Permission denied') || error.message.includes('Unauthorized')) {
      return 'You don\'t have permission to access this resource. Please log in and try again.';
    }
    
    return 'An unexpected error occurred. Our team has been notified and is working to fix this issue.';
  };

  const getRecoveryActions = (error: Error) => {
    if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
      return (
        <div className="flex gap-2">
          <Button onClick={handleReload} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh Page
          </Button>
        </div>
      );
    }
    
    return (
      <div className="flex gap-2">
        <Button onClick={resetError} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
        <Button onClick={handleGoHome} className="flex items-center gap-2">
          <Home className="h-4 w-4" />
          Go Home
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Something went wrong
          </CardTitle>
          <CardDescription className="text-gray-600">
            {getErrorMessage(error)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {getRecoveryActions(error)}
          
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                Technical Details
              </summary>
              <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-700 overflow-auto max-h-32">
                <div className="font-semibold">Error: {error.name}</div>
                <div className="mt-1">{error.message}</div>
                {error.stack && (
                  <div className="mt-2 text-xs">
                    <div className="font-semibold">Stack trace:</div>
                    <pre className="whitespace-pre-wrap">{error.stack}</pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorFallback;