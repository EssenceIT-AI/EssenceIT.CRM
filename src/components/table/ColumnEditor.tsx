import { useState } from "react";
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
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useSchemaStore } from "@/stores";
import { ColumnDefinition, ColumnType } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  GripVertical,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  X,
  Pencil,
  Settings2,
} from "lucide-react";
import { ColumnEditDialog } from "./ColumnEditDialog";

interface ColumnEditorProps {
  tableId: string;
  onClose: () => void;
  existingData?: Record<string, unknown[]>;
}

const columnTypes: { value: ColumnType; label: string }[] = [
  { value: "text", label: "Texto" },
  { value: "number", label: "Número" },
  { value: "currency", label: "Moeda (R$)" },
  { value: "select", label: "Select" },
  { value: "multi-select", label: "Multi-select" },
  { value: "date", label: "Data" },
  { value: "boolean", label: "Sim/Não" },
  { value: "relation", label: "Relação" },
];

const SortableColumnItem = ({
  column,
  onToggleVisibility,
  onDelete,
  onEdit,
}: {
  column: ColumnDefinition;
  onToggleVisibility: () => void;
  onDelete: () => void;
  onEdit: () => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const typeLabel = columnTypes.find(t => t.value === column.type)?.label || column.type;
  const optionsCount = column.options?.length || 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border border-border bg-card",
        isDragging && "opacity-50 shadow-lg",
        !column.visible && "opacity-60"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate">{column.name}</p>
          {column.required && (
            <span className="text-xs text-destructive">*</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{typeLabel}</span>
          {optionsCount > 0 && (
            <span className="text-primary">({optionsCount} opções)</span>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onEdit}
          title="Editar coluna"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onToggleVisibility}
          title={column.visible ? "Ocultar" : "Exibir"}
        >
          {column.visible ? (
            <Eye className="h-4 w-4 text-primary" />
          ) : (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
        
        {!column.required && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={onDelete}
            title="Excluir coluna"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export const ColumnEditor = ({ tableId, onClose, existingData = {} }: ColumnEditorProps) => {
  const { getSchema, updateColumnVisibility, reorderColumns, addColumn, updateColumn, deleteColumn } = useSchemaStore();
  
  const schema = getSchema(tableId);
  const columns = schema?.columns.sort((a, b) => a.order - b.order) || [];
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<ColumnDefinition | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = columns.findIndex(col => col.id === active.id);
      const newIndex = columns.findIndex(col => col.id === over.id);
      
      const newOrder = arrayMove(columns, oldIndex, newIndex);
      reorderColumns(tableId, newOrder.map(col => col.id));
    }
  };

  const handleAddColumn = () => {
    setEditingColumn(null);
    setEditDialogOpen(true);
  };

  const handleEditColumn = (column: ColumnDefinition) => {
    setEditingColumn(column);
    setEditDialogOpen(true);
  };

  const handleSaveColumn = (column: ColumnDefinition) => {
    if (editingColumn) {
      updateColumn(tableId, column.id, column);
    } else {
      addColumn(tableId, column);
    }
  };

  const getExistingValues = (columnId: string): unknown[] => {
    return existingData[columnId] || [];
  };

  return (
    <>
      <div className="mb-4 p-4 rounded-lg border border-border bg-card animate-in-up">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Configurar Colunas</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={handleAddColumn}>
              <Plus className="h-4 w-4" />
              Nova Coluna
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={columns.map(col => col.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {columns.map((column) => (
                <SortableColumnItem
                  key={column.id}
                  column={column}
                  onToggleVisibility={() => 
                    updateColumnVisibility(tableId, column.id, !column.visible)
                  }
                  onDelete={() => deleteColumn(tableId, column.id)}
                  onEdit={() => handleEditColumn(column)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <div className="mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
          <p>Arraste para reordenar • Clique no lápis para editar • Use o olho para mostrar/ocultar</p>
        </div>
      </div>

      <ColumnEditDialog
        column={editingColumn}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSaveColumn}
        existingValues={editingColumn ? getExistingValues(editingColumn.id) : []}
      />
    </>
  );
};
