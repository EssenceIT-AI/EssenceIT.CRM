import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ColumnDefinition, SavedView, TableSchema } from "@/types";
import { allSchemas } from "@/mocks/schemas";

interface SchemaState {
  schemas: Record<string, TableSchema>;
  savedViews: SavedView[];
  
  // Schema actions
  getSchema: (tableId: string) => TableSchema | null;
  updateColumnVisibility: (tableId: string, columnId: string, visible: boolean) => void;
  reorderColumns: (tableId: string, columnIds: string[]) => void;
  addColumn: (tableId: string, column: ColumnDefinition) => void;
  updateColumn: (tableId: string, columnId: string, updates: Partial<ColumnDefinition>) => void;
  deleteColumn: (tableId: string, columnId: string) => void;
  
  // View actions
  saveView: (view: SavedView) => void;
  deleteView: (viewId: string) => void;
  getViewsForTable: (tableId: string) => SavedView[];
  
  // Reset
  resetSchemas: () => void;
}

// Merge stored schemas with default schemas to ensure new schemas are always available
const mergeSchemas = (storedSchemas: Record<string, TableSchema>): Record<string, TableSchema> => {
  const merged: Record<string, TableSchema> = { ...allSchemas };
  
  // Override with stored schemas where they exist
  for (const [key, storedSchema] of Object.entries(storedSchemas)) {
    if (storedSchema && allSchemas[key]) {
      // Merge columns - keep stored customizations but add new default columns
      const defaultColumns = allSchemas[key].columns;
      const storedColumns = storedSchema.columns;
      
      // Create a map of stored columns by id
      const storedColumnMap = new Map(storedColumns.map(col => [col.id, col]));
      
      // Merge: use stored column if exists, otherwise use default
      const mergedColumns = defaultColumns.map(defaultCol => {
        const storedCol = storedColumnMap.get(defaultCol.id);
        if (storedCol) {
          // Preserve stored customizations but merge with default options/settings
          return {
            ...defaultCol,
            ...storedCol,
            // Always use latest options from defaults
            options: defaultCol.options,
          };
        }
        return defaultCol;
      });
      
      // Add any custom columns that were added by user (not in defaults)
      const defaultColumnIds = new Set(defaultColumns.map(col => col.id));
      const customColumns = storedColumns.filter(col => !defaultColumnIds.has(col.id));
      
      merged[key] = {
        ...allSchemas[key],
        columns: [...mergedColumns, ...customColumns],
      };
    }
  }
  
  return merged;
};

export const useSchemaStore = create<SchemaState>()(
  persist(
    (set, get) => ({
      schemas: allSchemas,
      savedViews: [],

      getSchema: (tableId) => {
        const schema = get().schemas[tableId];
        if (!schema) {
          // Fallback to default schema if not in store
          return allSchemas[tableId] || null;
        }
        return schema;
      },

      updateColumnVisibility: (tableId, columnId, visible) => {
        set((state) => {
          const schema = state.schemas[tableId] || allSchemas[tableId];
          if (!schema) return state;

          const updatedColumns = schema.columns.map((col) =>
            col.id === columnId ? { ...col, visible } : col
          );

          return {
            schemas: {
              ...state.schemas,
              [tableId]: { ...schema, columns: updatedColumns },
            },
          };
        });
      },

      reorderColumns: (tableId, columnIds) => {
        set((state) => {
          const schema = state.schemas[tableId] || allSchemas[tableId];
          if (!schema) return state;

          const updatedColumns = schema.columns.map((col) => ({
            ...col,
            order: columnIds.indexOf(col.id),
          }));

          return {
            schemas: {
              ...state.schemas,
              [tableId]: { ...schema, columns: updatedColumns },
            },
          };
        });
      },

      addColumn: (tableId, column) => {
        set((state) => {
          const schema = state.schemas[tableId] || allSchemas[tableId];
          if (!schema) return state;

          const maxOrder = Math.max(...schema.columns.map((c) => c.order), -1);
          const newColumn = { ...column, order: maxOrder + 1 };

          return {
            schemas: {
              ...state.schemas,
              [tableId]: {
                ...schema,
                columns: [...schema.columns, newColumn],
              },
            },
          };
        });
      },

      updateColumn: (tableId, columnId, updates) => {
        set((state) => {
          const schema = state.schemas[tableId] || allSchemas[tableId];
          if (!schema) return state;

          const updatedColumns = schema.columns.map((col) =>
            col.id === columnId ? { ...col, ...updates } : col
          );

          return {
            schemas: {
              ...state.schemas,
              [tableId]: { ...schema, columns: updatedColumns },
            },
          };
        });
      },

      deleteColumn: (tableId, columnId) => {
        set((state) => {
          const schema = state.schemas[tableId] || allSchemas[tableId];
          if (!schema) return state;

          const updatedColumns = schema.columns.filter(
            (col) => col.id !== columnId
          );

          return {
            schemas: {
              ...state.schemas,
              [tableId]: { ...schema, columns: updatedColumns },
            },
          };
        });
      },

      saveView: (view) => {
        set((state) => {
          const existingIndex = state.savedViews.findIndex(
            (v) => v.id === view.id
          );
          if (existingIndex >= 0) {
            const updatedViews = [...state.savedViews];
            updatedViews[existingIndex] = view;
            return { savedViews: updatedViews };
          }
          return { savedViews: [...state.savedViews, view] };
        });
      },

      deleteView: (viewId) => {
        set((state) => ({
          savedViews: state.savedViews.filter((v) => v.id !== viewId),
        }));
      },

      getViewsForTable: (tableId) => {
        return get().savedViews.filter((v) => v.tableId === tableId);
      },

      resetSchemas: () => {
        set({ schemas: allSchemas, savedViews: [] });
      },
    }),
    {
      name: "crm-schemas",
      // Merge stored schemas with default schemas on rehydration
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.schemas = mergeSchemas(state.schemas);
        }
      },
    }
  )
);
