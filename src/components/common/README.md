# Common Components

This directory contains reusable components that are used across multiple features.

## Components

### Core Components
- **LoadingSpinner** - Configurable loading spinner with optional text
- **ErrorBoundary** - React error boundary for graceful error handling

### Planned Components
- **LoadingSkeleton** - Skeleton loading states
- **ErrorFallback** - Customizable error fallback UI
- **NotificationToast** - Toast notification component
- **ProgressiveLoader** - Progressive loading component

## Usage Examples

```tsx
import { LoadingSpinner, ErrorBoundary } from '@/components/common';

// Loading spinner
<LoadingSpinner size="lg" text="Loading routes..." />

// Error boundary wrapper
<ErrorBoundary onError={(error) => console.error(error)}>
  <YourComponent />
</ErrorBoundary>
```

## Features

### LoadingSpinner
- Multiple sizes (sm, md, lg)
- Optional loading text
- Customizable styling

### ErrorBoundary
- Graceful error handling
- Development error details
- Retry functionality
- Custom fallback support

## Dependencies

- Lucide React for icons
- Custom UI components