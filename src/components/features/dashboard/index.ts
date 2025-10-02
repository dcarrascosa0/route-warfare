export { default as DashboardMetrics } from './DashboardMetrics';
export type { DashboardMetric } from '@/lib/config/dashboard-metrics';
export { 
  DASHBOARD_CONFIG, 
  classifyUser, 
  getMetricsForUser 
} from '@/lib/config/dashboard-metrics';
export { useDashboardMetrics } from '@/hooks/useDashboardMetrics';