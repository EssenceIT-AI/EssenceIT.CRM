import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ColumnDefinition, SortConfig } from "@/types";
import { cn } from "@/lib/utils";
import { ArrowUpDown, ArrowUp, ArrowDown, GripVertical } from "lucide-react";

interface TableHeaderProps {
  columns: ColumnDefinition[];
  sorting: SortConfig[];
  onSort: (columnId: string) => void;
}

const SortableHeaderCell = ({
  column,
  sortDirection,
  onSort,
}: {
  column: ColumnDefinition;
  sortDirection?: "asc" | "desc";
  onSort: () => void;
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

  return (
    <th
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-table-header border-b border-table-border",
        isDragging && "opacity-50 bg-secondary"
      )}
    >
      <div className="flex items-center gap-2">
        <button
          {...attributes}
          {...listeners}
          className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        
        <button
          onClick={onSort}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <span>{column.name}</span>
          {sortDirection === "asc" ? (
            <ArrowUp className="h-3 w-3 text-primary" />
          ) : sortDirection === "desc" ? (
            <ArrowDown className="h-3 w-3 text-primary" />
          ) : (
            <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
          )}
        </button>
      </div>
    </th>
  );
};

export const TableHeader = ({ columns, sorting, onSort }: TableHeaderProps) => {
  return (
    <thead className="sticky top-0 z-10">
      <tr>
        {columns.map(column => {
          const sortConfig = sorting.find(s => s.columnId === column.id);
          return (
            <SortableHeaderCell
              key={column.id}
              column={column}
              sortDirection={sortConfig?.direction}
              onSort={() => onSort(column.id)}
            />
          );
        })}
      </tr>
    </thead>
  );
};
