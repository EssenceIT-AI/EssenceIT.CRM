import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Process, ActiveProcessMap, ProcessValidationResult } from "@/types/process";
import { useSchemaStore } from "./schemaStore";
import { ColumnDefinition } from "@/types";

interface CanChangeResult {
  ok: boolean;
  missingFields: { fieldKey: string; fieldLabel: string }[];
  transitionBlocked: boolean;
  message: string;
}

interface ProcessState {
  processes: Process[];
  activeProcessByField: ActiveProcessMap;
  enforcementEnabled: boolean;

  // CRUD operations
  getProcesses: () => Process[];
  getProcess: (id: string) => Process | undefined;
  getProcessBySelectField: (selectFieldKey: string) => Process | undefined;
  createProcess: (process: Omit<Process, "id" | "createdAt" | "updatedAt">) => Process;
  updateProcess: (id: string, updates: Partial<Process>) => void;
  deleteProcess: (id: string) => void;
  duplicateProcess: (id: string) => Process | undefined;

  // Active process management
  setActiveProcess: (selectFieldKey: string, processId: string | null) => void;
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
}

const generateId = () => `proc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

// Dev-only logging
const devLog = (message: string, data?: unknown) => {
  if (import.meta.env.DEV) {
    console.log(`[ProcessStore] ${message}`, data || '');
  }
};

export const useProcessStore = create<ProcessState>()(
  persist(
    (set, get) => ({
      processes: [],
      activeProcessByField: {},
      enforcementEnabled: true,

      getProcesses: () => get().processes,

      getProcess: (id) => get().processes.find((p) => p.id === id),

      getProcessBySelectField: (selectFieldKey) => {
        const { processes, activeProcessByField } = get();
        const activeProcessId = activeProcessByField[selectFieldKey];
        if (activeProcessId) {
          const activeProcess = processes.find((p) => p.id === activeProcessId && p.enabled);
          if (activeProcess) return activeProcess;
        }
        // Fallback to first enabled process for this field
        return processes.find((p) => p.selectFieldKey === selectFieldKey && p.enabled);
      },

      createProcess: (processData) => {
        const now = new Date().toISOString();
        const newProcess: Process = {
          ...processData,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };

        set((state) => {
          // Check if there's already an active process for this field
          const hasActiveProcess = state.activeProcessByField[processData.selectFieldKey];
          
          // If this is the first enabled process for this field, make it active
          const newActiveProcessByField = { ...state.activeProcessByField };
          if (!hasActiveProcess && processData.enabled) {
            newActiveProcessByField[processData.selectFieldKey] = newProcess.id;
            devLog(`Auto-activating first process for field: ${processData.selectFieldKey}`);
          }
          
          return {
            processes: [...state.processes, newProcess],
            activeProcessByField: newActiveProcessByField,
          };
        });

        return newProcess;
      },

      updateProcess: (id, updates) => {
        set((state) => ({
          processes: state.processes.map((p) =>
            p.id === id
              ? { ...p, ...updates, updatedAt: new Date().toISOString() }
              : p
          ),
        }));
      },

      deleteProcess: (id) => {
        set((state) => {
          const process = state.processes.find((p) => p.id === id);
          const newActiveProcessByField = { ...state.activeProcessByField };
          
          // Remove from active if this was active
          if (process) {
            if (newActiveProcessByField[process.selectFieldKey] === id) {
              delete newActiveProcessByField[process.selectFieldKey];
            }
          }

          return {
            processes: state.processes.filter((p) => p.id !== id),
            activeProcessByField: newActiveProcessByField,
          };
        });
      },

      duplicateProcess: (id) => {
        const original = get().processes.find((p) => p.id === id);
        if (!original) return undefined;

        const now = new Date().toISOString();
        const duplicate: Process = {
          ...original,
          id: generateId(),
          name: `${original.name} (Cópia)`,
          enabled: false,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          processes: [...state.processes, duplicate],
        }));

        return duplicate;
      },

      setActiveProcess: (selectFieldKey, processId) => {
        set((state) => {
          const newActiveProcessByField = { ...state.activeProcessByField };
          if (processId) {
            newActiveProcessByField[selectFieldKey] = processId;
          } else {
            delete newActiveProcessByField[selectFieldKey];
          }
          return { activeProcessByField: newActiveProcessByField };
        });
      },

      getActiveProcess: (selectFieldKey) => {
        const { processes, activeProcessByField } = get();
        const activeProcessId = activeProcessByField[selectFieldKey];
        if (!activeProcessId) return undefined;
        
        const process = processes.find((p) => p.id === activeProcessId);
        return process?.enabled ? process : undefined;
      },

      // New method that returns null explicitly for clearer API
      getActiveProcessForField: (selectFieldKey) => {
        const { processes, activeProcessByField, enforcementEnabled } = get();
        
        if (!enforcementEnabled) {
          devLog(`Enforcement disabled, no process for ${selectFieldKey}`);
          return null;
        }

        const activeProcessId = activeProcessByField[selectFieldKey];
        if (!activeProcessId) {
          devLog(`No active process ID for field: ${selectFieldKey}`);
          return null;
        }
        
        const process = processes.find((p) => p.id === activeProcessId);
        if (!process) {
          devLog(`Process not found: ${activeProcessId}`);
          return null;
        }

        if (!process.enabled) {
          devLog(`Process disabled: ${process.name}`);
          return null;
        }

        devLog(`Active process for ${selectFieldKey}: ${process.name}`);
        return process;
      },

      isProcessActive: (processId) => {
        const { activeProcessByField } = get();
        return Object.values(activeProcessByField).includes(processId);
      },

      toggleEnforcement: (enabled) => {
        set({ enforcementEnabled: enabled });
      },

      validateExitFromStage: (selectFieldKey, currentValue, deal) => {
        const { enforcementEnabled } = get();
        
        // If enforcement is disabled, always allow
        if (!enforcementEnabled) {
          return { canMove: true, missingFields: [] };
        }

        const process = get().getActiveProcess(selectFieldKey);
        
        // No active process = no restrictions
        if (!process) {
          return { canMove: true, missingFields: [] };
        }

        const requiredFields = process.stageRequirements[currentValue] || [];
        
        if (requiredFields.length === 0) {
          return { canMove: true, missingFields: [] };
        }

        // Get schema to know field names
        const schema = useSchemaStore.getState().getSchema("deals");
        const missingFields: { fieldKey: string; fieldName: string }[] = [];

        requiredFields.forEach((fieldKey) => {
          const value = deal[fieldKey];
          const column = schema?.columns.find((c) => c.id === fieldKey);
          const fieldName = column?.name || fieldKey;

          // Check if field is filled based on type
          let isFilled = false;

          if (value === undefined || value === null) {
            isFilled = false;
          } else if (typeof value === "string") {
            isFilled = value.trim() !== "";
          } else if (typeof value === "number") {
            isFilled = true; // 0 is valid
          } else if (Array.isArray(value)) {
            isFilled = value.length > 0;
          } else if (typeof value === "boolean") {
            isFilled = true; // true or false is valid
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
        
        // No active process = all transitions allowed
        if (!process) {
          return { allowed: true };
        }

        // If no transitions defined, all are allowed
        if (process.transitions.length === 0) {
          return { allowed: true };
        }

        // Check if transition exists
        const transitionExists = process.transitions.some(
          (t) => t.from === fromValue && t.to === toValue
        );

        if (!transitionExists) {
          // Get labels for better error message
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

      // Unified validation API - the single gateway for all select field changes
      canChangeSelectField: ({ deal, fieldKey, fromValue, toValue }) => {
        devLog(`=== VALIDATION START ===`);
        devLog(`Field: ${fieldKey}`);
        devLog(`From: "${fromValue}" -> To: "${toValue}"`);
        
        // Same value = no change needed
        if (fromValue === toValue) {
          devLog(`Same value, allowing`);
          return {
            ok: true,
            missingFields: [],
            transitionBlocked: false,
            message: "",
          };
        }
        
        const { enforcementEnabled, activeProcessByField, processes } = get();
        
        devLog(`Enforcement enabled: ${enforcementEnabled}`);
        devLog(`Active process map:`, activeProcessByField);
        
        if (!enforcementEnabled) {
          devLog(`Enforcement disabled, allowing change`);
          return {
            ok: true,
            missingFields: [],
            transitionBlocked: false,
            message: "",
          };
        }
        
        const activeProcessId = activeProcessByField[fieldKey];
        devLog(`Active process ID for ${fieldKey}: ${activeProcessId || 'NONE'}`);
        
        if (!activeProcessId) {
          devLog(`No active process for field, allowing change`);
          return {
            ok: true,
            missingFields: [],
            transitionBlocked: false,
            message: "",
          };
        }
        
        const process = processes.find((p) => p.id === activeProcessId);
        devLog(`Process found: ${process?.name || 'NOT FOUND'}`);
        devLog(`Process enabled: ${process?.enabled}`);
        
        if (!process || !process.enabled) {
          devLog(`Process not found or disabled, allowing change`);
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

        // 1. Validate exit requirements (can we leave the current stage?)
        const requiredFields = process.stageRequirements[fromValue] || [];
        devLog(`Required fields for stage "${fromValue}":`, requiredFields);
        
        if (requiredFields.length > 0) {
          const schema = useSchemaStore.getState().getSchema("deals");
          const missingFields: { fieldKey: string; fieldLabel: string }[] = [];

          requiredFields.forEach((reqFieldKey) => {
            const value = deal[reqFieldKey];
            const column = schema?.columns.find((c) => c.id === reqFieldKey);
            const fieldLabel = column?.name || reqFieldKey;

            // Check if field is filled based on type
            let isFilled = false;

            if (value === undefined || value === null) {
              isFilled = false;
            } else if (typeof value === "string") {
              isFilled = value.trim() !== "";
            } else if (typeof value === "number") {
              isFilled = true; // 0 is valid
            } else if (Array.isArray(value)) {
              isFilled = value.length > 0;
            } else if (typeof value === "boolean") {
              isFilled = true; // true or false is valid
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

        // 2. Validate transition (is this transition allowed?)
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
    }),
    {
      name: "crm_processes_v1",
    }
  )
);
