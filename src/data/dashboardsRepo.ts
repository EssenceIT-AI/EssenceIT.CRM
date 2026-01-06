import { httpClient } from "@/lib/httpClient";
import { DashboardConfig, DashboardFilters, WidgetConfig } from "@/stores/dashboardStore";

export interface Dashboard {
  id: string;
  organization_id: string;
  slug: string;
  name: string;
  description: string | null;
  widgets: WidgetConfig[];
  filters: DashboardFilters | null;
  widget_order: string[];
  created_at: string;
  updated_at: string;
}

export interface DashboardCreate {
  organization_id: string;
  slug: string;
  name: string;
  description?: string | null;
  widgets?: WidgetConfig[];
  filters?: DashboardFilters | null;
  widget_order?: string[];
}

export interface DashboardPatch {
  slug?: string;
  name?: string;
  description?: string | null;
  widgets?: WidgetConfig[];
  filters?: DashboardFilters | null;
  widget_order?: string[];
}

const parseDashboard = (data: any): Dashboard => ({
  id: data.id,
  organization_id: data.organization_id,
  slug: data.slug,
  name: data.name,
  description: data.description,
  widgets: (data.widgets as unknown as WidgetConfig[]) ?? [],
  filters: (data.filters as unknown as DashboardFilters) ?? null,
  widget_order: (data.widget_order as string[]) ?? [],
  created_at: data.created_at ?? new Date().toISOString(),
  updated_at: data.updated_at ?? new Date().toISOString(),
});

export const dashboardsRepo = {
  async list(orgId: string): Promise<Dashboard[]> {
    const response = await httpClient.get<Dashboard[]>("/dashboards");
    if (response.error) {
      console.error("Error fetching dashboards:", response.error);
      throw new Error(response.error);
    }
    return (response.data || []).map(parseDashboard);
  },

  async getBySlug(orgId: string, slug: string): Promise<Dashboard | null> {
    const response = await httpClient.get<Dashboard>(`/dashboards/slug/${slug}`);
    if (response.status === 404) return null;
    if (response.error) {
      console.error("Error fetching dashboard:", response.error);
      throw new Error(response.error);
    }
    return response.data ? parseDashboard(response.data) : null;
  },

  async get(id: string): Promise<Dashboard | null> {
    const response = await httpClient.get<Dashboard>(`/dashboards/${id}`);
    if (response.status === 404) return null;
    if (response.error) {
      console.error("Error fetching dashboard:", response.error);
      throw new Error(response.error);
    }
    return response.data ? parseDashboard(response.data) : null;
  },

  async create(createData: DashboardCreate): Promise<Dashboard> {
    const response = await httpClient.post<Dashboard>("/dashboards", {
      slug: createData.slug,
      name: createData.name,
      description: createData.description ?? null,
      widgets: createData.widgets ?? [],
      filters: createData.filters ?? null,
      widget_order: createData.widget_order ?? [],
    });
    if (!response.data) {
      console.error("Error creating dashboard:", response.error);
      throw new Error(response.error || "Failed to create dashboard");
    }
    return parseDashboard(response.data);
  },

  async update(id: string, patch: DashboardPatch): Promise<Dashboard> {
    const updateData: Record<string, unknown> = {};
    if (patch.slug !== undefined) updateData.slug = patch.slug;
    if (patch.name !== undefined) updateData.name = patch.name;
    if (patch.description !== undefined) updateData.description = patch.description;
    if (patch.widgets !== undefined) updateData.widgets = patch.widgets;
    if (patch.filters !== undefined) updateData.filters = patch.filters;
    if (patch.widget_order !== undefined) updateData.widget_order = patch.widget_order;

    const response = await httpClient.patch<Dashboard>(`/dashboards/${id}`, updateData);
    if (!response.data) {
      console.error("Error updating dashboard:", response.error);
      throw new Error(response.error || "Failed to update dashboard");
    }
    return parseDashboard(response.data);
  },

  async upsertBySlug(orgId: string, slug: string, data: Omit<DashboardPatch, 'slug'> & { name: string }): Promise<Dashboard> {
    const existing = await this.getBySlug(orgId, slug);
    
    if (existing) {
      return this.update(existing.id, { ...data, slug });
    } else {
      return this.create({
        organization_id: orgId,
        slug,
        ...data,
      });
    }
  },

  async delete(id: string): Promise<void> {
    const response = await httpClient.delete(`/dashboards/${id}`);
    if (response.error) {
      console.error("Error deleting dashboard:", response.error);
      throw new Error(response.error);
    }
  },
};
