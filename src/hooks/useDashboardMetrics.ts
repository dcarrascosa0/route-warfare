import { useMemo } from 'react';
import { 
  classifyUser, 
  getMetricsForUser, 
  DashboardMetric 
} from '@/lib/config/dashboard-metrics';

interface UseDashboardMetricsProps {
  statistics?: any;
  isLoading?: boolean;
}

interface UseDashboardMetricsReturn {
  metrics: DashboardMetric[];
  userType: 'new' | 'returning';
  isLoading: boolean;
}

export const useDashboardMetrics = ({
  statistics,
  isLoading = false
}: UseDashboardMetricsProps): UseDashboardMetricsReturn => {
  const userType = useMemo(() => {
    return classifyUser(statistics);
  }, [statistics]);

  const metrics = useMemo(() => {
    return getMetricsForUser(userType, statistics);
  }, [userType, statistics]);

  return {
    metrics,
    userType,
    isLoading
  };
};