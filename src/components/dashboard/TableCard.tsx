import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, MoreVertical, Settings2, Copy, Trash2 } from "lucide-react";
import { exportToCSV, originLabels, getMonthLabel } from "@/lib/dashboardHelpers";
import { cn } from "@/lib/utils";
import { WidgetConfig } from "@/stores/dashboardStore";
import { useState } from "react";
import { WidgetConfigModal } from "./WidgetConfigModal";
import { WidgetSizeMenu } from "./WidgetSizeMenu";

interface TableCardProps {
  title: string;
  monthlyByOrigin: Record<string, Record<string, number>>;
  className?: string;
  widget?: WidgetConfig;
  canEdit?: boolean;
  onEdit?: (config: WidgetConfig) => void;
  onDuplicate?: () => void;
  onRemove?: () => void;
  onSizeChange?: (colSpan: number) => void;
}

export function TableCard({ 
  title, 
  monthlyByOrigin, 
  className,
  widget,
  canEdit = true,
  onEdit,
  onDuplicate,
  onRemove,
  onSizeChange,
}: TableCardProps) {
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Get all months and origins
  const months = Object.keys(monthlyByOrigin).sort();
  const allOrigins = new Set<string>();
  Object.values(monthlyByOrigin).forEach((origins) => {
    Object.keys(origins).forEach((origin) => allOrigins.add(origin));
  });
  const origins = Array.from(allOrigins);

  // Calculate totals
  const monthTotals: Record<string, number> = {};
  const originTotals: Record<string, number> = {};
  let grandTotal = 0;

  months.forEach((month) => {
    monthTotals[month] = 0;
    origins.forEach((origin) => {
      const value = monthlyByOrigin[month]?.[origin] || 0;
      monthTotals[month] += value;
      originTotals[origin] = (originTotals[origin] || 0) + value;
      grandTotal += value;
    });
  });

  // Prepare data for export
  const exportData = months.map((month) => {
    const row: Record<string, unknown> = { Mês: getMonthLabel(month) };
    origins.forEach((origin) => {
      row[originLabels[origin] || origin] = monthlyByOrigin[month]?.[origin] || 0;
    });
    row["Total"] = monthTotals[month];
    return row;
  });

  const handleExport = () => {
    exportToCSV(exportData, "dados-resumidos");
  };

  const handleEditSave = (config: WidgetConfig) => {
    if (onEdit) {
      onEdit(config);
    }
    setEditModalOpen(false);
  };

  const showMenu = canEdit && (onEdit || onDuplicate || onRemove);

  if (months.length === 0) {
    return (
      <Card className={cn("h-full", className)}>
        <CardContent className="flex items-center justify-center h-48 text-muted-foreground">
          Nenhum dado disponível
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={cn("h-full", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
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
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Mês</TableHead>
                  {origins.map((origin) => (
                    <TableHead key={origin} className="text-center">
                      {originLabels[origin] || origin}
                    </TableHead>
                  ))}
                  <TableHead className="text-center font-bold">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {months.map((month) => (
                  <TableRow key={month}>
                    <TableCell className="font-medium">{getMonthLabel(month)}</TableCell>
                    {origins.map((origin) => (
                      <TableCell key={origin} className="text-center">
                        {monthlyByOrigin[month]?.[origin] || 0}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-bold">
                      {monthTotals[month]}
                    </TableCell>
                  </TableRow>
                ))}
                {/* Totals row */}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell>Total</TableCell>
                  {origins.map((origin) => (
                    <TableCell key={origin} className="text-center">
                      {originTotals[origin] || 0}
                    </TableCell>
                  ))}
                  <TableCell className="text-center">{grandTotal}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
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
