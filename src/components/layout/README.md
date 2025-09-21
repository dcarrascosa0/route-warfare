# Layout Components

This directory contains all layout-related components that provide the overall structure of the application.

## Components

### Core Components
- **Navigation** - Main navigation bar with responsive mobile menu

### Planned Components
- **Header** - Page headers and breadcrumbs
- **Footer** - Application footer
- **Sidebar** - Collapsible sidebar navigation

## Usage Examples

```tsx
import { Navigation } from '@/components/layout';

// Main navigation (typically used in App.tsx)
<Navigation />
```

## Features

### Navigation Component
- Responsive design with mobile hamburger menu
- Authentication-aware navigation items
- Sync status indicator integration
- Active route highlighting

## Dependencies

- React Router for navigation
- Auth context for authentication state
- Lucide React for icons