import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DashboardMetrics } from '../DashboardMetrics';
import { getMetricsForUser, classifyUser } from '@/lib/config/dashboard-metrics';

// Mock statistics data
const mockNewUserStats = {
  total_routes: 1,
  total_territories: 0,
  total_territory_area_km2: 0,
  completion_rate: 1.0,
  rank: null,
  total_distance_km: 2.5
};

const mockReturningUserStats = {
  total_routes: 15,
  total_territories: 5,
  total_territory_area_km2: 2.5,
  completion_rate: 0.85,
  rank: 42,
  total_distance_km: 125.3,
  weekly_routes: 3,
  weekly_territory: 0.5,
  rank_change: -2
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('DashboardMetrics', () => {
  it('should render loading state correctly', () => {
    const metrics = getMetricsForUser('new');
    renderWithRouter(
      <DashboardMetrics 
        metrics={metrics} 
        isLoading={true} 
      />
    );

    // Should show skeleton loaders (look for skeleton elements by class)
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThanOrEqual(3);
  });

  it('should render new user metrics correctly', () => {
    const metrics = getMetricsForUser('new', mockNewUserStats);
    renderWithRouter(
      <DashboardMetrics 
        metrics={metrics} 
        statistics={mockNewUserStats}
        isLoading={false} 
      />
    );

    // Should show new user focused metrics
    expect(screen.getByText('Routes Completed')).toBeInTheDocument();
    expect(screen.getByText('Territory Claimed')).toBeInTheDocument();
    expect(screen.getByText('Current Rank')).toBeInTheDocument();
    
    // Should show correct values
    expect(screen.getByText('1')).toBeInTheDocument(); // routes completed
    expect(screen.getByText('0 km²')).toBeInTheDocument(); // territory
    expect(screen.getByText('—')).toBeInTheDocument(); // no rank yet
  });

  it('should render returning user metrics correctly', () => {
    const metrics = getMetricsForUser('returning', mockReturningUserStats);
    renderWithRouter(
      <DashboardMetrics 
        metrics={metrics} 
        statistics={mockReturningUserStats}
        isLoading={false} 
      />
    );

    // Should show returning user focused metrics
    expect(screen.getByText('This Week')).toBeInTheDocument();
    expect(screen.getByText('Total Territory')).toBeInTheDocument();
    expect(screen.getByText('Rank Progress')).toBeInTheDocument();
    
    // Should show correct values
    expect(screen.getByText('3 routes')).toBeInTheDocument(); // weekly routes
    expect(screen.getByText('2.50 km²')).toBeInTheDocument(); // total territory
    expect(screen.getByText('#42')).toBeInTheDocument(); // current rank
  });

  it('should limit metrics to maximum of 3', () => {
    const metrics = getMetricsForUser('new');
    renderWithRouter(
      <DashboardMetrics 
        metrics={metrics} 
        statistics={mockNewUserStats}
        isLoading={false} 
      />
    );

    // Should only show 3 metric cards
    const cards = screen.getAllByRole('heading', { level: 3 });
    expect(cards.length).toBeLessThanOrEqual(3);
  });
});

describe('Dashboard Metrics Configuration', () => {
  it('should classify users correctly', () => {
    expect(classifyUser(mockNewUserStats)).toBe('new');
    expect(classifyUser(mockReturningUserStats)).toBe('returning');
    expect(classifyUser(undefined)).toBe('new');
  });

  it('should return correct metrics for user types', () => {
    const newUserMetrics = getMetricsForUser('new');
    const returningUserMetrics = getMetricsForUser('returning');

    expect(newUserMetrics).toHaveLength(3);
    expect(returningUserMetrics).toHaveLength(3);

    // New user metrics should focus on getting started
    expect(newUserMetrics[0].id).toBe('routes_completed');
    expect(newUserMetrics[1].id).toBe('territory_claimed');
    expect(newUserMetrics[2].id).toBe('current_rank');

    // Returning user metrics should focus on progress
    expect(returningUserMetrics[0].id).toBe('weekly_progress');
    expect(returningUserMetrics[1].id).toBe('territory_total');
    expect(returningUserMetrics[2].id).toBe('rank_change');
  });

  it('should prioritize metrics correctly', () => {
    const metrics = getMetricsForUser('new');
    
    // Should be sorted by priority
    for (let i = 1; i < metrics.length; i++) {
      expect(metrics[i].priority).toBeGreaterThanOrEqual(metrics[i-1].priority);
    }
  });
});