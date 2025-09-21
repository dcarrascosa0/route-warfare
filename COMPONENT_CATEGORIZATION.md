# Component Categorization Plan

## 🎯 Route Tracking Feature
**Move to `features/route-tracking/`:**
- `route-map.tsx` → `RouteMap.tsx` (already exists, merge/replace)
- `enhanced-route-map.tsx` → `EnhancedRouteMap.tsx` 
- `route-map-modal.tsx` → `RouteMapModal.tsx`
- `active-route-tracker.tsx` → `ActiveRouteTracker.tsx`
- `real-time-route-map.tsx` → `RealTimeRouteMap.tsx`
- `route-path-overlay.tsx` → `RoutePathOverlay.tsx`
- `enhanced-route-visualization.tsx` → `EnhancedRouteVisualization.tsx`
- `offline-route-tracker.tsx` → `OfflineRouteTracker.tsx`
- `gps-simulator.tsx` → `GPSSimulator.tsx`

## 🏰 Territory Management Feature  
**Move to `features/territory-management/`:**
- `territory-map.tsx` → `TerritoryMap.tsx`
- `territory-details-modal.tsx` → `TerritoryDetailsModal.tsx`
- `territory-polygon.tsx` → `TerritoryPolygon.tsx`
- `territory-map-controls.tsx` → `TerritoryMapControls.tsx`
- `territory-claim-retry.tsx` → `TerritoryClaimRetry.tsx`
- `territory-conflict-visualization.tsx` → `TerritoryConflictVisualization.tsx`
- `conflict-resolution-actions.tsx` → `ConflictResolutionActions.tsx`
- `ownership-resolution-history.tsx` → `OwnershipResolutionHistory.tsx`
- `route-territory-filter.tsx` → `RouteTerritoryFilter.tsx`
- `grouped-territory-display.tsx` → `GroupedTerritoryDisplay.tsx`
- `route-territory-navigation.tsx` → `RouteTerritoryNavigation.tsx`
- `territory-notification-toast.tsx` → `TerritoryNotificationToast.tsx`
- `territory-update-indicator.tsx` → `TerritoryUpdateIndicator.tsx`

## 👤 User Profile Feature
**Move to `features/user-profile/`:**
- `user-stats.tsx` → `UserStats.tsx`
- `user-statistics-enhanced.tsx` → `UserStatisticsEnhanced.tsx`
- `achievement-grid.tsx` → `AchievementGrid.tsx`
- `achievement-progress.tsx` → `AchievementProgress.tsx`
- `achievement-progress-enhanced.tsx` → `AchievementProgressEnhanced.tsx`
- `leaderboard-entry.tsx` → `LeaderboardEntry.tsx`

## 📱 Mobile Features
**Create `features/mobile/`:**
- `mobile-route-management.tsx` → `MobileRouteManagement.tsx`
- `mobile-map-controls.tsx` → `MobileMapControls.tsx`
- `mobile-gps-optimizer.tsx` → `MobileGPSOptimizer.tsx`

## 🔔 Notifications Feature
**Create `features/notifications/`:**
- `notification-center.tsx` → `NotificationCenter.tsx`
- `notification-toast.tsx` → `NotificationToast.tsx`
- `notification-preferences.tsx` → `NotificationPreferences.tsx`

## 🌐 Network & Connectivity
**Move to `common/network/`:**
- `network-status-indicator.tsx` → `NetworkStatusIndicator.tsx`
- `sync-status-indicator.tsx` → `SyncStatusIndicator.tsx`
- `websocket-status.tsx` → `WebSocketStatus.tsx`
- `offline-indicator.tsx` → `OfflineIndicator.tsx`

## 🔧 Developer Tools & Debug
**Create `features/dev-tools/`:**
- `debug-panel.tsx` → `DebugPanel.tsx`
- `dev-tools-integration.tsx` → `DevToolsIntegration.tsx`
- `api-connection-test.tsx` → `APIConnectionTest.tsx`
- `health-check-dashboard.tsx` → `HealthCheckDashboard.tsx`

## 📊 Data & Tables
**Move to `common/data/`:**
- `data-table.tsx` → `DataTable.tsx`

## 🎨 UI & Loading States
**Move to `common/ui/`:**
- `loading-skeleton.tsx` → `LoadingSkeleton.tsx`
- `progressive-loader.tsx` → `ProgressiveLoader.tsx`
- `error-fallback.tsx` → `ErrorFallback.tsx`

## 🏠 Landing Page Components
**Create `features/landing/`:**
- `hero-section.tsx` → `HeroSection.tsx`
- `features-section.tsx` → `FeaturesSection.tsx`
- `map-preview.tsx` → `MapPreview.tsx`

## 🔐 Authentication
**Create `features/auth/`:**
- `RequireAuth.tsx` → `RequireAuth.tsx`