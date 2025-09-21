/**
 * Response utility functions.
 */

import type { ApiResult } from '../types';

export function isApiSuccess<T>(result: ApiResult<T>): result is ApiResult<T> & { ok: true; data: T } {
  return result.ok && result.data !== undefined;
}

export function isApiError<T>(result: ApiResult<T>): result is ApiResult<T> & { ok: false; error: unknown } {
  return !result.ok;
}

export function extractApiError<T>(result: ApiResult<T>): string {
  if (isApiSuccess(result)) {
    return '';
  }

  if (typeof result.error === 'string') {
    return result.error;
  }

  if (typeof result.error === 'object' && result.error !== null) {
    const error = result.error as any;
    return error.message || error.detail || 'An unknown error occurred';
  }

  return 'An unknown error occurred';
}

export function handleApiResponse<T>(
  result: ApiResult<T>,
  onSuccess: (data: T) => void,
  onError: (error: string) => void
): void {
  if (isApiSuccess(result)) {
    onSuccess(result.data);
  } else {
    onError(extractApiError(result));
  }
}