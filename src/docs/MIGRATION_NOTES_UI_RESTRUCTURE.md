UI Restructure Migration Notes

This document summarizes changes for the restructure to reduce duplication and align shared patterns.

Routes and Navigation
- Territory now uses explicit tabs via URL:
  - /territory/map
  - /territory/stats
- Routes page split into tabs via URL:
  - /routes/active
  - /routes/history
  - /routes/history/:id opens detail drawer
- Profile tabs via URL:
  - /profile/:user/overview
  - /profile/:user/achievements
  - /profile/:user/settings
- Redirects added for legacy paths: /territory -> /territory/map, /routes -> /routes/active.

Achievements
- Achievements removed from Territory page.
- Achievements live only under Profile at /profile/:user/achievements.

Shared Components Added
- GlobalControlsContext: global {period, live} with localStorage persistence.
- MapControls: unified map controls (zoom, fit/recenter, layer/grid toggles, fullscreen hook).
- MapLegend: unified legend styling.
- TerritoryHoverCard: standardized hover card content.
- ZoneDrawer: right-side drawer for zone/territory details with actions.
- FilterBar: shared search/filter control.
- UnitsFormatter: standardized distance and area (m/m² under thresholds; km/km² otherwise).

Copy and Terminology
- Standardized terms: Route, Zone, Territory, Claim, Contest.
- Units: km and km²; m² used only when area < 0.01 km² (handled by UnitsFormatter).

Acceptance Criteria Covered
- Achievements only at /profile/:user/achievements.
- Period/live toggles persist in header and across sessions.
- Map controls identical for Routes Active and Territory Map; zone drawer opens quickly.
- m² displayed only below 0.01 km².
- Leaderboard uses shared period and pins self row at top.
- Empty states unify on shared EmptyState component.

Notes
- If any feature consumed previous Territory Achievements on the Territory page, update links to Profile Achievements.
- Replace any custom area/distance formatting with UnitsFormatter.

