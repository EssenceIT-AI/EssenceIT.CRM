import { create } from "zustand";
import { persist } from "zustand/middleware";

// Widget types
export type WidgetType = "kpi" | "bar" | "line" | "area" | "pie" | "table" | "funnel";

export interface WidgetLocalFilters {
  origins?: string[];
  products?: string[];
  owners?: string[];
  dateRange?: { from: string | null; to: string | null };
}

export interface WidgetLayout {
  colSpan: number; // 1-12
  rowSpan?: number; // 1-4
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  dataKey?: "count" | "value";
  groupBy?: "origem" | "stage" | "product" | "ownerId" | "month" | "createdAt" | "expectedCloseDate" | "contactId" | "companyId";
  stacked?: boolean;
  showLegend?: boolean;
  showLabels?: boolean;
  notes?: string;
  kpiType?: "pipeTotal" | "forecast" | "winRate" | "avgCycle" | "avgTicket";
  size?: "sm" | "md" | "lg" | "xl";
  layout?: WidgetLayout;
  // New configurable properties
  dimension?: string;
  metric?: string; // "count" | "sum_value" | "avg_value" | "win_rate"
  segmentation?: string;
  granularity?: string; // "day" | "week" | "month" | "quarter"
  periodPreset?: string; // "this_year" | "last_12_months" | "this_month" | "custom"
  sorting?: string; // "label_asc" | "label_desc" | "value_asc" | "value_desc"
  localFilters?: WidgetLocalFilters;
}

export interface DashboardFilters {
  dateRange: { from: string | null; to: string | null };
  origins: string[];
  products: string[];
  owners: string[];
  territory: string | null;
  search: string;
}

export interface SavedView {
  id: string;
  name: string;
  filters: DashboardFilters;
  widgets: WidgetConfig[];
}

export interface DashboardConfig {
  id: string;
  slug: string;
  name: string;
  description?: string;
  canEdit: boolean;
  widgets: WidgetConfig[];
  meta?: number; // Forecast meta
}

interface DashboardState {
  dashboards: DashboardConfig[];
  currentDashboard: string | null;
  filters: DashboardFilters;
  savedViews: Record<string, SavedView[]>; // By dashboard slug
  widgetOrder: Record<string, string[]>; // By dashboard slug

  // Actions
  setCurrentDashboard: (slug: string) => void;
  setFilters: (filters: Partial<DashboardFilters>) => void;
  clearFilters: () => void;
  addWidget: (dashboardSlug: string, widget: WidgetConfig) => void;
  removeWidget: (dashboardSlug: string, widgetId: string) => void;
  updateWidget: (dashboardSlug: string, widgetId: string, updates: Partial<WidgetConfig>) => void;
  duplicateWidget: (dashboardSlug: string, widgetId: string) => void;
  reorderWidgets: (dashboardSlug: string, widgetIds: string[]) => void;
  saveView: (dashboardSlug: string, view: Omit<SavedView, "id">) => void;
  loadView: (dashboardSlug: string, viewId: string) => void;
  deleteView: (dashboardSlug: string, viewId: string) => void;
  resetDashboard: (slug: string) => void;
  getDashboard: (slug: string) => DashboardConfig | undefined;
}

const defaultFilters: DashboardFilters = {
  dateRange: { from: null, to: null },
  origins: [],
  products: [],
  owners: [],
  territory: null,
  search: "",
};

// Default dashboards with initial widgets
const defaultDashboards: DashboardConfig[] = [
  {
    id: "dash-1",
    slug: "c-level",
    name: "C-Level",
    description: "Visão executiva do pipeline e métricas de vendas",
    canEdit: true,
    meta: 2000000,
    widgets: [
      { id: "w1", type: "kpi", title: "Pipe Total", kpiType: "pipeTotal", size: "sm" },
      { id: "w2", type: "kpi", title: "Forecast vs Meta", kpiType: "forecast", size: "sm" },
      { id: "w3", type: "kpi", title: "Win Rate", kpiType: "winRate", size: "sm" },
      { id: "w4", type: "kpi", title: "Ciclo Médio", kpiType: "avgCycle", size: "sm" },
      { id: "w5", type: "kpi", title: "Ticket Médio", kpiType: "avgTicket", size: "sm" },
      { id: "w6", type: "bar", title: "Pipeline por Etapa", groupBy: "stage", dataKey: "value", size: "lg" },
      { id: "w7", type: "pie", title: "Valor por Produto", groupBy: "product", dataKey: "value", size: "md" },
      { id: "w8", type: "area", title: "Evolução Mensal", groupBy: "month", dataKey: "value", stacked: true, size: "lg" },
      { id: "w9", type: "bar", title: "Por Proprietário", groupBy: "ownerId", dataKey: "value", size: "md" },
    ],
  },
  {
    id: "dash-2",
    slug: "marketing",
    name: "Marketing",
    description: "Atribuição e performance de marketing",
    canEdit: true,
    meta: 500000,
    widgets: [
      { id: "m1", type: "kpi", title: "Oportunidades MKT", kpiType: "pipeTotal", size: "sm" },
      { id: "m2", type: "kpi", title: "% Contribuição MKT", kpiType: "winRate", size: "sm" },
      { id: "m3", type: "bar", title: "Por Origem", groupBy: "origem", dataKey: "count", stacked: true, size: "lg" },
      { id: "m4", type: "funnel", title: "Funil MQL → SQL → Opp", size: "md" },
      { id: "m5", type: "area", title: "Leads por Mês", groupBy: "month", dataKey: "count", size: "lg" },
    ],
  },
  {
    id: "dash-3",
    slug: "vendas",
    name: "Vendas",
    description: "Performance da equipe comercial",
    canEdit: true,
    meta: 1500000,
    widgets: [
      { id: "v1", type: "kpi", title: "Pipe Total", kpiType: "pipeTotal", size: "sm" },
      { id: "v2", type: "kpi", title: "Win Rate", kpiType: "winRate", size: "sm" },
      { id: "v3", type: "kpi", title: "Ticket Médio", kpiType: "avgTicket", size: "sm" },
      { id: "v4", type: "bar", title: "Por Vendedor", groupBy: "ownerId", dataKey: "value", size: "lg" },
      { id: "v5", type: "table", title: "Dados Resumidos", size: "xl" },
    ],
  },
];

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      dashboards: defaultDashboards,
      currentDashboard: null,
      filters: defaultFilters,
      savedViews: {},
      widgetOrder: {},

      setCurrentDashboard: (slug) => {
        set({ currentDashboard: slug });
      },

      setFilters: (newFilters) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        }));
      },

      clearFilters: () => {
        set({ filters: defaultFilters });
      },

      addWidget: (dashboardSlug, widget) => {
        set((state) => ({
          dashboards: state.dashboards.map((d) =>
            d.slug === dashboardSlug
              ? { ...d, widgets: [...d.widgets, widget] }
              : d
          ),
        }));
      },

      removeWidget: (dashboardSlug, widgetId) => {
        set((state) => ({
          dashboards: state.dashboards.map((d) =>
            d.slug === dashboardSlug
              ? { ...d, widgets: d.widgets.filter((w) => w.id !== widgetId) }
              : d
          ),
        }));
      },

      updateWidget: (dashboardSlug, widgetId, updates) => {
        set((state) => ({
          dashboards: state.dashboards.map((d) =>
            d.slug === dashboardSlug
              ? {
                  ...d,
                  widgets: d.widgets.map((w) =>
                    w.id === widgetId ? { ...w, ...updates } : w
                  ),
                }
              : d
          ),
        }));
      },

      duplicateWidget: (dashboardSlug, widgetId) => {
        const dashboard = get().dashboards.find((d) => d.slug === dashboardSlug);
        const widget = dashboard?.widgets.find((w) => w.id === widgetId);
        if (widget) {
          const newWidget = {
            ...widget,
            id: `widget-${Date.now()}`,
            title: `${widget.title} (cópia)`,
          };
          set((state) => ({
            dashboards: state.dashboards.map((d) =>
              d.slug === dashboardSlug
                ? { ...d, widgets: [...d.widgets, newWidget] }
                : d
            ),
          }));
        }
      },

      reorderWidgets: (dashboardSlug, widgetIds) => {
        set((state) => ({
          widgetOrder: {
            ...state.widgetOrder,
            [dashboardSlug]: widgetIds,
          },
        }));
      },

      saveView: (dashboardSlug, view) => {
        const id = `view-${Date.now()}`;
        set((state) => ({
          savedViews: {
            ...state.savedViews,
            [dashboardSlug]: [
              ...(state.savedViews[dashboardSlug] || []),
              { ...view, id },
            ],
          },
        }));
      },

      loadView: (dashboardSlug, viewId) => {
        const views = get().savedViews[dashboardSlug] || [];
        const view = views.find((v) => v.id === viewId);
        if (view) {
          set({
            filters: view.filters,
            dashboards: get().dashboards.map((d) =>
              d.slug === dashboardSlug ? { ...d, widgets: view.widgets } : d
            ),
          });
        }
      },

      deleteView: (dashboardSlug, viewId) => {
        set((state) => ({
          savedViews: {
            ...state.savedViews,
            [dashboardSlug]: (state.savedViews[dashboardSlug] || []).filter(
              (v) => v.id !== viewId
            ),
          },
        }));
      },

      resetDashboard: (slug) => {
        const defaultDash = defaultDashboards.find((d) => d.slug === slug);
        if (defaultDash) {
          set((state) => ({
            dashboards: state.dashboards.map((d) =>
              d.slug === slug ? { ...defaultDash } : d
            ),
            widgetOrder: {
              ...state.widgetOrder,
              [slug]: undefined,
            },
            filters: defaultFilters,
          }));
        }
      },

      getDashboard: (slug) => {
        return get().dashboards.find((d) => d.slug === slug);
      },
    }),
    {
      name: "crm-dashboards",
    }
  )
);
