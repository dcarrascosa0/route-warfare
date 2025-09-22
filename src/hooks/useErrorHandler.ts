import { useCallback } from 'react';
import { toast } from 'sonner';

export interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: { [key: string]: string | number | boolean };
}

export const useErrorHandler = () => {
  const handleError = useCallback((error: ApiError | Error, context?: string) => {
    console.error('Error occurred:', error, context ? `Context: ${context}` : '');
    
    const message = getErrorMessage(error as ApiError);
    
    // Show toast notification
    toast.error(message, {
      duration: 5000,
      action: error.message.includes('Network') ? {
        label: 'Retry',
        onClick: () => window.location.reload(),
      } : undefined,
    });
    
    // Log to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error tracking service
      // errorTrackingService.captureException(error, { 
      //   extra: { context },
      //   tags: { component: 'error-handler' }
      // });
    }
  }, []);

  const getErrorMessage = (error: ApiError): string => {
    // Handle specific HTTP status codes
    if (error.status) {
      switch (error.status) {
        case 400:
          return error.message || 'Invalid request. Please check your input and try again.';
        case 401:
          return 'Your session has expired. Please log in again.';
        case 403:
          return 'You don\'t have permission to perform this action.';
        case 404:
          return 'The requested resource was not found.';
        case 409:
          return 'This action conflicts with existing data. Please refresh and try again.';
        case 422:
          return 'Invalid data provided. Please check your input.';
        case 429:
          return 'Too many requests. Please wait a moment and try again.';
        case 500:
          return 'Server error. Please try again later.';
        case 502:
        case 503:
        case 504:
          return 'Service temporarily unavailable. Please try again in a few moments.';
        default:
          if (error.status >= 500) {
            return 'Server error. Please try again later.';
          }
          return error.message || 'An unexpected error occurred.';
      }
    }
    
    // Handle network errors
    if (error.message.includes('Network Error') || 
        error.message.includes('fetch') || 
        error.name === 'NetworkError') {
      return 'Unable to connect to the server. Please check your internet connection.';
    }
    
    // Handle timeout errors
    if (error.message.includes('timeout') || error.name === 'TimeoutError') {
      return 'Request timed out. Please try again.';
    }
    
    // Handle GPS/location errors
    if (error.message.includes('Geolocation') || error.message.includes('GPS')) {
      return 'Unable to access your location. Please enable location services and try again.';
    }
    
    // Handle WebSocket errors
    if (error.message.includes('WebSocket') || error.message.includes('Socket')) {
      return 'Connection lost. Attempting to reconnect...';
    }
    
    // Default fallback
    return error.message || 'An unexpected error occurred. Please try again.';
  };

  const handleApiError = useCallback((error: any, context?: string) => {
    // Transform fetch/axios errors to our ApiError format
    const apiError: ApiError = {
      name: error.name || 'ApiError',
      message: error.message || 'Unknown error',
      status: error.status || error.response?.status,
      code: error.code || error.response?.data?.code,
      details: error.response?.data || error.details,
    };
    
    handleError(apiError, context);
  }, [handleError]);

  const handleValidationError = useCallback((errors: Record<string, string[]>) => {
    const firstError = Object.values(errors)[0]?.[0];
    if (firstError) {
      toast.error(`Validation error: ${firstError}`);
    } else {
      toast.error('Please check your input and try again.');
    }
  }, []);

  return {
    handleError,
    handleApiError,
    handleValidationError,
    getErrorMessage,
  };
};