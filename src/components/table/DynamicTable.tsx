import { useState, useCallback, useMemo, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSchemaStore, useNegociosStore, useCompaniesStore, useContactsStore } from "@/stores";
import { useOrganizationStore } from "@/stores/organizationStore";
import { TableRow, FilterConfig, SortConfig } from "@/types";
import { TableHeader } from "./TableHeader";
import { TableBody } from "./TableBody";
import { ColumnEditor } from "./ColumnEditor";
import { TableToolbar } from "./TableToolbar";
import { PropertyDrawer } from "./PropertyDrawer";
import { cn } from "@/lib/utils";

interface DynamicTableProps {
  tableId: string;
  className?: string;
  onRowClick?: (row: TableRow) => void;
  showPropertyDrawer?: boolean;
}

export const DynamicTable = ({ 
  tableId, 
  className, 
  onRowClick,
  showPropertyDrawer = true 
}: DynamicTableProps) => {
  const { getSchema, reorderColumns } = useSchemaStore();
  const { activeOrganizationId } = useOrganizationStore();
  
  // Get data from appropriate store based on tableId
  const negociosStore = useNegociosStore();
  const companiesStore = useCompaniesStore();
  const contactsStore = useContactsStore();
  
  const schema = getSchema(tableId);
  
  // Get data based on tableId
  const getData = useCallback((): TableRow[] => {
    switch (tableId) {
      case "deals":
      case "negocios":
        return negociosStore.asTableRows() as TableRow[];
      case "companies":
        return companiesStore.asTableRows() as TableRow[];
      case "contacts":
        return contactsStore.asTableRows() as TableRow[];
      default:
        return [];
    }
  }, [tableId, negociosStore, companiesStore, contactsStore]);

  // Update row handler based on tableId
  const handleUpdateRow = useCallback(async (rowId: string, updates: Record<string, unknown>) => {
    try {
      switch (tableId) {
        case "deals":
        case "negocios":
          await negociosStore.updateNegocio(rowId, {
            title: updates.title as string | undefined,
            value: updates.value as number | undefined,
            props: updates as Record<string, unknown>,
          });
          break;
        case "companies":
          await companiesStore.updateCompany(rowId, {
            name: updates.name as string | undefined,
            domain: updates.domain as string | null | undefined,
            industry: updates.industry as string | null | undefined,
            size: updates.size as string | null | undefined,
            country: updates.country as string | null | undefined,
            city: updates.city as string | null | undefined,
            props: updates as Record<string, unknown>,
          });
          break;
        case "contacts":
          await contactsStore.updateContact(rowId, {
            first_name: updates.firstName as string | undefined,
            last_name: updates.lastName as string | null | undefined,
            email: updates.email as string | null | undefined,
            phone: updates.phone as string | null | undefined,
            company_id: updates.companyId as string | null | undefined,
            position: updates.position as string | null | undefined,
            props: updates as Record<string, unknown>,
          });
          break;
      }
    } catch (error) {
      console.error("Error updating row:", error);
    }
  }, [tableId, negociosStore, companiesStore, contactsStore]);

  const data = getData();
  
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [sorting, setSorting] = useState<SortConfig[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showColumnEditor, setShowColumnEditor] = useState(false);
  const [editingCell, setEditingCell] = useState<{ rowId: string; columnId: string } | null>(null);
  const [selectedRow, setSelectedRow] = useState<TableRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Get visible columns sorted by order
  const visibleColumns = schema?.columns
    .filter(col => col.visible)
    .sort((a, b) => a.order - b.order) || [];

  const allColumns = schema?.columns.sort((a, b) => a.order - b.order) || [];
  
  // Build existing data map for column editor
  const existingDataMap = useMemo(() => {
    const map: Record<string, unknown[]> = {};
    allColumns.forEach(col => {
      map[col.id] = data.map(row => row[col.id]).filter(v => v !== undefined && v !== null);
    });
    return map;
  }, [data, allColumns]);

  // Filter and sort data
  const processedData = useCallback(() => {
    let result = [...data];
    
    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(row => 
        Object.values(row).some(value => 
          String(value).toLowerCase().includes(term)
        )
      );
    }
    
    // Apply filters
    filters.forEach(filter => {
      result = result.filter(row => {
        const value = row[filter.columnId];
        switch (filter.operator) {
          case "equals":
            return value === filter.value;
          case "contains":
            return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
          case "gt":
            return Number(value) > Number(filter.value);
          case "lt":
            return Number(value) < Number(filter.value);
          case "gte":
            return Number(value) >= Number(filter.value);
          case "lte":
            return Number(value) <= Number(filter.value);
          case "isEmpty":
            return value === null || value === undefined || value === "";
          case "isNotEmpty":
            return value !== null && value !== undefined && value !== "";
          default:
            return true;
        }
      });
    });
    
    // Apply sorting
    if (sorting.length > 0) {
      result.sort((a, b) => {
        for (const sort of sorting) {
          const aVal = a[sort.columnId];
          const bVal = b[sort.columnId];
          
          if (aVal === bVal) continue;
          
          const comparison = aVal < bVal ? -1 : 1;
          return sort.direction === "asc" ? comparison : -comparison;
        }
        return 0;
      });
    }
    
    return result;
  }, [data, searchTerm, filters, sorting]);
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = visibleColumns.findIndex(col => col.id === active.id);
      const newIndex = visibleColumns.findIndex(col => col.id === over.id);
      
      const newOrder = arrayMove(visibleColumns, oldIndex, newIndex);
      reorderColumns(tableId, newOrder.map(col => col.id));
    }
  };
  
  const handleCellEdit = (rowId: string, columnId: string, value: unknown) => {
    handleUpdateRow(rowId, { [columnId]: value });
    setEditingCell(null);
  };
  
  const handleSort = (columnId: string) => {
    setSorting(prev => {
      const existing = prev.find(s => s.columnId === columnId);
      if (!existing) {
        return [{ columnId, direction: "asc" }];
      }
      if (existing.direction === "asc") {
        return [{ columnId, direction: "desc" }];
      }
      return [];
    });
  };

  const handleRowClick = (row: TableRow) => {
    if (showPropertyDrawer) {
      setSelectedRow(row);
      setDrawerOpen(true);
    }
    onRowClick?.(row);
  };

  const handleDrawerSave = (rowId: string, updates: Record<string, unknown>) => {
    handleUpdateRow(rowId, updates);
    // Update local selected row to reflect changes
    setSelectedRow(prev => prev ? { ...prev, ...updates } : null);
  };
  
  if (!schema) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Schema não encontrado para: {tableId}
      </div>
    );
  }
  
  const rows = processedData();
  
  return (
    <>
      <div className={cn("flex flex-col h-full", className)}>
        <TableToolbar
          tableId={tableId}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filters={filters}
          onFiltersChange={setFilters}
          onToggleColumnEditor={() => setShowColumnEditor(!showColumnEditor)}
          totalRows={data.length}
          filteredRows={rows.length}
        />
        
        {showColumnEditor && (
          <ColumnEditor
            tableId={tableId}
            onClose={() => setShowColumnEditor(false)}
            existingData={existingDataMap}
          />
        )}
        
        <div className="flex-1 overflow-auto rounded-lg border border-border bg-card">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <table className="w-full border-collapse">
              <SortableContext
                items={visibleColumns.map(col => col.id)}
                strategy={horizontalListSortingStrategy}
              >
                <TableHeader
                  columns={visibleColumns}
                  sorting={sorting}
                  onSort={handleSort}
                />
              </SortableContext>
              <TableBody
                columns={visibleColumns}
                rows={rows}
                tableId={tableId}
                editingCell={editingCell}
                onCellClick={(rowId, columnId) => setEditingCell({ rowId, columnId })}
                onCellEdit={handleCellEdit}
                onRowClick={handleRowClick}
              />
            </table>
          </DndContext>
        </div>
      </div>

      {showPropertyDrawer && (
        <PropertyDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          tableId={tableId}
          row={selectedRow}
          columns={allColumns}
          onSave={handleDrawerSave}
        />
      )}
    </>
  );
};
