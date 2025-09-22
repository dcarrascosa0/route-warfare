/**
 * UI-related type definitions.
 */

import { ReactNode } from "react";

export interface ComponentProps {
  className?: string;
  children?: ReactNode;
}

export interface ButtonProps extends ComponentProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export interface InputProps extends ComponentProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
}

export interface ModalProps extends ComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => ReactNode;
  width?: string;
}

export interface TableProps<T> extends ComponentProps {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  sortable?: boolean;
  selectable?: boolean;
  selectedRows?: T[];
  onSelectionChange?: (rows: T[]) => void;
}

export interface FormFieldProps extends ComponentProps {
  label?: string;
  error?: string;
  required?: boolean;
  helpText?: string;
}

export interface LoadingSpinnerProps extends ComponentProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export interface ProgressBarProps extends ComponentProps {
  value: number;
  max?: number;
  color?: string;
  showLabel?: boolean;
  label?: string;
}

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
}

export interface TabsProps extends ComponentProps {
  items: TabItem[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
}

export interface DropdownItem {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}

export interface DropdownProps extends ComponentProps {
  trigger: ReactNode;
  items: DropdownItem[];
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
}

export interface MapProps extends ComponentProps {
  center?: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  polygons?: MapPolygon[];
  polylines?: MapPolyline[];
  onMapClick?: (lat: number, lng: number) => void;
  onMarkerClick?: (marker: MapMarker) => void;
}

export interface MapMarker {
  id: string;
  position: [number, number];
  title?: string;
  icon?: string;
  popup?: ReactNode;
}

export interface MapPolygon {
  id: string;
  coordinates: [number, number][];
  color?: string;
  fillColor?: string;
  opacity?: number;
  fillOpacity?: number;
  popup?: ReactNode;
}

export interface MapPolyline {
  id: string;
  coordinates: [number, number][];
  color?: string;
  weight?: number;
  opacity?: number;
  popup?: ReactNode;
}