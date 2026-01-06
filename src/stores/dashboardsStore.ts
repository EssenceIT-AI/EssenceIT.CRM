import { create } from "zustand";
import { persist } from "zustand/middleware";
import { dashboardsRepo, Dashboard, DashboardPatch } from "@/data/dashboardsRepo";

// Widget types
export type WidgetType = "kpi" | "bar" | "line" | "area" | "pie" | "table" | "funnel";

export interface WidgetLocalFilters {
  origins?: string[];
  products?: string[];
  owners?: string[];
  dateRange?: { from: string | null; to: string | null };
}

export interface WidgetLayout {
  colSpan: number;
  rowSpan?: number;
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
  dimension?: string;
  metric?: string;
  segmentation?: string;
  granularity?: string;
  periodPreset?: string;
  sorting?: string;
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
  meta?: number;
}

interface DashboardsState {
  // Data from Supabase
  dashboards: Dashboard[];
  loading: boolean;
  error: string | null;
  lastOrgId: string | null;

  // UI state (persisted locally)
  currentDashboard: string | null;
  filters: DashboardFilters;
  savedViews: Record<string, SavedView[]>;
  widgetOrder: Record<string, string[]>;

  // Data loading
  loadDashboards: (orgId: string) => Promise<void>;
  getDashboard: (slug: string) => Dashboard | undefined;

  // Actions
  setCurrentDashboard: (slug: string) => void;
  setFilters: (filters: Partial<DashboardFilters>) => void;
  clearFilters: () => void;
  addWidget: (orgId: string, dashboardSlug: string, widget: WidgetConfig) => Promise<void>;
  removeWidget: (orgId: string, dashboardSlug: string, widgetId: string) => Promise<void>;
  updateWidget: (orgId: string, dashboardSlug: string, widgetId: string, updates: Partial<WidgetConfig>) => Promise<void>;
  duplicateWidget: (orgId: string, dashboardSlug: string, widgetId: string) => Promise<void>;
  reorderWidgets: (dashboardSlug: string, widgetIds: string[]) => void;
  saveView: (dashboardSlug: string, view: Omit<SavedView, "id">) => void;
  loadView: (dashboardSlug: string, viewId: string) => void;
  deleteView: (dashboardSlug: string, viewId: string) => void;
  resetDashboard: (orgId: string, slug: string) => Promise<void>;
  createDefaultDashboards: (orgId: string) => Promise<void>;

  reset: () => void;
}

const defaultFilters: DashboardFilters = {
  dateRange: { from: null, to: null },
  origins: [],
  products: [],
  owners: [],
  territory: null,
  search: "",
};

// Default dashboard templates
const defaultDashboardTemplates = [
  {
    slug: "c-level",
    name: "C-Level",
    description: "Visão executiva do pipeline e métricas de vendas",
    widgets: [
      { id: "w1", type: "kpi" as const, title: "Pipe Total", kpiType: "pipeTotal" as const, size: "sm" as const },
      { id: "w2", type: "kpi" as const, title: "Forecast vs Meta", kpiType: "forecast" as const, size: "sm" as const },
      { id: "w3", type: "kpi" as const, title: "Win Rate", kpiType: "winRate" as const, size: "sm" as const },
      { id: "w4", type: "kpi" as const, title: "Ciclo Médio", kpiType: "avgCycle" as const, size: "sm" as const },
      { id: "w5", type: "kpi" as const, title: "Ticket Médio", kpiType: "avgTicket" as const, size: "sm" as const },
      { id: "w6", type: "bar" as const, title: "Pipeline por Etapa", groupBy: "stage" as const, dataKey: "value" as const, size: "lg" as const },
      { id: "w7", type: "pie" as const, title: "Valor por Produto", groupBy: "product" as const, dataKey: "value" as const, size: "md" as const },
      { id: "w8", type: "area" as const, title: "Evolução Mensal", groupBy: "month" as const, dataKey: "value" as const, stacked: true, size: "lg" as const },
      { id: "w9", type: "bar" as const, title: "Por Proprietário", groupBy: "ownerId" as const, dataKey: "value" as const, size: "md" as const },
    ],
  },
  {
    slug: "marketing",
    name: "Marketing",
    description: "Atribuição e performance de marketing",
    widgets: [
      { id: "m1", type: "kpi" as const, title: "Oportunidades MKT", kpiType: "pipeTotal" as const, size: "sm" as const },
      { id: "m2", type: "kpi" as const, title: "% Contribuição MKT", kpiType: "winRate" as const, size: "sm" as const },
      { id: "m3", type: "bar" as const, title: "Por Origem", groupBy: "origem" as const, dataKey: "count" as const, stacked: true, size: "lg" as const },
      { id: "m4", type: "funnel" as const, title: "Funil MQL → SQL → Opp", size: "md" as const },
      { id: "m5", type: "area" as const, title: "Leads por Mês", groupBy: "month" as const, dataKey: "count" as const, size: "lg" as const },
    ],
  },
  {
    slug: "vendas",
    name: "Vendas",
    description: "Performance da equipe comercial",
    widgets: [
      { id: "v1", type: "kpi" as const, title: "Pipe Total", kpiType: "pipeTotal" as const, size: "sm" as const },
      { id: "v2", type: "kpi" as const, title: "Win Rate", kpiType: "winRate" as const, size: "sm" as const },
      { id: "v3", type: "kpi" as const, title: "Ticket Médio", kpiType: "avgTicket" as const, size: "sm" as const },
      { id: "v4", type: "bar" as const, title: "Por Vendedor", groupBy: "ownerId" as const, dataKey: "value" as const, size: "lg" as const },
      { id: "v5", type: "table" as const, title: "Dados Resumidos", size: "xl" as const },
    ],
  },
];

export const useDashboardsStore = create<DashboardsState>()(
  persist(
    (set, get) => ({
      dashboards: [],
      loading: false,
      error: null,
      lastOrgId: null,
      currentDashboard: null,
      filters: defaultFilters,
      savedViews: {},
      widgetOrder: {},

      loadDashboards: async (orgId: string) => {
        if (get().lastOrgId === orgId && get().dashboards.length > 0) {
          return;
        }

        set({ loading: true, error: null });

        try {
          let dashboards = await dashboardsRepo.list(orgId);
          
          // Create default dashboards if none exist
          if (dashboards.length === 0) {
            await get().createDefaultDashboards(orgId);
            dashboards = await dashboardsRepo.list(orgId);
          }

          set({ dashboards, loading: false, lastOrgId: orgId });
        } catch (error) {
          console.error("Error loading dashboards:", error);
          set({ error: (error as Error).message, loading: false });
        }
      },

      getDashboard: (slug) => {
        return get().dashboards.find((d) => d.slug === slug);
      },

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

      addWidget: async (orgId, dashboardSlug, widget) => {
        const dashboard = get().dashboards.find((d) => d.slug === dashboardSlug);
        if (!dashboard) return;

        const updatedWidgets = [...dashboard.widgets, widget];
        
        try {
          await dashboardsRepo.update(dashboard.id, { widgets: updatedWidgets });
          set((state) => ({
            dashboards: state.dashboards.map((d) =>
              d.slug === dashboardSlug ? { ...d, widgets: updatedWidgets } : d
            ),
          }));
        } catch (error) {
          console.error("Error adding widget:", error);
          throw error;
        }
      },

      removeWidget: async (orgId, dashboardSlug, widgetId) => {
        const dashboard = get().dashboards.find((d) => d.slug === dashboardSlug);
        if (!dashboard) return;

        const updatedWidgets = dashboard.widgets.filter((w) => w.id !== widgetId);
        
        try {
          await dashboardsRepo.update(dashboard.id, { widgets: updatedWidgets });
          set((state) => ({
            dashboards: state.dashboards.map((d) =>
              d.slug === dashboardSlug ? { ...d, widgets: updatedWidgets } : d
            ),
          }));
        } catch (error) {
          console.error("Error removing widget:", error);
          throw error;
        }
      },

      updateWidget: async (orgId, dashboardSlug, widgetId, updates) => {
        const dashboard = get().dashboards.find((d) => d.slug === dashboardSlug);
        if (!dashboard) return;

        const updatedWidgets = dashboard.widgets.map((w) =>
          w.id === widgetId ? { ...w, ...updates } : w
        );
        
        try {
          await dashboardsRepo.update(dashboard.id, { widgets: updatedWidgets });
          set((state) => ({
            dashboards: state.dashboards.map((d) =>
              d.slug === dashboardSlug ? { ...d, widgets: updatedWidgets } : d
            ),
          }));
        } catch (error) {
          console.error("Error updating widget:", error);
          throw error;
        }
      },

      duplicateWidget: async (orgId, dashboardSlug, widgetId) => {
        const dashboard = get().dashboards.find((d) => d.slug === dashboardSlug);
        const widget = dashboard?.widgets.find((w) => w.id === widgetId);
        if (!dashboard || !widget) return;

        const newWidget = {
          ...widget,
          id: `widget-${Date.now()}`,
          title: `${widget.title} (cópia)`,
        };

        await get().addWidget(orgId, dashboardSlug, newWidget);
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
          set({ filters: view.filters });
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

      resetDashboard: async (orgId, slug) => {
        const template = defaultDashboardTemplates.find((t) => t.slug === slug);
        if (!template) return;

        const dashboard = get().dashboards.find((d) => d.slug === slug);
        if (!dashboard) return;

        try {
          await dashboardsRepo.update(dashboard.id, { widgets: template.widgets });
          set((state) => ({
            dashboards: state.dashboards.map((d) =>
              d.slug === slug ? { ...d, widgets: template.widgets } : d
            ),
            widgetOrder: {
              ...state.widgetOrder,
              [slug]: undefined,
            },
            filters: defaultFilters,
          }));
        } catch (error) {
          console.error("Error resetting dashboard:", error);
          throw error;
        }
      },

      createDefaultDashboards: async (orgId) => {
        try {
          for (const template of defaultDashboardTemplates) {
            await dashboardsRepo.create({
              organization_id: orgId,
              slug: template.slug,
              name: template.name,
              description: template.description,
              widgets: template.widgets,
            });
          }
        } catch (error) {
          console.error("Error creating default dashboards:", error);
          throw error;
        }
      },

      reset: () => {
        set({ 
          dashboards: [], 
          loading: false, 
          error: null, 
          lastOrgId: null,
          currentDashboard: null,
          filters: defaultFilters,
        });
      },
    }),
    {
      name: "crm-dashboards-ui",
      partialize: (state) => ({
        currentDashboard: state.currentDashboard,
        filters: state.filters,
        savedViews: state.savedViews,
        widgetOrder: state.widgetOrder,
      }),
    }
  )
);
