# Territory Management Components

This directory contains all components related to territory claiming and management functionality.

## Components

### Core Components
- **TerritoryList** - Lists territories with ownership and status information

### Planned Components
- **TerritoryMap** - Interactive map showing territory boundaries
- **TerritoryDetails** - Detailed view of a specific territory
- **TerritoryConflicts** - Manages territory conflicts and resolutions

## Usage Examples

```tsx
import { TerritoryList } from '@/components/features/territory-management';

// Basic territory list
<TerritoryList 
  territories={territories}
  onTerritorySelect={(territory) => console.log('Selected:', territory)}
  showOwnership={true}
/>
```

## Types

All TypeScript interfaces and types are defined in `types.ts`:
- `Territory` - Territory information and boundaries
- `TerritoryConflict` - Conflict resolution data
- Component prop interfaces

## Dependencies

- React Leaflet for map functionality (planned)
- Lucide React for icons
- Custom hooks for territory management logic