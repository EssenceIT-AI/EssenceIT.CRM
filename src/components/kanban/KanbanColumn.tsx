import { ColumnOption } from "@/types";
import { KanbanCard, KanbanDeal } from "./KanbanCard";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { GripVertical } from "lucide-react";
import { CSS } from "@dnd-kit/utilities";

interface KanbanColumnProps {
  option: ColumnOption;
  deals: KanbanDeal[];
  getCompanyName: (id: string) => string | undefined;
  getOwnerName: (id: string) => string | undefined;
  getAgeDays: (deal: KanbanDeal) => number;
  isColumnDragging?: boolean;
  columnIndex: number;
}

export const KanbanColumn = ({
  option,
  deals,
  getCompanyName,
  getOwnerName,
  getAgeDays,
  isColumnDragging,
  columnIndex,
}: KanbanColumnProps) => {
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `column-${option.value}`,
    data: { optionValue: option.value, type: "column" },
  });

  const {
    attributes,
    listeners,
    setNodeRef: setDraggableRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `column-header-${option.value}`,
    data: { optionValue: option.value, type: "column-header", columnIndex },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const totalValue = deals.reduce((sum, d) => sum + (d.value ?? 0), 0);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact" }).format(value);

  return (
    <div
      ref={setDraggableRef}
      style={style}
      className={cn(
        "flex-shrink-0 w-72 bg-muted/30 rounded-xl flex flex-col",
        isDragging && "opacity-50",
        isColumnDragging && "transition-transform duration-200"
      )}
    >
      {/* Column Header - Draggable for reordering */}
      <div
        className={cn(
          "flex items-center justify-between p-3 rounded-t-xl",
          "bg-muted/50 border-b border-border"
        )}
      >
        <div className="flex items-center gap-2 flex-1">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing hover:bg-muted rounded p-0.5"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: option.color || "#64748b" }}
          />
          <span className="font-semibold text-sm truncate">{option.label}</span>
          <span className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">
            {deals.length}
          </span>
        </div>
        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
          {formatCurrency(totalValue)}
        </span>
      </div>

      {/* Drop area for cards */}
      <div
        ref={setDroppableRef}
        className={cn(
          "flex-1 p-2 space-y-2 min-h-[200px] overflow-y-auto",
          "transition-colors duration-200",
          isOver && "bg-primary/5 ring-2 ring-primary/20 ring-inset rounded-b-xl"
        )}
      >
        {deals.map((deal) => {
          const ageDays = getAgeDays(deal);
          const isAtRisk = ageDays > 14;

          return (
            <KanbanCard
              key={deal.id}
              deal={deal}
              companyName={getCompanyName(deal.companyId || "")}
              ownerName={getOwnerName(deal.ownerId || "")}
              ageDays={ageDays}
              isAtRisk={isAtRisk}
            />
          );
        })}
        {deals.length === 0 && (
          <div className="flex items-center justify-center h-24 text-sm text-muted-foreground border-2 border-dashed border-muted rounded-lg">
            Arraste cards aqui
          </div>
        )}
      </div>
    </div>
  );
};
