import React, { useState, useMemo, useCallback } from 'react';
import { ChevronUp, ChevronDown, Search, Filter, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useResponsive } from '@/hooks/useResponsive';

export interface Column<T> {
  key: keyof T | string;
  title: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  filterType?: 'text' | 'select' | 'date' | 'number';
  filterOptions?: Array<{ label: string; value: string }>;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  exportable?: boolean;
  exportFilename?: string;
  pageSize?: number;
  pageSizeOptions?: number[];
  className?: string;
  emptyMessage?: string;
  onRowClick?: (row: T, index: number) => void;
  onExport?: (data: T[]) => void;
}

type SortDirection = 'asc' | 'desc' | null;

interface SortState {
  column: string | null;
  direction: SortDirection;
}

interface FilterState {
  [key: string]: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  searchable = true,
  searchPlaceholder = "Search...",
  exportable = false,
  exportFilename = "data",
  pageSize: initialPageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
  className = "",
  emptyMessage = "No data available",
  onRowClick,
  onExport,
}: DataTableProps<T>) {
  const { isMobile, isTouchDevice } = useResponsive();
  
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [sortState, setSortState] = useState<SortState>({ column: null, direction: null });
  const [filters, setFilters] = useState<FilterState>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(columns.map(col => typeof col.key === 'string' ? col.key : String(col.key)))
  );

  // Get nested value from object using dot notation
  const getNestedValue = useCallback((obj: T, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }, []);

  // Filtering logic
  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(row =>
        columns.some(column => {
          const value = getNestedValue(row, String(column.key));
          return String(value || '').toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Apply column filters
    Object.entries(filters).forEach(([columnKey, filterValue]) => {
      if (filterValue) {
        result = result.filter(row => {
          const value = getNestedValue(row, columnKey);
          return String(value || '').toLowerCase().includes(filterValue.toLowerCase());
        });
      }
    });

    return result;
  }, [data, searchTerm, filters, columns, getNestedValue]);

  // Sorting logic
  const sortedData = useMemo(() => {
    if (!sortState.column || !sortState.direction) {
      return filteredData;
    }

    return [...filteredData].sort((a, b) => {
      const aValue = getNestedValue(a, sortState.column!);
      const bValue = getNestedValue(b, sortState.column!);

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortState.direction === 'asc' ? -1 : 1;
      if (bValue == null) return sortState.direction === 'asc' ? 1 : -1;

      // Handle different data types
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortState.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      if (aValue instanceof Date && bValue instanceof Date) {
        return sortState.direction === 'asc' 
          ? aValue.getTime() - bValue.getTime() 
          : bValue.getTime() - aValue.getTime();
      }

      // String comparison
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      
      if (aStr < bStr) return sortState.direction === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortState.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortState, getNestedValue]);

  // Pagination logic
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Event handlers
  const handleSort = useCallback((columnKey: string) => {
    setSortState(prev => {
      if (prev.column === columnKey) {
        // Cycle through: asc -> desc -> null
        const newDirection: SortDirection = 
          prev.direction === 'asc' ? 'desc' : 
          prev.direction === 'desc' ? null : 'asc';
        return { column: newDirection ? columnKey : null, direction: newDirection };
      }
      return { column: columnKey, direction: 'asc' };
    });
  }, []);

  const handleFilter = useCallback((columnKey: string, value: string) => {
    setFilters(prev => ({ ...prev, [columnKey]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  }, []);

  const handleExport = useCallback(() => {
    if (onExport) {
      onExport(sortedData);
    } else {
      // Default CSV export
      const csvContent = [
        // Header row
        columns
          .filter(col => visibleColumns.has(String(col.key)))
          .map(col => col.title)
          .join(','),
        // Data rows
        ...sortedData.map(row =>
          columns
            .filter(col => visibleColumns.has(String(col.key)))
            .map(col => {
              const value = getNestedValue(row, String(col.key));
              return `"${String(value || '').replace(/"/g, '""')}"`;
            })
            .join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${exportFilename}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    }
  }, [sortedData, columns, visibleColumns, exportFilename, onExport, getNestedValue]);

  const toggleColumnVisibility = useCallback((columnKey: string) => {
    setVisibleColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(columnKey)) {
        newSet.delete(columnKey);
      } else {
        newSet.add(columnKey);
      }
      return newSet;
    });
  }, []);

  // Render sort icon
  const renderSortIcon = (columnKey: string) => {
    if (sortState.column !== columnKey) {
      return <ChevronUp className="w-4 h-4 opacity-30" />;
    }
    return sortState.direction === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  };

  // Visible columns for rendering
  const visibleColumnsArray = columns.filter(col => 
    visibleColumns.has(String(col.key))
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          {/* Search */}
          {searchable && (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          )}

          {/* Active Filters */}
          {Object.entries(filters).some(([_, value]) => value) && (
            <div className="flex flex-wrap gap-1">
              {Object.entries(filters).map(([key, value]) => 
                value ? (
                  <Badge key={key} variant="secondary" className="text-xs">
                    {columns.find(col => String(col.key) === key)?.title}: {value}
                    <button
                      onClick={() => handleFilter(key, '')}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                ) : null
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Column Visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size={isTouchDevice ? "default" : "sm"}>
                <Filter className="w-4 h-4 mr-2" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {columns.map(column => (
                <DropdownMenuCheckboxItem
                  key={String(column.key)}
                  checked={visibleColumns.has(String(column.key))}
                  onCheckedChange={() => toggleColumnVisibility(String(column.key))}
                >
                  {column.title}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export */}
          {exportable && (
            <Button 
              variant="outline" 
              size={isTouchDevice ? "default" : "sm"}
              onClick={handleExport}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                {visibleColumnsArray.map((column) => (
                  <th
                    key={String(column.key)}
                    className={`px-4 py-3 text-left text-sm font-medium ${column.headerClassName || ''}`}
                    style={{ width: column.width }}
                  >
                    <div className="flex items-center gap-2">
                      <span>{column.title}</span>
                      {column.sortable && (
                        <button
                          onClick={() => handleSort(String(column.key))}
                          className="hover:bg-muted rounded p-1 transition-colors"
                        >
                          {renderSortIcon(String(column.key))}
                        </button>
                      )}
                      {column.filterable && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="hover:bg-muted rounded p-1 transition-colors">
                              <Filter className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <div className="p-2">
                              <Input
                                placeholder={`Filter ${column.title}...`}
                                value={filters[String(column.key)] || ''}
                                onChange={(e) => handleFilter(String(column.key), e.target.value)}
                                className="text-sm"
                              />
                            </div>
                            {column.filterOptions && (
                              <>
                                <DropdownMenuSeparator />
                                {column.filterOptions.map(option => (
                                  <DropdownMenuItem
                                    key={option.value}
                                    onClick={() => handleFilter(String(column.key), option.value)}
                                  >
                                    {option.label}
                                  </DropdownMenuItem>
                                ))}
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={visibleColumnsArray.length} className="px-4 py-8 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumnsArray.length} className="px-4 py-8 text-center text-muted-foreground">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, index) => (
                  <tr
                    key={index}
                    className={`border-t hover:bg-muted/30 transition-colors ${
                      onRowClick ? 'cursor-pointer' : ''
                    }`}
                    onClick={() => onRowClick?.(row, index)}
                  >
                    {visibleColumnsArray.map((column) => (
                      <td
                        key={String(column.key)}
                        className={`px-4 py-3 text-sm ${column.className || ''}`}
                      >
                        {column.render 
                          ? column.render(getNestedValue(row, String(column.key)), row, index)
                          : String(getNestedValue(row, String(column.key)) || '')
                        }
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Show</span>
            <Select value={String(pageSize)} onValueChange={(value) => {
              setPageSize(Number(value));
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map(size => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>of {sortedData.length} entries</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size={isTouchDevice ? "default" : "sm"}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              {!isMobile && "Previous"}
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size={isTouchDevice ? "default" : "sm"}
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-10"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size={isTouchDevice ? "default" : "sm"}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              {!isMobile && "Next"}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;