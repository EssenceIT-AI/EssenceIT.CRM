import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { stageLabels, formatCurrency, formatNumber } from "@/lib/dashboardHelpers";
import { cn } from "@/lib/utils";
import { MoreVertical, Settings2, Copy, Trash2 } from "lucide-react";
import { WidgetConfig } from "@/stores/dashboardStore";
import { useState } from "react";
import { WidgetConfigModal } from "./WidgetConfigModal";
import { WidgetSizeMenu } from "./WidgetSizeMenu";

interface FunnelChartProps {
  title: string;
  data: { stage: string; count: number; value: number }[];
  className?: string;
  widget?: WidgetConfig;
  canEdit?: boolean;
  onEdit?: (config: WidgetConfig) => void;
  onDuplicate?: () => void;
  onRemove?: () => void;
  onSizeChange?: (colSpan: number) => void;
}

export function FunnelChart({ 
  title, 
  data, 
  className,
  widget,
  canEdit = true,
  onEdit,
  onDuplicate,
  onRemove,
  onSizeChange,
}: FunnelChartProps) {
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Filter only funnel stages (not won/lost)
  const funnelStages = ["prospecting", "qualification", "proposal", "negotiation", "closing"];
  const funnelData = data.filter((d) => funnelStages.includes(d.stage));

  const maxCount = Math.max(...funnelData.map((d) => d.count), 1);

  const handleEditSave = (config: WidgetConfig) => {
    if (onEdit) {
      onEdit(config);
    }
    setEditModalOpen(false);
  };

  const showMenu = canEdit && (onEdit || onDuplicate || onRemove);

  return (
    <>
      <Card className={cn("h-full", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          {showMenu && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {funnelData.map((item, index) => {
              const widthPercent = (item.count / maxCount) * 100;
              const conversionRate =
                index > 0 && funnelData[index - 1].count > 0
                  ? ((item.count / funnelData[index - 1].count) * 100).toFixed(0)
                  : null;

              return (
                <div key={item.stage} className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">
                      {stageLabels[item.stage] || item.stage}
                    </span>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-muted-foreground">
                        {formatNumber(item.count)} opp
                      </span>
                      <span className="font-medium">{formatCurrency(item.value)}</span>
                      {conversionRate && (
                        <span className="text-xs text-muted-foreground">
                          ({conversionRate}%)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-8 bg-muted rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-lg transition-all duration-500"
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
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
