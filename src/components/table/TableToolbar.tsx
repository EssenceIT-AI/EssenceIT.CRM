import { useState } from "react";
import { FilterConfig } from "@/types";
import { useSchemaStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  Columns,
  Download,
  Plus,
  X,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TableToolbarProps {
  tableId: string;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filters: FilterConfig[];
  onFiltersChange: (filters: FilterConfig[]) => void;
  onToggleColumnEditor: () => void;
  totalRows: number;
  filteredRows: number;
}

export const TableToolbar = ({
  tableId,
  searchTerm,
  onSearchChange,
  filters,
  onFiltersChange,
  onToggleColumnEditor,
  totalRows,
  filteredRows,
}: TableToolbarProps) => {
  const { getSchema, getViewsForTable, saveView } = useSchemaStore();
  const schema = getSchema(tableId);
  const savedViews = getViewsForTable(tableId);
  
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [newFilter, setNewFilter] = useState<Partial<FilterConfig>>({});

  const addFilter = () => {
    if (!newFilter.columnId || !newFilter.operator) return;
    
    const filter: FilterConfig = {
      columnId: newFilter.columnId,
      operator: newFilter.operator as FilterConfig["operator"],
      value: newFilter.value,
    };
    
    onFiltersChange([...filters, filter]);
    setNewFilter({});
    setShowFilterPopover(false);
  };

  const removeFilter = (index: number) => {
    onFiltersChange(filters.filter((_, i) => i !== index));
  };

  const handleExportCSV = () => {
    // Simple CSV export
    const columns = schema?.columns.filter(c => c.visible) || [];
    const headers = columns.map(c => c.name).join(",");
    
    // Note: In a real app, you'd get the actual filtered data
    const csvContent = `data:text/csv;charset=utf-8,${headers}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${tableId}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar..."
            className="pl-9 bg-secondary/50 border-0"
          />
        </div>
        
        {/* Filter button */}
        <Popover open={showFilterPopover} onOpenChange={setShowFilterPopover}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "gap-2",
                filters.length > 0 && "border-primary text-primary"
              )}
            >
              <Filter className="h-4 w-4" />
              Filtros
              {filters.length > 0 && (
                <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                  {filters.length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-3">
              <h4 className="font-medium">Adicionar Filtro</h4>
              
              <Select
                value={newFilter.columnId || ""}
                onValueChange={(v) => setNewFilter({ ...newFilter, columnId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a coluna" />
                </SelectTrigger>
                <SelectContent>
                  {schema?.columns.map((col) => (
                    <SelectItem key={col.id} value={col.id}>
                      {col.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={newFilter.operator || ""}
                onValueChange={(v) => setNewFilter({ ...newFilter, operator: v as FilterConfig["operator"] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Operador" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">Igual a</SelectItem>
                  <SelectItem value="contains">Contém</SelectItem>
                  <SelectItem value="gt">Maior que</SelectItem>
                  <SelectItem value="lt">Menor que</SelectItem>
                  <SelectItem value="isEmpty">Está vazio</SelectItem>
                  <SelectItem value="isNotEmpty">Não está vazio</SelectItem>
                </SelectContent>
              </Select>
              
              {newFilter.operator && !["isEmpty", "isNotEmpty"].includes(newFilter.operator) && (
                <Input
                  placeholder="Valor"
                  value={String(newFilter.value || "")}
                  onChange={(e) => setNewFilter({ ...newFilter, value: e.target.value })}
                />
              )}
              
              <Button onClick={addFilter} size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        
        {/* Column editor */}
        <Button variant="outline" size="sm" onClick={onToggleColumnEditor} className="gap-2">
          <Columns className="h-4 w-4" />
          Colunas
        </Button>
        
        {/* Saved views */}
        {savedViews.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Save className="h-4 w-4" />
                Views
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {savedViews.map((view) => (
                <DropdownMenuItem key={view.id}>
                  {view.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        {/* Export */}
        <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
          <Download className="h-4 w-4" />
          Exportar
        </Button>
        
        {/* Row count */}
        <div className="ml-auto text-sm text-muted-foreground">
          {filteredRows === totalRows ? (
            <span>{totalRows} registros</span>
          ) : (
            <span>{filteredRows} de {totalRows} registros</span>
          )}
        </div>
      </div>
      
      {/* Active filters */}
      {filters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.map((filter, index) => {
            const column = schema?.columns.find(c => c.id === filter.columnId);
            return (
              <div
                key={index}
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-secondary text-sm"
              >
                <span className="font-medium">{column?.name}</span>
                <span className="text-muted-foreground">{filter.operator}</span>
                {filter.value !== undefined && (
                  <span>"{String(filter.value)}"</span>
                )}
                <button
                  onClick={() => removeFilter(index)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
          <button
            onClick={() => onFiltersChange([])}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Limpar todos
          </button>
        </div>
      )}
    </div>
  );
};
