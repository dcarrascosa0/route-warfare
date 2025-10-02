import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardMetric } from '@/lib/config/dashboard-metrics';

interface DashboardMetricsProps {
  metrics: DashboardMetric[];
  statistics?: any;
  isLoading?: boolean;
}

interface MetricCardProps {
  metric: DashboardMetric;
  statistics?: any;
  isLoading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ metric, statistics, isLoading }) => {
  const value = metric.getValue(statistics);
  const subtext = metric.getSubtext(statistics);
  const trend = typeof metric.trend === 'function' ? metric.trend(statistics) : metric.trend;

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-600" />;
      case 'neutral':
        return <Minus className="h-3 w-3 text-gray-500" />;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      case 'neutral':
        return 'text-gray-500';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
        <metric.icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{value}</div>
              {getTrendIcon()}
            </div>
            <div className="flex items-center justify-between">
              <p className={`text-xs ${getTrendColor()}`}>
                {subtext}
              </p>
              {metric.action && (
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs text-primary hover:text-primary/80"
                >
                  <Link to={metric.action.href}>
                    {metric.action.label}
                  </Link>
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({
  metrics,
  statistics,
  isLoading = false
}) => {
  // Ensure we never show more than the configured maximum
  const displayMetrics = metrics.slice(0, 3);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {displayMetrics.map((metric) => (
        <MetricCard
          key={metric.id}
          metric={metric}
          statistics={statistics}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
};

export default DashboardMetrics;