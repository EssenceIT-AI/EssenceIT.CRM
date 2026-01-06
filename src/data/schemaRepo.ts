import { httpClient } from "@/lib/httpClient";
import { ColumnDefinition } from "@/types";
import { dealsSchema } from "@/mocks/schemas";

export interface NegociosSchema {
  id: string;
  organization_id: string;
  columns: ColumnDefinition[];
  version: number;
  created_at: string;
  updated_at: string;
}

const getDefaultColumns = (): ColumnDefinition[] => dealsSchema.columns.map((c) => ({ ...c }));

export const schemaRepo = {
  async getSchema(_orgId: string): Promise<NegociosSchema | null> {
    const res = await httpClient.get<NegociosSchema>("/negocios/schema");
    if (res.status === 404) return null;
    if (res.error) throw new Error(res.error);
    return res.data;
  },

  async upsertSchema(_orgId: string, columns: ColumnDefinition[]): Promise<NegociosSchema> {
    const res = await httpClient.put<NegociosSchema>("/negocios/schema", { columns });
    if (!res.data) throw new Error(res.error || "Failed to upsert schema");
    return res.data;
  },

  async ensureSchema(orgId: string): Promise<NegociosSchema> {
    const existing = await this.getSchema(orgId);
    if (existing) return existing;
    return this.upsertSchema(orgId, getDefaultColumns());
  },
};
