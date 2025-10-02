import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';

export interface SectionIndicatorProps {
  section: string;
  subsection?: string;
  icon?: LucideIcon;
  status?: 'active' | 'inactive' | 'loading';
  className?: string;
}

export const SectionIndicator: React.FC<SectionIndicatorProps> = ({
  section,
  subsection,
  icon: Icon,
  status = 'active',
  className
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'active':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'loading':
        return 'bg-muted/50 text-muted-foreground border-muted/30';
      case 'inactive':
      default:
        return 'bg-muted/30 text-muted-foreground border-muted/20';
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge 
        variant="outline" 
        className={cn("flex items-center gap-1.5 px-3 py-1", getStatusColor())}
      >
        {Icon && <Icon className="w-3 h-3" />}
        <span className="font-medium">{section}</span>
        {subsection && (
          <>
            <span className="text-muted-foreground/60">•</span>
            <span className="text-sm">{subsection}</span>
          </>
        )}
      </Badge>
    </div>
  );
};

export default SectionIndicator;