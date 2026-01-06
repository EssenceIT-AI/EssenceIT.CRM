import { httpClient } from "@/lib/httpClient";

export interface Company {
  id: string;
  organization_id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  size: string | null;
  country: string | null;
  city: string | null;
  owner_id: string | null;
  props: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CompanyCreate {
  organization_id: string;
  name: string;
  domain?: string | null;
  industry?: string | null;
  size?: string | null;
  country?: string | null;
  city?: string | null;
  owner_id?: string | null;
  props?: Record<string, unknown>;
}

export interface CompanyPatch {
  name?: string;
  domain?: string | null;
  industry?: string | null;
  size?: string | null;
  country?: string | null;
  city?: string | null;
  owner_id?: string | null;
  props?: Record<string, unknown>;
}

const parseCompany = (data: any): Company => ({
  id: data.id,
  organization_id: data.organization_id,
  name: data.name,
  domain: data.domain,
  industry: data.industry,
  size: data.size,
  country: data.country,
  city: data.city,
  owner_id: data.owner_id,
  props: (data.props as Record<string, unknown>) ?? {},
  created_at: data.created_at ?? new Date().toISOString(),
  updated_at: data.updated_at ?? new Date().toISOString(),
});

export const companiesRepo = {
  async list(orgId: string): Promise<Company[]> {
    const response = await httpClient.get<Company[]>("/companies");
    if (response.error) {
      console.error("Error fetching companies:", response.error);
      throw new Error(response.error);
    }
    return (response.data || []).map(parseCompany);
  },

  async get(id: string): Promise<Company | null> {
    const response = await httpClient.get<Company>(`/companies/${id}`);
    if (response.status === 404) return null;
    if (response.error) {
      console.error("Error fetching company:", response.error);
      throw new Error(response.error);
    }
    return response.data ? parseCompany(response.data) : null;
  },

  async create(createData: CompanyCreate): Promise<Company> {
    const response = await httpClient.post<Company>("/companies", {
      name: createData.name,
      domain: createData.domain ?? null,
      industry: createData.industry ?? null,
      size: createData.size ?? null,
      country: createData.country ?? null,
      city: createData.city ?? null,
      owner_id: createData.owner_id ?? null,
      props: createData.props ?? {},
    });
    if (!response.data) {
      console.error("Error creating company:", response.error);
      throw new Error(response.error || "Failed to create company");
    }
    return parseCompany(response.data);
  },

  async update(id: string, patch: CompanyPatch): Promise<Company> {
    const updateData: Record<string, unknown> = {};
    if (patch.name !== undefined) updateData.name = patch.name;
    if (patch.domain !== undefined) updateData.domain = patch.domain;
    if (patch.industry !== undefined) updateData.industry = patch.industry;
    if (patch.size !== undefined) updateData.size = patch.size;
    if (patch.country !== undefined) updateData.country = patch.country;
    if (patch.city !== undefined) updateData.city = patch.city;
    if (patch.owner_id !== undefined) updateData.owner_id = patch.owner_id;
    if (patch.props !== undefined) updateData.props = patch.props;

    const response = await httpClient.patch<Company>(`/companies/${id}`, updateData);
    if (!response.data) {
      console.error("Error updating company:", response.error);
      throw new Error(response.error || "Failed to update company");
    }
    return parseCompany(response.data);
  },

  async delete(id: string): Promise<void> {
    const response = await httpClient.delete(`/companies/${id}`);
    if (response.error) {
      console.error("Error deleting company:", response.error);
      throw new Error(response.error);
    }
  },
};
