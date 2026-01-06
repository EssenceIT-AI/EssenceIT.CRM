import { TableRow } from "@/types";
import { Building2, User, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Generic deal type for Kanban
export interface KanbanDeal extends TableRow {
  name?: string;
  value?: number;
  ownerId?: string;
  companyId?: string;
  createdAt?: string;
  product?: string;
}

interface KanbanCardProps {
  deal: KanbanDeal;
  companyName?: string;
  ownerName?: string;
  ageDays: number;
  isAtRisk: boolean;
}

export const KanbanCard = ({ deal, companyName, ownerName, ageDays, isAtRisk }: KanbanCardProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
    data: { deal },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact" }).format(value);

  const dealName = deal.name || String(deal.title || deal.id);
  const dealValue = deal.value ?? 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "bg-card border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing",
        "hover:border-primary/50 hover:shadow-md transition-all duration-200",
        isDragging && "opacity-50 shadow-lg ring-2 ring-primary",
        isAtRisk && "border-l-4 border-l-destructive"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-medium text-sm text-foreground line-clamp-2 flex-1">
          {dealName}
        </h4>
        {isAtRisk && (
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Negócio em risco: {ageDays} dias sem atividade</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      <div className="space-y-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Building2 className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{companyName || "—"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <User className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{ownerName || "—"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 flex-shrink-0" />
          <span>{ageDays} dias</span>
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-border flex items-center justify-between">
        <span className="font-semibold text-sm text-primary">
          {formatCurrency(dealValue)}
        </span>
        {deal.product && (
          <Badge variant="secondary" className="text-xs">
            {deal.product}
          </Badge>
        )}
      </div>
    </div>
  );
};
