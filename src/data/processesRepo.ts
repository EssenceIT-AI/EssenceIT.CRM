import { httpClient } from "@/lib/httpClient";
import { Process, ProcessTransition } from "@/types/process";

// Type alias for stage requirements
type StageRequirements = Record<string, string[]>;

export interface ProcessCreate {
  organization_id: string;
  name: string;
  select_field_key: string;
  stages?: string[];
  transitions?: ProcessTransition[];
  requirements?: StageRequirements;
  is_active?: boolean;
  enabled?: boolean;
}

export interface ProcessPatch {
  name?: string;
  select_field_key?: string;
  stages?: string[];
  transitions?: ProcessTransition[];
  requirements?: StageRequirements;
  is_active?: boolean;
  enabled?: boolean;
}

const parseProcess = (data: any): Process => ({
  id: data.id,
  name: data.name,
  enabled: data.enabled ?? true,
  selectFieldKey: data.select_field_key,
  selectFieldLabel: data.select_field_key, // Will be resolved from schema
  optionOrder: (data.stages as unknown as string[]) ?? [],
  transitions: (data.transitions as unknown as ProcessTransition[]) ?? [],
  stageRequirements: (data.requirements as unknown as StageRequirements) ?? {},
  createdAt: data.created_at ?? new Date().toISOString(),
  updatedAt: data.updated_at ?? new Date().toISOString(),
});

export const processesRepo = {
  async list(orgId: string): Promise<Process[]> {
    const response = await httpClient.get<Process[]>("/processes");
    if (response.error) {
      console.error("Error fetching processes:", response.error);
      throw new Error(response.error);
    }
    return (response.data || []).map(parseProcess);
  },

  async get(id: string): Promise<Process | null> {
    const response = await httpClient.get<Process>(`/processes/${id}`);
    if (response.status === 404) return null;
    if (response.error) {
      console.error("Error fetching process:", response.error);
      throw new Error(response.error);
    }
    return response.data ? parseProcess(response.data) : null;
  },

  async create(createData: ProcessCreate): Promise<Process> {
    const response = await httpClient.post<Process>("/processes", {
      name: createData.name,
      select_field_key: createData.select_field_key,
      stages: createData.stages ?? [],
      transitions: createData.transitions ?? [],
      requirements: createData.requirements ?? {},
      is_active: createData.is_active ?? false,
      enabled: createData.enabled ?? true,
    });
    if (!response.data) {
      console.error("Error creating process:", response.error);
      throw new Error(response.error || "Failed to create process");
    }
    return parseProcess(response.data);
  },

  async update(id: string, patch: ProcessPatch): Promise<Process> {
    const updateData: Record<string, unknown> = {};
    if (patch.name !== undefined) updateData.name = patch.name;
    if (patch.select_field_key !== undefined) updateData.select_field_key = patch.select_field_key;
    if (patch.stages !== undefined) updateData.stages = patch.stages;
    if (patch.transitions !== undefined) updateData.transitions = patch.transitions;
    if (patch.requirements !== undefined) updateData.requirements = patch.requirements;
    if (patch.is_active !== undefined) updateData.is_active = patch.is_active;
    if (patch.enabled !== undefined) updateData.enabled = patch.enabled;

    const response = await httpClient.patch<Process>(`/processes/${id}`, updateData);
    if (!response.data) {
      console.error("Error updating process:", response.error);
      throw new Error(response.error || "Failed to update process");
    }
    return parseProcess(response.data);
  },

  async delete(id: string): Promise<void> {
    const response = await httpClient.delete(`/processes/${id}`);
    if (response.error) {
      console.error("Error deleting process:", response.error);
      throw new Error(response.error);
    }
  },

  async getActiveByField(orgId: string, selectFieldKey: string): Promise<Process | null> {
    const response = await httpClient.get<Process[]>("/processes");
    if (response.error) {
      console.error("Error fetching processes:", response.error);
      throw new Error(response.error);
    }
    const processes = (response.data || []).map(parseProcess);
    return processes.find(
      (p) => p.selectFieldKey === selectFieldKey && p.enabled && (p as any).is_active === true
    ) || null;
  },

  async setActiveByField(orgId: string, selectFieldKey: string, processId: string | null): Promise<void> {
    const response = await httpClient.post("/processes/set-active", {
      select_field_key: selectFieldKey,
      process_id: processId,
    });
    if (response.error) {
      console.error("Error setting active process:", response.error);
      throw new Error(response.error);
    }
  },
};
