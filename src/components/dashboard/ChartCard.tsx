import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Download, Image, ExternalLink, Settings2, Copy, Trash2, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactNode, useId, useState } from "react";
import { exportToCSV, exportToPNG, buildDrillDownUrl } from "@/lib/dashboardHelpers";
import { useNavigate } from "react-router-dom";
import { WidgetConfig } from "@/stores/dashboardStore";
import { WidgetConfigModal } from "./WidgetConfigModal";
import { Badge } from "@/components/ui/badge";
import { WidgetSizeMenu } from "./WidgetSizeMenu";

interface ChartCardProps {
  title: string;
  children: ReactNode;
  widget?: WidgetConfig;
  data?: Record<string, unknown>[];
  dataKey?: "count" | "value";
  onDataKeyChange?: (key: "count" | "value") => void;
  drillDownParams?: Record<string, string | undefined>;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  onEdit?: (config: WidgetConfig) => void;
  onDuplicate?: () => void;
  onRemove?: () => void;
  onSizeChange?: (colSpan: number) => void;
  canEdit?: boolean;
}

export function ChartCard({
  title,
  children,
  widget,
  data,
  drillDownParams,
  className,
  onEdit,
  onDuplicate,
  onRemove,
  onSizeChange,
  canEdit = true,
}: ChartCardProps) {
  const chartId = useId();
  const navigate = useNavigate();
  const [editModalOpen, setEditModalOpen] = useState(false);

  const hasLocalFilters = widget?.localFilters && (
    (widget.localFilters.origins?.length ?? 0) > 0 ||
    (widget.localFilters.products?.length ?? 0) > 0 ||
    (widget.localFilters.owners?.length ?? 0) > 0 ||
    widget.localFilters.dateRange?.from ||
    widget.localFilters.dateRange?.to
  );

  const handleExportCSV = () => {
    if (data) {
      exportToCSV(data, title.toLowerCase().replace(/\s+/g, "-"));
    }
  };

  const handleExportPNG = () => {
    exportToPNG(`chart-${chartId}`, title.toLowerCase().replace(/\s+/g, "-"));
  };

  const handleDrillDown = () => {
    if (drillDownParams) {
      navigate(buildDrillDownUrl(drillDownParams));
    }
  };

  const handleEditSave = (config: WidgetConfig) => {
    if (onEdit) {
      onEdit(config);
    }
    setEditModalOpen(false);
  };

  return (
    <>
      <Card className={cn("h-full", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-medium">{title}</CardTitle>
            {hasLocalFilters && (
              <Badge variant="secondary" className="text-xs gap-1">
                <Filter className="h-3 w-3" />
                Filtros locais
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canEdit && widget && widget.type !== "kpi" && widget.type !== "table" && (
                  <>
                    <DropdownMenuItem onClick={() => setEditModalOpen(true)}>
                      <Settings2 className="h-4 w-4 mr-2" />
                      Editar eixos
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {canEdit && onSizeChange && widget && (
                  <>
                    <WidgetSizeMenu
                      currentLayout={widget.layout}
                      onSizeChange={onSizeChange}
                    />
                    <DropdownMenuSeparator />
                  </>
                )}
                {data && (
                  <DropdownMenuItem onClick={handleExportCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar CSV
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleExportPNG}>
                  <Image className="h-4 w-4 mr-2" />
                  Exportar PNG
                </DropdownMenuItem>
                {drillDownParams && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleDrillDown}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver detalhes
                    </DropdownMenuItem>
                  </>
                )}
                {canEdit && (
                  <>
                    <DropdownMenuSeparator />
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
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent id={`chart-${chartId}`} className="pt-0">
          {children}
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
