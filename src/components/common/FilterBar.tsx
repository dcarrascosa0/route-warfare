import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectControl {
  id: string;
  value: string;
  onChange: (val: string) => void;
  options: SelectOption[];
}

interface FilterBarProps {
  className?: string;
  search?: {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
  };
  selects?: SelectControl[];
  right?: React.ReactNode;
}

export function FilterBar({ className, search, selects = [], right }: FilterBarProps) {
  return (
    <div className={cn("flex flex-col gap-3 md:flex-row md:items-center md:justify-between", className)}>
      <div className="flex items-center gap-2">
        {search && (
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={search.placeholder || "Search..."}
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
              className="pl-8 w-64"
            />
          </div>
        )}
        {selects.map((sel) => (
          <select
            key={sel.id}
            value={sel.value}
            onChange={(e) => sel.onChange(e.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm"
          >
            {sel.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ))}
      </div>
      <div className="flex items-center gap-2">{right}</div>
    </div>
  );
}

export default FilterBar;


