import { useSchemaStore } from "@/stores/schemaStore";
import { SelectFieldInfo } from "@/types/process";
import { ColumnDefinition } from "@/types";

/**
 * Get all select fields from the deals schema
 */
export function getDealsSelectFields(): SelectFieldInfo[] {
  const schema = useSchemaStore.getState().getSchema("deals");
  if (!schema) return [];

  return schema.columns
    .filter((col) => col.type === "select" && col.options && col.options.length > 0)
    .map((col) => ({
      key: col.id,
      label: col.name,
      options: col.options!.map((opt) => ({
        value: opt.value,
        label: opt.label,
        color: opt.color,
      })),
    }));
}

/**
 * Get a specific select field by key
 */
export function getDealsSelectField(fieldKey: string): SelectFieldInfo | undefined {
  const fields = getDealsSelectFields();
  return fields.find((f) => f.key === fieldKey);
}

/**
 * Get all editable fields from deals schema (for requirement configuration)
 */
export function getDealsEditableFields(): ColumnDefinition[] {
  const schema = useSchemaStore.getState().getSchema("deals");
  if (!schema) return [];

  // Exclude technical fields
  const excludeIds = ["id", "createdAt", "updatedAt"];

  return schema.columns.filter(
    (col) => !excludeIds.includes(col.id) && col.editable !== false
  );
}

/**
 * Check if an option exists in the current schema
 */
export function isOptionInSchema(fieldKey: string, optionValue: string): boolean {
  const field = getDealsSelectField(fieldKey);
  if (!field) return false;
  return field.options.some((opt) => opt.value === optionValue);
}

/**
 * Get option status for process editor
 */
export function getOptionStatus(
  fieldKey: string,
  optionValue: string,
  configuredOptions: string[]
): "configured" | "not-configured" | "obsolete" {
  const field = getDealsSelectField(fieldKey);
  if (!field) return "obsolete";

  const existsInSchema = field.options.some((opt) => opt.value === optionValue);
  
  if (!existsInSchema) {
    return "obsolete";
  }

  if (configuredOptions.includes(optionValue)) {
    return "configured";
  }

  return "not-configured";
}

/**
 * Merge current schema options with saved process options
 * Returns all options including new and obsolete ones
 */
export function mergeProcessOptions(
  fieldKey: string,
  savedOptionOrder: string[]
): {
  value: string;
  label: string;
  color?: string;
  status: "current" | "new" | "obsolete";
}[] {
  const field = getDealsSelectField(fieldKey);
  if (!field) return [];

  const schemaValues = new Set(field.options.map((opt) => opt.value));
  const savedValues = new Set(savedOptionOrder);

  const result: {
    value: string;
    label: string;
    color?: string;
    status: "current" | "new" | "obsolete";
  }[] = [];

  // Add saved options in order (marking obsolete ones)
  savedOptionOrder.forEach((value) => {
    const schemaOption = field.options.find((opt) => opt.value === value);
    if (schemaOption) {
      result.push({ ...schemaOption, status: "current" });
    } else {
      // Option no longer exists in schema
      result.push({ value, label: value, status: "obsolete" });
    }
  });

  // Add new options from schema that aren't in saved order
  field.options.forEach((opt) => {
    if (!savedValues.has(opt.value)) {
      result.push({ ...opt, status: "new" });
    }
  });

  return result;
}
