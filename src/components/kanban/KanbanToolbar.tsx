import { ColumnDefinition, User } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, CalendarIcon, Download, RefreshCw, RotateCcw, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { DateRange } from "react-day-picker";

interface KanbanToolbarProps {
  selectColumns: ColumnDefinition[];
  selectedColumn: string;
  onColumnChange: (columnId: string) => void;
  
  // Filters
  searchTerm: string;
  onSearchChange: (value: string) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  selectedProduct: string;
  onProductChange: (value: string) => void;
  selectedOwner: string;
  onOwnerChange: (value: string) => void;
  
  // Options
  products: { value: string; label: string }[];
  owners: User[];
  
  // Actions
  onExport: () => void;
  onReload: () => void;
  onResetColumnOrder: () => void;
  
  // Active filter count
  activeFiltersCount: number;
  onClearFilters: () => void;
}

export const KanbanToolbar = ({
  selectColumns,
  selectedColumn,
  onColumnChange,
  searchTerm,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  selectedProduct,
  onProductChange,
  selectedOwner,
  onOwnerChange,
  products,
  owners,
  onExport,
  onReload,
  onResetColumnOrder,
  activeFiltersCount,
  onClearFilters,
}: KanbanToolbarProps) => {
  return (
    <div className="space-y-3">
      {/* Main row: Column selector and actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-muted-foreground">Agrupar por:</label>
          <Select value={selectedColumn} onValueChange={onColumnChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione uma coluna" />
            </SelectTrigger>
            <SelectContent>
              {selectColumns.map((col) => (
                <SelectItem key={col.id} value={col.id}>
                  {col.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onResetColumnOrder}>
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Ordem padrão
          </Button>
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-1.5" />
            Exportar
          </Button>
          <Button variant="outline" size="sm" onClick={onReload}>
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Recarregar
          </Button>
        </div>
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar negócios..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 w-[200px]"
          />
        </div>

        {/* Date range */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal w-[240px]",
                !dateRange && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "dd/MM/yy", { locale: ptBR })} -{" "}
                    {format(dateRange.to, "dd/MM/yy", { locale: ptBR })}
                  </>
                ) : (
                  format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                )
              ) : (
                "Período de criação"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={onDateRangeChange}
              numberOfMonths={2}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>

        {/* Product filter */}
        <Select value={selectedProduct} onValueChange={onProductChange}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Produto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {products.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Owner filter */}
        <Select value={selectedOwner} onValueChange={onOwnerChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Proprietário" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {owners.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Active filters indicator */}
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} className="gap-1.5">
            <Badge variant="secondary" className="rounded-full px-2">
              {activeFiltersCount}
            </Badge>
            Limpar filtros
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
};
