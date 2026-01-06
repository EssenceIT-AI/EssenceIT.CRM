import { Permission } from "@/config/app.config";

// Column types for dynamic tables
export type ColumnType = 
  | "text"
  | "number"
  | "currency"
  | "select"
  | "multi-select"
  | "date"
  | "boolean"
  | "relation";

export interface ColumnOption {
  value: string;
  label: string;
  color?: string;
  isDefault?: boolean;
}

export interface ColumnDefinition {
  id: string;
  name: string;
  fieldKey?: string; // For mapping to data field (defaults to id)
  type: ColumnType;
  width?: number;
  visible: boolean;
  order: number;
  options?: ColumnOption[]; // For select/multi-select
  relationTable?: string; // For relation type
  required?: boolean;
  editable?: boolean;
  description?: string; // Help text
}

export interface TableSchema {
  id: string;
  name: string;
  columns: ColumnDefinition[];
}

export interface TableRow {
  id: string;
  [key: string]: unknown;
}

export interface SavedView {
  id: string;
  name: string;
  tableId: string;
  filters: FilterConfig[];
  sorting: SortConfig[];
  visibleColumns: string[];
  columnOrder: string[];
}

export interface FilterConfig {
  columnId: string;
  operator: "equals" | "contains" | "gt" | "lt" | "gte" | "lte" | "between" | "isEmpty" | "isNotEmpty";
  value: unknown;
}

export interface SortConfig {
  columnId: string;
  direction: "asc" | "desc";
}

// User & Auth types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  roleId: string;
  companyScope: string[];
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

// Business entities
export interface Company {
  id: string;
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
  country?: string;
  city?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  companyId?: string;
  position?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Deal {
  id: string;
  name: string;
  companyId: string;
  contactId?: string;
  product: "VAR" | "COM" | "AMS";
  origin: string;
  stage: string;
  ownerId: string;
  value: number;
  createdAt: string;
  expectedCloseDate: string;
  closedAt?: string;
  notes?: string;
}

// Kanban types
export interface KanbanStage {
  id: string;
  name: string;
  color: string;
  order: number;
  probability: number; // For forecast calculation
}

// Dashboard types
export interface KpiData {
  label: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  trend?: "up" | "down" | "neutral";
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: unknown;
}
