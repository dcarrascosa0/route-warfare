# Components Directory

This directory contains all React components organized by feature domains and usage patterns.

## Directory Structure

```
components/
├── features/           # Feature-specific components
│   ├── route-tracking/    # GPS tracking and route management
│   ├── territory-management/  # Territory claiming and management
│   └── user-profile/      # User statistics and achievements
├── layout/             # Layout and navigation components
├── common/             # Shared/reusable components
├── ui/                 # Base UI components (shadcn/ui)
└── index.ts            # Main exports
```

## Organization Principles

### Feature-Based Organization
Components are grouped by business domain rather than technical concerns:
- **Route Tracking** - Everything related to GPS tracking and routes
- **Territory Management** - Territory claiming, conflicts, and ownership
- **User Profile** - User statistics, achievements, and profile management

### Component Categories
- **Features** - Domain-specific business logic components
- **Layout** - Application structure and navigation
- **Common** - Reusable components used across features
- **UI** - Base design system components

## Usage Patterns

### Importing Components
```tsx
// Feature components
import { RouteMap, RouteTracker } from '@/components/features/route-tracking';
import { TerritoryList } from '@/components/features/territory-management';
import { UserStatistics } from '@/components/features/user-profile';

// Layout components
import { Navigation } from '@/components/layout';

// Common components
import { LoadingSpinner, ErrorBoundary } from '@/components/common';

// UI components
import { Button, Card } from '@/components/ui';
```

### Component Composition
Components are designed to be composable and follow single responsibility principle:

```tsx
// Good: Focused components
<RouteTracker onRouteComplete={handleComplete} />
<RouteMap route={route} interactive={true} />
<GPSStatus accuracy={accuracy} isTracking={true} />

// Avoid: Monolithic components that do everything
```

## Best Practices

### Component Design
1. **Single Responsibility** - Each component has one clear purpose
2. **Prop Interfaces** - All props are typed with TypeScript interfaces
3. **Composition over Inheritance** - Use composition patterns
4. **Error Boundaries** - Wrap components that might fail

### File Organization
1. **Co-located Tests** - Test files next to components
2. **Type Definitions** - Shared types in `types.ts` files
3. **Documentation** - README files for each feature
4. **Index Files** - Clean exports from each directory

### Performance
1. **Lazy Loading** - Large components are lazy-loaded
2. **Memoization** - Use React.memo for expensive components
3. **Code Splitting** - Feature-based code splitting

## Migration Guide

When moving from the old flat structure to the new feature-based structure:

1. **Update Imports** - Change import paths to use new structure
2. **Check Dependencies** - Ensure all dependencies are properly imported
3. **Test Components** - Run tests to ensure functionality is preserved
4. **Update Documentation** - Keep component documentation up to date

## Contributing

When adding new components:

1. **Choose the Right Location** - Place in appropriate feature directory
2. **Follow Naming Conventions** - Use PascalCase for components
3. **Add Type Definitions** - Include proper TypeScript types
4. **Write Tests** - Add comprehensive test coverage
5. **Update Exports** - Add to appropriate index files
6. **Document Usage** - Update README files with examples