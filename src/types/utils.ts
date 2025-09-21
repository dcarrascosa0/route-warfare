/**
 * Type utilities for common transformations and operations.
 */

// Utility types for making properties optional or required
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Utility types for API responses
export type ApiResponse<T> = {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
};

export type ApiListResponse<T> = ApiResponse<T[]> & {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

// Utility types for form handling
export type FormData<T> = {
  [K in keyof T]: T[K] extends string | number | boolean | Date | null | undefined
    ? T[K]
    : T[K] extends Array<infer U>
    ? U extends string | number | boolean | Date | null | undefined
      ? T[K]
      : never
    : never;
};

export type FormErrors<T> = {
  [K in keyof T]?: string;
};

export type FormState<T> = {
  data: FormData<T>;
  errors: FormErrors<T>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
};

// Utility types for component props
export type PropsWithClassName<T = {}> = T & {
  className?: string;
};

export type PropsWithChildren<T = {}> = T & {
  children?: React.ReactNode;
};

export type PropsWithTestId<T = {}> = T & {
  'data-testid'?: string;
};

// Utility types for event handlers
export type EventHandler<T = Event> = (event: T) => void;
export type AsyncEventHandler<T = Event> = (event: T) => Promise<void>;

// Utility types for API client methods
export type ApiMethod<TRequest = void, TResponse = unknown> = TRequest extends void
  ? () => Promise<ApiResponse<TResponse>>
  : (request: TRequest) => Promise<ApiResponse<TResponse>>;

// Utility types for state management
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
};

export type AsyncAction<T> =
  | { type: 'LOADING' }
  | { type: 'SUCCESS'; payload: T }
  | { type: 'ERROR'; payload: string }
  | { type: 'RESET' };

// Utility types for configuration
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

// Utility types for data transformation
export type Mapper<TInput, TOutput> = (input: TInput) => TOutput;
export type AsyncMapper<TInput, TOutput> = (input: TInput) => Promise<TOutput>;

export type Validator<T> = (value: T) => boolean;
export type AsyncValidator<T> = (value: T) => Promise<boolean>;

// Utility types for filtering and sorting
export type FilterPredicate<T> = (item: T) => boolean;
export type SortComparator<T> = (a: T, b: T) => number;

export type SortOrder = 'asc' | 'desc';
export type SortConfig<T> = {
  field: keyof T;
  order: SortOrder;
};

// Utility types for coordinates and geometry
export type Coordinate = [number, number]; // [longitude, latitude]
export type CoordinateWithAltitude = [number, number, number]; // [longitude, latitude, altitude]

export type BoundingBox = {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
};

// Utility functions for type guards
export function isNotNull<T>(value: T | null): value is T {
  return value !== null;
}

export function isNotUndefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

export function isNotNullOrUndefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function hasProperty<T, K extends string>(
  obj: T,
  prop: K
): obj is T & Record<K, unknown> {
  return typeof obj === 'object' && obj !== null && prop in obj;
}

// Utility functions for array operations
export function groupBy<T, K extends string | number | symbol>(
  array: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  return array.reduce((groups, item) => {
    const key = keyFn(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<K, T[]>);
}

export function uniqueBy<T, K>(array: T[], keyFn: (item: T) => K): T[] {
  const seen = new Set<K>();
  return array.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

// Utility functions for object operations
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
}

export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  keys.forEach(key => {
    delete result[key];
  });
  return result;
}