/**
 * Simple tracking utility for analytics events
 */

export interface TrackingEvent {
  event: string;
  properties?: Record<string, any>;
}

export function track(event: string, properties?: Record<string, any>) {
  const trackingEvent: TrackingEvent = {
    event,
    properties: {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      ...properties
    }
  };

  // In development, log to console
  if (import.meta.env.MODE === 'development') {
    console.log('📊 Tracking Event:', trackingEvent);
  }

  // In production, send to analytics service
  // Example: analytics.track(event, properties);
  
  // For now, store in localStorage for debugging
  try {
    const events = JSON.parse(localStorage.getItem('rw_tracking_events') || '[]');
    events.push(trackingEvent);
    // Keep only last 100 events
    if (events.length > 100) {
      events.splice(0, events.length - 100);
    }
    localStorage.setItem('rw_tracking_events', JSON.stringify(events));
  } catch (error) {
    console.warn('Failed to store tracking event:', error);
  }
}

// Dashboard specific tracking events
export const trackDashboard = {
  view: () => track('dashboard_view'),
  ctaStartRun: () => track('cta_start_run'),
  questClick: (questName: string) => track('quest_click', { quest_name: questName }),
  guideExpand: () => track('guide_expand'),
  dismissEducation: () => track('dismiss_education'),
  nextBestActionClick: (action: string) => track('next_best_action_click', { action })
};

// Territory-specific tracking events
export const territoryTracking = {
  view: () => track('territory_view'),
  filterChange: (filter: string) => track('filter_change', { filter }),
  legendToggle: (isOpen: boolean) => track('legend_toggle', { is_open: isOpen }),
  planRouteClick: () => track('plan_route_click'),
  zoomToMine: () => track('zoom_to_mine'),
  searchSelect: (territoryId: string) => track('search_select', { territory_id: territoryId }),
  heatmapToggle: (isEnabled: boolean) => track('heatmap_toggle', { is_enabled: isEnabled })
};