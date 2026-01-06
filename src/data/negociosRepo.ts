import { httpClient } from "@/lib/httpClient";

export interface Negocio {
  id: string;
  organization_id: string;
  title: string;
  value: number;
  owner_id: string | null;
  props: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface NegocioCreate {
  organization_id: string;
  title: string;
  value?: number;
  owner_id?: string | null;
  props?: Record<string, unknown>;
}

export interface NegocioPatch {
  title?: string;
  value?: number;
  owner_id?: string | null;
  props?: Record<string, unknown>;
}

export const negociosRepo = {
  async list(_orgId: string): Promise<Negocio[]> {
    const res = await httpClient.get<Negocio[]>("/negocios");
    if (res.error) throw new Error(res.error);
    return res.data || [];
  },

  async get(id: string): Promise<Negocio | null> {
    const res = await httpClient.get<Negocio>(`/negocios/${id}`);
    if (res.status === 404) return null;
    if (res.error) throw new Error(res.error);
    return res.data;
  },

  async create(createData: NegocioCreate): Promise<Negocio> {
    const res = await httpClient.post<Negocio>("/negocios", createData);
    if (!res.data) throw new Error(res.error || "Failed to create negocio");
    return res.data;
  },

  async update(id: string, patch: NegocioPatch): Promise<Negocio> {
    const res = await httpClient.patch<Negocio>(`/negocios/${id}`, patch);
    if (!res.data) throw new Error(res.error || "Failed to update negocio");
    return res.data;
  },

  async delete(id: string): Promise<void> {
    const res = await httpClient.delete(`/negocios/${id}`);
    if (!(res.status === 200 || res.status === 204)) throw new Error(res.error || "Failed to delete negocio");
  },
};
