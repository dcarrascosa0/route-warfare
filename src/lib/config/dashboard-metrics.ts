import { LucideIcon, Route, Trophy, Activity, Award } from 'lucide-react';

export interface DashboardMetric {
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

export interface DashboardConfig {
  newUserMetrics: DashboardMetric[];
  returningUserMetrics: DashboardMetric[];
  maxMetrics: number;
}



// Metric definitions for new users (focused on getting started)
const NEW_USER_METRICS: DashboardMetric[] = [
  {
    id: 'routes_completed',
    title: 'Routes Completed',
    icon: Route,
    priority: 1,
    getValue: (stats) => (stats?.total_routes || 0).toString(),
    getSubtext: (stats) => `${((stats?.completion_rate || 0) * 100).toFixed(1)}% success rate`,
    action: {
      label: 'Start your first route',
      href: '/routes'
    }
  },
  {
    id: 'total_distance',
    title: 'Total Distance',
    icon: Activity,
    priority: 2,
    getValue: (stats) => `${(stats?.total_distance_km || 0).toFixed(1)} km`,
    getSubtext: (stats) => `${stats?.total_routes || 0} routes tracked`,
    action: {
      label: 'View route history',
      href: '/routes'
    }
  },
  {
    id: 'current_rank',
    title: 'Current Rank',
    icon: Trophy,
    priority: 3,
    getValue: (stats) => stats?.rank ? `#${stats.rank}` : '—',
    getSubtext: (stats) => 'Based on activity',
    action: {
      label: 'View leaderboard',
      href: '/leaderboard'
    }
  }
];

// Metric definitions for returning users (focused on progress and achievements)
const RETURNING_USER_METRICS: DashboardMetric[] = [
  {
    id: 'weekly_progress',
    title: 'This Week',
    icon: Activity,
    priority: 1,
    getValue: (stats) => `${stats?.weekly_routes || 0} routes`,
    getSubtext: (stats) => `${(stats?.weekly_distance_km || 0).toFixed(1)} km tracked`,
    trend: 'up' // Could be calculated based on previous week
  },
  {
    id: 'total_distance',
    title: 'Total Distance',
    icon: Route,
    priority: 2,
    getValue: (stats) => `${(stats?.total_distance_km || 0).toFixed(1)} km`,
    getSubtext: (stats) => `${stats?.total_routes || 0} routes completed`,
    action: {
      label: 'View route history',
      href: '/routes'
    }
  },
  {
    id: 'rank_change',
    title: 'Rank Progress',
    icon: Award,
    priority: 3,
    getValue: (stats) => stats?.rank ? `#${stats.rank}` : '—',
    getSubtext: (stats) => {
      const change = stats?.rank_change || 0;
      if (change > 0) return `↑${change} this week`;
      if (change < 0) return `↓${Math.abs(change)} this week`;
      return 'No change';
    },
    trend: (stats) => {
      const change = stats?.rank_change || 0;
      if (change > 0) return 'up';
      if (change < 0) return 'down';
      return 'neutral';
    }
  }
];

export const DASHBOARD_CONFIG: DashboardConfig = {
  newUserMetrics: NEW_USER_METRICS,
  returningUserMetrics: RETURNING_USER_METRICS,
  maxMetrics: 3
};

// User classification logic
export const classifyUser = (statistics?: any): 'new' | 'returning' => {
  if (!statistics) return 'new';
  
  // Consider user "returning" if they have:
  // - More than 3 completed routes, OR
  // - Been active for more than a week
  const hasSignificantActivity = (statistics.total_routes || 0) > 3;
  
  return hasSignificantActivity ? 'returning' : 'new';
};

// Get prioritized metrics for user type
export const getMetricsForUser = (
  userType: 'new' | 'returning',
  statistics?: any
): DashboardMetric[] => {
  const metrics = userType === 'new' 
    ? DASHBOARD_CONFIG.newUserMetrics 
    : DASHBOARD_CONFIG.returningUserMetrics;
  
  return metrics
    .sort((a, b) => a.priority - b.priority)
    .slice(0, DASHBOARD_CONFIG.maxMetrics);
};