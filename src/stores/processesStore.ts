import { create } from "zustand";
import { processesRepo, ProcessCreate, ProcessPatch } from "@/data/processesRepo";
import { Process, ProcessValidationResult } from "@/types/process";
import { useSchemaStore } from "./schemaStore";

interface CanChangeResult {
  ok: boolean;
  missingFields: { fieldKey: string; fieldLabel: string }[];
  transitionBlocked: boolean;
  message: string;
}

interface ProcessesState {
  processes: Process[];
  loading: boolean;
  error: string | null;
  lastOrgId: string | null;
  enforcementEnabled: boolean;

  // Data loading
  loadProcesses: (orgId: string) => Promise<void>;
  
  // CRUD operations
  getProcesses: () => Process[];
  getProcess: (id: string) => Process | undefined;
  createProcess: (orgId: string, data: Omit<Process, "id" | "createdAt" | "updatedAt">) => Promise<Process>;
  updateProcess: (id: string, updates: Partial<Process>) => Promise<void>;
  deleteProcess: (id: string) => Promise<void>;
  duplicateProcess: (orgId: string, id: string) => Promise<Process | undefined>;

  // Active process management
  setActiveProcess: (orgId: string, selectFieldKey: string, processId: string | null) => Promise<void>;
  getActiveProcess: (selectFieldKey: string) => Process | undefined;
  getActiveProcessForField: (selectFieldKey: string) => Process | null;
  isProcessActive: (processId: string) => boolean;

  // Enforcement
  toggleEnforcement: (enabled: boolean) => void;

  // Validation
  validateExitFromStage: (
    selectFieldKey: string,
    currentValue: string,
    deal: Record<string, unknown>
  ) => ProcessValidationResult;
  
  validateTransition: (
    selectFieldKey: string,
    fromValue: string,
    toValue: string
  ) => { allowed: boolean; message?: string };

  // Unified validation API
  canChangeSelectField: (params: {
    deal: Record<string, unknown>;
    fieldKey: string;
    fromValue: string;
    toValue: string;
  }) => CanChangeResult;

  // Schema helpers
  getSelectFieldOptions: (selectFieldKey: string) => { value: string; label: string; color?: string }[];

  reset: () => void;
}

// Dev-only logging
const devLog = (message: string, data?: unknown) => {
  if (import.meta.env.DEV) {
    console.log(`[ProcessesStore] ${message}`, data || '');
  }
};

export const useProcessesStore = create<ProcessesState>()((set, get) => ({
  processes: [],
  loading: false,
  error: null,
  lastOrgId: null,
  enforcementEnabled: true,

  loadProcesses: async (orgId: string) => {
    if (get().lastOrgId === orgId && get().processes.length > 0) {
      return;
    }

    set({ loading: true, error: null });

    try {
      const processes = await processesRepo.list(orgId);
      set({ processes, loading: false, lastOrgId: orgId });
    } catch (error) {
      console.error("Error loading processes:", error);
      set({ error: (error as Error).message, loading: false });
    }
  },

  getProcesses: () => get().processes,

  getProcess: (id) => get().processes.find((p) => p.id === id),

  createProcess: async (orgId, processData) => {
    const newProcess = await processesRepo.create({
      organization_id: orgId,
      name: processData.name,
      select_field_key: processData.selectFieldKey,
      stages: processData.optionOrder,
      transitions: processData.transitions,
      requirements: processData.stageRequirements,
      enabled: processData.enabled,
      is_active: false,
    });

    // If this is the first enabled process for this field, make it active
    const existingActive = get().processes.find(
      (p) => p.selectFieldKey === processData.selectFieldKey && p.enabled
    );

    if (!existingActive && processData.enabled) {
      await processesRepo.setActiveByField(orgId, processData.selectFieldKey, newProcess.id);
      newProcess.enabled = true;
    }

    set((state) => ({
      processes: [...state.processes, newProcess],
    }));

    return newProcess;
  },

  updateProcess: async (id, updates) => {
    const previousProcesses = get().processes;
    set((state) => ({
      processes: state.processes.map((p) =>
        p.id === id
          ? { ...p, ...updates, updatedAt: new Date().toISOString() }
          : p
      ),
    }));

    try {
      const patch: ProcessPatch = {};
      if (updates.name !== undefined) patch.name = updates.name;
      if (updates.selectFieldKey !== undefined) patch.select_field_key = updates.selectFieldKey;
      if (updates.optionOrder !== undefined) patch.stages = updates.optionOrder;
      if (updates.transitions !== undefined) patch.transitions = updates.transitions;
      if (updates.stageRequirements !== undefined) patch.requirements = updates.stageRequirements;
      if (updates.enabled !== undefined) patch.enabled = updates.enabled;

      await processesRepo.update(id, patch);
    } catch (error) {
      set({ processes: previousProcesses });
      throw error;
    }
  },

  deleteProcess: async (id) => {
    const previousProcesses = get().processes;
    set((state) => ({
      processes: state.processes.filter((p) => p.id !== id),
    }));

    try {
      await processesRepo.delete(id);
    } catch (error) {
      set({ processes: previousProcesses });
      throw error;
    }
  },

  duplicateProcess: async (orgId, id) => {
    const original = get().processes.find((p) => p.id === id);
    if (!original) return undefined;

    const duplicate = await processesRepo.create({
      organization_id: orgId,
      name: `${original.name} (Cópia)`,
      select_field_key: original.selectFieldKey,
      stages: original.optionOrder,
      transitions: original.transitions,
      requirements: original.stageRequirements,
      enabled: false,
      is_active: false,
    });

    set((state) => ({
      processes: [...state.processes, duplicate],
    }));

    return duplicate;
  },

  setActiveProcess: async (orgId, selectFieldKey, processId) => {
    try {
      await processesRepo.setActiveByField(orgId, selectFieldKey, processId);
      
      // Reload processes to get updated is_active states
      const processes = await processesRepo.list(orgId);
      set({ processes });
    } catch (error) {
      console.error("Error setting active process:", error);
      throw error;
    }
  },

  getActiveProcess: (selectFieldKey) => {
    const { processes } = get();
    return processes.find((p) => p.selectFieldKey === selectFieldKey && p.enabled);
  },

  getActiveProcessForField: (selectFieldKey) => {
    const { processes, enforcementEnabled } = get();
    
    if (!enforcementEnabled) {
      devLog(`Enforcement disabled, no process for ${selectFieldKey}`);
      return null;
    }

    // Find an enabled process for this field
    const process = processes.find((p) => p.selectFieldKey === selectFieldKey && p.enabled);
    
    if (!process) {
      devLog(`No active process for field: ${selectFieldKey}`);
      return null;
    }

    devLog(`Active process for ${selectFieldKey}: ${process.name}`);
    return process;
  },

  isProcessActive: (processId) => {
    const process = get().processes.find((p) => p.id === processId);
    return process?.enabled ?? false;
  },

  toggleEnforcement: (enabled) => {
    set({ enforcementEnabled: enabled });
  },

  validateExitFromStage: (selectFieldKey, currentValue, deal) => {
    const { enforcementEnabled } = get();
    
    if (!enforcementEnabled) {
      return { canMove: true, missingFields: [] };
    }

    const process = get().getActiveProcess(selectFieldKey);
    
    if (!process) {
      return { canMove: true, missingFields: [] };
    }

    const requiredFields = process.stageRequirements[currentValue] || [];
    
    if (requiredFields.length === 0) {
      return { canMove: true, missingFields: [] };
    }

    const schema = useSchemaStore.getState().getSchema("deals");
    const missingFields: { fieldKey: string; fieldName: string }[] = [];

    requiredFields.forEach((fieldKey) => {
      const value = deal[fieldKey];
      const column = schema?.columns.find((c) => c.id === fieldKey);
      const fieldName = column?.name || fieldKey;

      let isFilled = false;

      if (value === undefined || value === null) {
        isFilled = false;
      } else if (typeof value === "string") {
        isFilled = value.trim() !== "";
      } else if (typeof value === "number") {
        isFilled = true;
      } else if (Array.isArray(value)) {
        isFilled = value.length > 0;
      } else if (typeof value === "boolean") {
        isFilled = true;
      } else {
        isFilled = true;
      }

      if (!isFilled) {
        missingFields.push({ fieldKey, fieldName });
      }
    });

    if (missingFields.length > 0) {
      return {
        canMove: false,
        missingFields,
        message: `Campos obrigatórios para sair desta etapa: ${missingFields.map((f) => f.fieldName).join(", ")}`,
      };
    }

    return { canMove: true, missingFields: [] };
  },

  validateTransition: (selectFieldKey, fromValue, toValue) => {
    const { enforcementEnabled } = get();
    
    if (!enforcementEnabled) {
      return { allowed: true };
    }

    const process = get().getActiveProcess(selectFieldKey);
    
    if (!process) {
      return { allowed: true };
    }

    if (process.transitions.length === 0) {
      return { allowed: true };
    }

    const transitionExists = process.transitions.some(
      (t) => t.from === fromValue && t.to === toValue
    );

    if (!transitionExists) {
      const schema = useSchemaStore.getState().getSchema("deals");
      const column = schema?.columns.find((c) => c.id === selectFieldKey);
      const fromOption = column?.options?.find((o) => o.value === fromValue);
      const toOption = column?.options?.find((o) => o.value === toValue);
      const fromLabel = fromOption?.label || fromValue;
      const toLabel = toOption?.label || toValue;

      return {
        allowed: false,
        message: `Transição não permitida: "${fromLabel}" → "${toLabel}"`,
      };
    }

    return { allowed: true };
  },

  canChangeSelectField: ({ deal, fieldKey, fromValue, toValue }) => {
    devLog(`=== VALIDATION START ===`);
    devLog(`Field: ${fieldKey}`);
    devLog(`From: "${fromValue}" -> To: "${toValue}"`);
    
    if (fromValue === toValue) {
      devLog(`Same value, allowing`);
      return {
        ok: true,
        missingFields: [],
        transitionBlocked: false,
        message: "",
      };
    }
    
    const { enforcementEnabled, processes } = get();
    
    devLog(`Enforcement enabled: ${enforcementEnabled}`);
    
    if (!enforcementEnabled) {
      devLog(`Enforcement disabled, allowing change`);
      return {
        ok: true,
        missingFields: [],
        transitionBlocked: false,
        message: "",
      };
    }
    
    const process = processes.find((p) => p.selectFieldKey === fieldKey && p.enabled);
    devLog(`Process found: ${process?.name || 'NOT FOUND'}`);
    
    if (!process) {
      devLog(`No active process for field, allowing change`);
      return {
        ok: true,
        missingFields: [],
        transitionBlocked: false,
        message: "",
      };
    }

    devLog(`Checking process: ${process.name}`);
    devLog(`Stage requirements:`, process.stageRequirements);
    devLog(`Transitions:`, process.transitions);

    // 1. Validate exit requirements
    const requiredFields = process.stageRequirements[fromValue] || [];
    devLog(`Required fields for stage "${fromValue}":`, requiredFields);
    
    if (requiredFields.length > 0) {
      const schema = useSchemaStore.getState().getSchema("deals");
      const missingFields: { fieldKey: string; fieldLabel: string }[] = [];

      requiredFields.forEach((reqFieldKey) => {
        const value = deal[reqFieldKey];
        const column = schema?.columns.find((c) => c.id === reqFieldKey);
        const fieldLabel = column?.name || reqFieldKey;

        let isFilled = false;

        if (value === undefined || value === null) {
          isFilled = false;
        } else if (typeof value === "string") {
          isFilled = value.trim() !== "";
        } else if (typeof value === "number") {
          isFilled = true;
        } else if (Array.isArray(value)) {
          isFilled = value.length > 0;
        } else if (typeof value === "boolean") {
          isFilled = true;
        } else {
          isFilled = true;
        }

        devLog(`Checking field "${reqFieldKey}": value="${value}", filled=${isFilled}`);

        if (!isFilled) {
          missingFields.push({ fieldKey: reqFieldKey, fieldLabel });
        }
      });

      if (missingFields.length > 0) {
        const column = schema?.columns.find((c) => c.id === fieldKey);
        const fromLabel = column?.options?.find((o) => o.value === fromValue)?.label || fromValue;
        
        const message = `Não é possível sair de "${fromLabel}". Campos obrigatórios: ${missingFields.map((f) => f.fieldLabel).join(", ")}`;
        
        devLog(`EXIT BLOCKED - Missing fields:`, missingFields);
        devLog(`Message: ${message}`);
        
        return {
          ok: false,
          missingFields,
          transitionBlocked: false,
          message,
        };
      }
    }

    // 2. Validate transition
    if (process.transitions.length > 0) {
      const transitionExists = process.transitions.some(
        (t) => t.from === fromValue && t.to === toValue
      );
      
      devLog(`Checking transition "${fromValue}" -> "${toValue}": exists=${transitionExists}`);

      if (!transitionExists) {
        const schema = useSchemaStore.getState().getSchema("deals");
        const column = schema?.columns.find((c) => c.id === fieldKey);
        const fromOption = column?.options?.find((o) => o.value === fromValue);
        const toOption = column?.options?.find((o) => o.value === toValue);
        const fromLabel = fromOption?.label || fromValue;
        const toLabel = toOption?.label || toValue;

        const message = `Transição não permitida: "${fromLabel}" → "${toLabel}"`;
        
        devLog(`TRANSITION BLOCKED`);
        devLog(`Message: ${message}`);
        
        return {
          ok: false,
          missingFields: [],
          transitionBlocked: true,
          message,
        };
      }
    } else {
      devLog(`No transitions defined, all transitions allowed`);
    }

    devLog(`=== VALIDATION PASSED ===`);
    return {
      ok: true,
      missingFields: [],
      transitionBlocked: false,
      message: "",
    };
  },

  getSelectFieldOptions: (selectFieldKey) => {
    const schema = useSchemaStore.getState().getSchema("deals");
    const column = schema?.columns.find((c) => c.id === selectFieldKey);
    return column?.options || [];
  },

  reset: () => {
    set({ processes: [], loading: false, error: null, lastOrgId: null });
  },
}));
