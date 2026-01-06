import { useMemo, useState, useCallback } from "react";
import { ColumnOption } from "@/types";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard, KanbanDeal } from "./KanbanCard";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCenter,
} from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { useProcessStore } from "@/stores/processStore";
import { toast } from "sonner";

interface KanbanBoardProps {
  deals: KanbanDeal[];
  options: ColumnOption[];
  columnOrder: string[];
  selectedColumnId: string;
  getCompanyName: (id: string) => string | undefined;
  getOwnerName: (id: string) => string | undefined;
  onDealMove: (dealId: string, newValue: string) => void;
  onColumnReorder: (newOrder: string[]) => void;
}

export const KanbanBoard = ({
  deals,
  options,
  columnOrder,
  selectedColumnId,
  getCompanyName,
  getOwnerName,
  onDealMove,
  onColumnReorder,
}: KanbanBoardProps) => {
  const [activeDealId, setActiveDealId] = useState<string | null>(null);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);

  // Use the unified validation API
  const { canChangeSelectField } = useProcessStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // Sort options by columnOrder
  const sortedOptions = useMemo(() => {
    const orderMap = new Map(columnOrder.map((v, i) => [v, i]));
    return [...options].sort((a, b) => {
      const orderA = orderMap.get(a.value) ?? 999;
      const orderB = orderMap.get(b.value) ?? 999;
      return orderA - orderB;
    });
  }, [options, columnOrder]);

  // Group deals by the selected column's value
  const dealsByOption = useMemo(() => {
    const grouped: Record<string, KanbanDeal[]> = {};
    sortedOptions.forEach((opt) => {
      grouped[opt.value] = [];
    });
    deals.forEach((deal) => {
      const value = (deal as any)[selectedColumnId];
      if (grouped[value]) {
        grouped[value].push(deal);
      }
    });
    return grouped;
  }, [deals, sortedOptions, selectedColumnId]);

  const getAgeDays = useCallback((deal: KanbanDeal) => {
    const created = new Date(deal.createdAt || new Date());
    const now = new Date();
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  }, []);

  const activeDeal = useMemo(() => {
    if (!activeDealId) return null;
    return deals.find((d) => d.id === activeDealId);
  }, [activeDealId, deals]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current;

    if (data?.type === "column-header") {
      setActiveColumnId(data.optionValue);
    } else {
      setActiveDealId(active.id as string);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDealId(null);
    setActiveColumnId(null);

    if (!over) return;

    const activeData = active.data.current;

    // Handle column header reordering
    if (activeData?.type === "column-header") {
      const overData = over.data.current;
      if (overData?.type === "column-header" || overData?.type === "column") {
        const targetValue = overData.optionValue;
        const sourceValue = activeData.optionValue;

        if (sourceValue !== targetValue) {
          const currentOrder = [...columnOrder];
          const sourceIndex = currentOrder.indexOf(sourceValue);
          const targetIndex = currentOrder.indexOf(targetValue);

          if (sourceIndex !== -1 && targetIndex !== -1) {
            currentOrder.splice(sourceIndex, 1);
            currentOrder.splice(targetIndex, 0, sourceValue);
            onColumnReorder(currentOrder);
          }
        }
      }
      return;
    }

    // Handle deal card movement
    const dealId = active.id as string;
    const overId = over.id as string;

    // Check if dropped on a column
    if (overId.startsWith("column-")) {
      const newValue = overId.replace("column-", "");
      const deal = deals.find((d) => d.id === dealId);
      
      if (deal) {
        const currentValue = (deal as any)[selectedColumnId];
        
        // Don't process if same column
        if (currentValue === newValue) return;

        // Use the unified validation API
        // The selectedColumnId is the field key being changed (dynamic, not hardcoded)
        const validation = canChangeSelectField({
          deal: deal as unknown as Record<string, unknown>,
          fieldKey: selectedColumnId,
          fromValue: currentValue,
          toValue: newValue,
        });

        if (!validation.ok) {
          if (validation.transitionBlocked) {
            toast.error("Transição não permitida", {
              description: validation.message,
              duration: 5000,
            });
          } else {
            toast.error("Não é possível mover este negócio", {
              description: validation.message,
              duration: 5000,
            });
          }
          return;
        }

        onDealMove(dealId, newValue);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 pt-2">
        {sortedOptions.map((option, index) => (
          <KanbanColumn
            key={option.value}
            option={option}
            deals={dealsByOption[option.value] || []}
            getCompanyName={getCompanyName}
            getOwnerName={getOwnerName}
            getAgeDays={getAgeDays}
            isColumnDragging={!!activeColumnId}
            columnIndex={index}
          />
        ))}
      </div>

      {/* Drag overlay for cards */}
      <DragOverlay>
        {activeDeal && (
          <div className="opacity-90">
            <KanbanCard
              deal={activeDeal}
              companyName={getCompanyName(activeDeal.companyId || "")}
              ownerName={getOwnerName(activeDeal.ownerId || "")}
              ageDays={getAgeDays(activeDeal)}
              isAtRisk={getAgeDays(activeDeal) > 14}
            />
          </div>
        )}
        {activeColumnId && (
          <div className="w-72 h-12 bg-muted/80 rounded-lg border-2 border-dashed border-primary/50 flex items-center justify-center">
            <span className="text-sm font-medium text-muted-foreground">
              Movendo coluna...
            </span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};
