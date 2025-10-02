# Dashboard Metrics System

This system provides a configurable dashboard metrics display that adapts to different user types (new vs returning users) and limits the number of displayed metrics to prevent information overload.

## Components

### DashboardMetrics
The main component that renders up to 3 metrics based on user type and configuration.

```tsx
import { DashboardMetrics, useDashboardMetrics } from '@/components/features/dashboard';

const MyDashboard = () => {
  const { metrics, userType } = useDashboardMetrics({
    statistics: userStats,
    isLoading: false
  });

  return (
    <DashboardMetrics 
      metrics={metrics}
      statistics={userStats}
      isLoading={isLoading}
    />
  );
};
```

### useDashboardMetrics Hook
Provides the logic for determining user type and selecting appropriate metrics.

```tsx
const { metrics, userType, isLoading } = useDashboardMetrics({
  statistics: userStatistics,
  isLoading: statsLoading
});
```

## Configuration

### DashboardMetric Interface
```tsx
interface DashboardMetric {
  id: string;
  title: string;
  icon: LucideIcon;
  priority: number;
  getValue: (statistics?: any) => string;
  getSubtext: (statistics?: any) => string;
  trend?: 'up' | 'down' | 'neutral' | ((statistics?: any) => 'up' | 'down' | 'neutral');
  action?: {
    label: string;
    href: string;
  };
}
```

### User Classification
Users are classified as:
- **New**: ≤3 completed routes AND no claimed territory
- **Returning**: >3 completed routes OR has claimed territory

### Metric Sets

#### New User Metrics (Priority: Getting Started)
1. Routes Completed - Encourages first route completion
2. Territory Claimed - Shows territory claiming progress  
3. Current Rank - Provides competitive context

#### Returning User Metrics (Priority: Progress & Achievement)
1. Weekly Progress - Shows recent activity
2. Total Territory - Displays accumulated achievements
3. Rank Progress - Shows competitive improvement

## Features

- **3-Metric Limit**: Never shows more than 3 metrics to prevent cognitive overload
- **Priority-Based Selection**: Metrics are sorted by priority and top 3 are selected
- **User Type Adaptation**: Different metric sets for new vs returning users
- **Dynamic Trends**: Support for calculated trend indicators (up/down/neutral)
- **Action Links**: Optional navigation links for each metric
- **Loading States**: Skeleton loading support
- **Responsive Design**: Works on mobile and desktop

## Extending the System

To add new metrics:

1. Define the metric in `dashboard-metrics.ts`:
```tsx
const newMetric: DashboardMetric = {
  id: 'my_metric',
  title: 'My Metric',
  icon: MyIcon,
  priority: 4, // Lower priority = higher importance
  getValue: (stats) => stats?.my_value?.toString() || '0',
  getSubtext: (stats) => `${stats?.my_subvalue || 0} items`,
  trend: 'up'
};
```

2. Add to appropriate user type array:
```tsx
const NEW_USER_METRICS = [...existing, newMetric];
```

3. Update tests to cover new functionality.

## Requirements Satisfied

This implementation satisfies the following requirements from the navigation simplification spec:

- **Requirement 3.2**: Dashboard "Start Run" action is prominent, with maximum 3 metrics
- **Requirement 3.3**: Different experiences for new vs returning users with progressive disclosure
- **Requirement 5.5**: Clear user guidance through metric prioritization and actions