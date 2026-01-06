import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, Target, DollarSign, Percent, Clock, Ticket, MoreVertical, Settings2, Copy, Trash2 } from "lucide-react";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/dashboardHelpers";
import { WidgetConfig } from "@/stores/dashboardStore";
import { useState } from "react";
import { WidgetConfigModal } from "./WidgetConfigModal";
import { WidgetSizeMenu } from "./WidgetSizeMenu";

interface KpiCardProps {
  title: string;
  value: number;
  type: "currency" | "percent" | "days" | "number";
  change?: number;
  changeLabel?: string;
  target?: number;
  icon?: "target" | "dollar" | "percent" | "clock" | "ticket";
  className?: string;
  widget?: WidgetConfig;
  canEdit?: boolean;
  onEdit?: (config: WidgetConfig) => void;
  onDuplicate?: () => void;
  onRemove?: () => void;
  onSizeChange?: (colSpan: number) => void;
}

const icons = {
  target: Target,
  dollar: DollarSign,
  percent: Percent,
  clock: Clock,
  ticket: Ticket,
};

export function KpiCard({
  title,
  value,
  type,
  change,
  changeLabel,
  target,
  icon = "dollar",
  className,
  widget,
  canEdit = true,
  onEdit,
  onDuplicate,
  onRemove,
  onSizeChange,
}: KpiCardProps) {
  const Icon = icons[icon];
  const [editModalOpen, setEditModalOpen] = useState(false);

  const formattedValue = (() => {
    switch (type) {
      case "currency":
        return formatCurrency(value);
      case "percent":
        return formatPercent(value);
      case "days":
        return `${Math.round(value)} dias`;
      default:
        return formatNumber(value);
    }
  })();

  const trend = change !== undefined ? (change > 0 ? "up" : change < 0 ? "down" : "neutral") : undefined;
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  const progressPercent = target ? Math.min((value / target) * 100, 100) : undefined;

  const handleEditSave = (config: WidgetConfig) => {
    if (onEdit) {
      onEdit(config);
    }
    setEditModalOpen(false);
  };

  const showMenu = canEdit && (onEdit || onDuplicate || onRemove);

  return (
    <>
      <Card className={cn("relative overflow-hidden h-full", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 pt-3 px-4">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-center gap-1">
            <div className="rounded-full p-1.5 bg-primary/10">
              <Icon className="h-3.5 w-3.5 text-primary" />
            </div>
            {showMenu && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {widget && onEdit && (
                    <>
                      <DropdownMenuItem onClick={() => setEditModalOpen(true)}>
                        <Settings2 className="h-4 w-4 mr-2" />
                        Editar configuração
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {onSizeChange && widget && (
                    <>
                      <WidgetSizeMenu
                        currentLayout={widget.layout}
                        onSizeChange={onSizeChange}
                      />
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {onDuplicate && (
                    <DropdownMenuItem onClick={onDuplicate}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicar
                    </DropdownMenuItem>
                  )}
                  {onRemove && (
                    <DropdownMenuItem onClick={onRemove} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remover
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <p className="text-2xl font-bold tracking-tight">{formattedValue}</p>

          {/* Progress bar for target */}
          {target !== undefined && progressPercent !== undefined && (
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Meta: {type === "currency" ? formatCurrency(target) : formatNumber(target)}</span>
                <span>{formatPercent(progressPercent)}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    progressPercent >= 100 ? "bg-green-500" : progressPercent >= 75 ? "bg-primary" : "bg-amber-500"
                  )}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Change indicator */}
          {change !== undefined && (
            <div className="mt-3 flex items-center gap-1.5">
              <div
                className={cn(
                  "flex items-center gap-0.5 text-xs font-medium",
                  trend === "up" && "text-green-500",
                  trend === "down" && "text-red-500",
                  trend === "neutral" && "text-muted-foreground"
                )}
              >
                <TrendIcon className="h-3 w-3" />
                <span>{Math.abs(change).toFixed(1)}%</span>
              </div>
              {changeLabel && (
                <span className="text-xs text-muted-foreground">{changeLabel}</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {widget && (
        <WidgetConfigModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          widgetType={widget.type}
          initialConfig={widget}
          onSave={handleEditSave}
          mode="edit"
        />
      )}
    </>
  );
}
