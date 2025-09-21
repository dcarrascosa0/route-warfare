# User Profile Components

This directory contains all components related to user profiles, statistics, and achievements.

## Components

### Core Components
- **UserStatistics** - Displays comprehensive user statistics and metrics

### Planned Components
- **AchievementProgress** - Shows achievement progress and unlocked achievements
- **UserProfile** - Complete user profile management

## Usage Examples

```tsx
import { UserStatistics } from '@/components/features/user-profile';

// Basic user statistics
<UserStatistics 
  stats={userStats}
  showDetails={true}
  className="w-full"
/>
```

## Types

All TypeScript interfaces and types are defined in `types.ts`:
- `UserStats` - User statistics and metrics
- `Achievement` - Achievement information and progress
- Component prop interfaces

## Dependencies

- Lucide React for icons
- Custom hooks for user data management