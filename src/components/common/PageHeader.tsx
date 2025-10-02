import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  subtitle?: string;
  icon?: LucideIcon;
  className?: string;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  subtitle,
  icon: Icon,
  className,
  children
}) => {
  return (
    <div className={cn("mb-6", className)}>
      <div className="flex flex-col space-y-4 md:flex-row md:items-start md:justify-between md:space-y-0">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {Icon && <Icon className="w-8 h-8 text-primary" />}
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
              {subtitle && (
                <p className="text-lg text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>
          </div>
          {description && (
            <p className="text-muted-foreground max-w-2xl">{description}</p>
          )}
        </div>
        {children && (
          <div className="flex-shrink-0">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;