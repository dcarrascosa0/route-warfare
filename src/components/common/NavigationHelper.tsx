import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Home, Route, MapPin, Trophy, User, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationSection {
  title: string;
  description: string;
  items: Array<{
    name: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    href: string;
  }>;
  color: string;
}

const navigationSections: NavigationSection[] = [
  {
    title: 'Core Features',
    description: 'Essential daily activities and primary functions',
    color: 'blue',
    items: [
      {
        name: 'Dashboard',
        description: 'Overview, quick actions, and getting started',
        icon: Home,
        href: '/dashboard'
      },
      {
        name: 'Routes',
        description: 'Track GPS routes, manage history, and start new runs',
        icon: Route,
        href: '/routes'
      }
    ]
  },
  {
    title: 'Competition',
    description: 'Social features, rankings, and territorial gameplay',
    color: 'green',
    items: [
      {
        name: 'Territory',
        description: 'View and manage claimed territories on the map',
        icon: MapPin,
        href: '/territory'
      },
      {
        name: 'Leaderboard',
        description: 'Rankings, achievements, and player comparisons',
        icon: Trophy,
        href: '/leaderboard'
      }
    ]
  },
  {
    title: 'Account',
    description: 'Personal settings, profile, and account management',
    color: 'purple',
    items: [
      {
        name: 'Profile',
        description: 'Account settings, statistics, and personal information',
        icon: User,
        href: '/profile'
      }
    ]
  }
];

interface NavigationHelperProps {
  className?: string;
  compact?: boolean;
}

export const NavigationHelper: React.FC<NavigationHelperProps> = ({ 
  className,
  compact = false 
}) => {
  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'border-blue-200 bg-blue-50 text-blue-800',
      green: 'border-green-200 bg-green-50 text-green-800',
      purple: 'border-purple-200 bg-purple-50 text-purple-800'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  if (compact) {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-3", className)}>
        {navigationSections.map((section) => (
          <Card key={section.title} className="border-muted/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Badge className={getColorClasses(section.color)}>
                  {section.title}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.name} className="flex items-center gap-2 text-xs">
                      <Icon className="w-3 h-3 text-muted-foreground" />
                      <span className="font-medium">{item.name}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5" />
          Navigation Guide
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {navigationSections.map((section) => (
          <div key={section.title}>
            <div className="flex items-center gap-2 mb-3">
              <Badge className={getColorClasses(section.color)}>
                {section.title}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {section.description}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2 ml-4">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.name} className="flex items-start gap-3 p-2 rounded-md bg-muted/30">
                    <Icon className="w-4 h-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-sm">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{item.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default NavigationHelper;