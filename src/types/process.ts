// Process types for workflow management

export interface ProcessTransition {
  from: string;
  to: string;
}

export interface Process {
  id: string;
  name: string;
  enabled: boolean;
  selectFieldKey: string; // key of the select field this process governs (e.g., "stage", "origin")
  selectFieldLabel: string; // human-readable label
  optionOrder: string[]; // order of options/stages displayed
  transitions: ProcessTransition[];
  stageRequirements: Record<string, string[]>; // optionValue -> required field keys
  createdAt: string;
  updatedAt: string;
}

export interface ActiveProcessMap {
  [selectFieldKey: string]: string; // selectFieldKey -> processId
}

// Validation result for process requirements
export interface ProcessValidationResult {
  canMove: boolean;
  missingFields: {
    fieldKey: string;
    fieldName: string;
  }[];
  message?: string;
}

// Select field info from schema
export interface SelectFieldInfo {
  key: string;
  label: string;
  options: {
    value: string;
    label: string;
    color?: string;
  }[];
}
