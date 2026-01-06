import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, X, Filter } from "lucide-react";
import { useDashboardsStore, DashboardFilters } from "@/stores/dashboardsStore";
import { originLabels } from "@/lib/dashboardHelpers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";

interface FiltersBarProps {
  collapsed?: boolean;
}

// Mock users for now - this will come from a proper store later
const mockUsers = [
  { id: "user-1", name: "Carlos Silva" },
  { id: "user-2", name: "Maria Santos" },
];

export function FiltersBar({ collapsed = false }: FiltersBarProps) {
  const { filters, setFilters, clearFilters } = useDashboardsStore();
  const users = mockUsers;
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    filters.dateRange.from ? new Date(filters.dateRange.from) : undefined
  );
  const [dateTo, setDateTo] = useState<Date | undefined>(
    filters.dateRange.to ? new Date(filters.dateRange.to) : undefined
  );

  const origins = Object.entries(originLabels);
  const products = [
    { value: "VAR", label: "VAR" },
    { value: "COM", label: "COM" },
    { value: "AMS", label: "AMS" },
  ];

  const activeFiltersCount =
    (filters.dateRange.from || filters.dateRange.to ? 1 : 0) +
    (filters.origins.length > 0 ? 1 : 0) +
    (filters.products.length > 0 ? 1 : 0) +
    (filters.owners.length > 0 ? 1 : 0);

  const handleDateChange = (type: "from" | "to", date: Date | undefined) => {
    if (type === "from") {
      setDateFrom(date);
      setFilters({
        dateRange: {
          ...filters.dateRange,
          from: date ? date.toISOString() : null,
        },
      });
    } else {
      setDateTo(date);
      setFilters({
        dateRange: {
          ...filters.dateRange,
          to: date ? date.toISOString() : null,
        },
      });
    }
  };

  const toggleOrigin = (origin: string) => {
    const newOrigins = filters.origins.includes(origin)
      ? filters.origins.filter((o) => o !== origin)
      : [...filters.origins, origin];
    setFilters({ origins: newOrigins });
  };

  const toggleProduct = (product: string) => {
    const newProducts = filters.products.includes(product)
      ? filters.products.filter((p) => p !== product)
      : [...filters.products, product];
    setFilters({ products: newProducts });
  };

  const toggleOwner = (ownerId: string) => {
    const newOwners = filters.owners.includes(ownerId)
      ? filters.owners.filter((o) => o !== ownerId)
      : [...filters.owners, ownerId];
    setFilters({ owners: newOwners });
  };

  const handleClearFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    clearFilters();
  };

  // Mobile accordion version
  if (collapsed) {
    return (
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="filters" className="border-none">
          <AccordionTrigger className="py-2 px-4 bg-muted/50 rounded-lg hover:no-underline">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span>Filtros</span>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <div className="space-y-4">
              {/* Date range */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Período</label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "flex-1 justify-start text-left font-normal",
                          !dateFrom && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFrom ? format(dateFrom, "dd/MM/yy") : "Início"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateFrom}
                        onSelect={(d) => handleDateChange("from", d)}
                        locale={ptBR}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "flex-1 justify-start text-left font-normal",
                          !dateTo && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateTo ? format(dateTo, "dd/MM/yy") : "Fim"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateTo}
                        onSelect={(d) => handleDateChange("to", d)}
                        locale={ptBR}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Origins */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Origem</label>
                <div className="flex flex-wrap gap-2">
                  {origins.map(([value, label]) => (
                    <Badge
                      key={value}
                      variant={filters.origins.includes(value) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleOrigin(value)}
                    >
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Products */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Produto</label>
                <div className="flex flex-wrap gap-2">
                  {products.map(({ value, label }) => (
                    <Badge
                      key={value}
                      variant={filters.products.includes(value) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleProduct(value)}
                    >
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>

              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="w-full"
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpar filtros
                </Button>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  }

  // Desktop version
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/30 rounded-lg border border-border/50">
      {/* Date range */}
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "w-[130px] justify-start text-left font-normal",
                !dateFrom && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFrom ? format(dateFrom, "dd/MM/yy") : "Data início"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateFrom}
              onSelect={(d) => handleDateChange("from", d)}
              locale={ptBR}
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
        <span className="text-muted-foreground">→</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "w-[130px] justify-start text-left font-normal",
                !dateTo && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateTo ? format(dateTo, "dd/MM/yy") : "Data fim"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateTo}
              onSelect={(d) => handleDateChange("to", d)}
              locale={ptBR}
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Origin multi-select */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="min-w-[120px]">
            Origem
            {filters.origins.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                {filters.origins.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="start">
          <div className="space-y-2">
            {origins.map(([value, label]) => (
              <label
                key={value}
                className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1.5 rounded"
              >
                <Checkbox
                  checked={filters.origins.includes(value)}
                  onCheckedChange={() => toggleOrigin(value)}
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Product multi-select */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="min-w-[100px]">
            Produto
            {filters.products.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                {filters.products.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-40 p-2" align="start">
          <div className="space-y-2">
            {products.map(({ value, label }) => (
              <label
                key={value}
                className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1.5 rounded"
              >
                <Checkbox
                  checked={filters.products.includes(value)}
                  onCheckedChange={() => toggleProduct(value)}
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Owner multi-select */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="min-w-[130px]">
            Proprietário
            {filters.owners.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                {filters.owners.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="start">
          <div className="space-y-2">
            {users.map((user) => (
              <label
                key={user.id}
                className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1.5 rounded"
              >
                <Checkbox
                  checked={filters.owners.includes(user.id)}
                  onCheckedChange={() => toggleOwner(user.id)}
                />
                <span className="text-sm">{user.name}</span>
              </label>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Clear filters */}
      {activeFiltersCount > 0 && (
        <Button variant="ghost" size="sm" onClick={handleClearFilters}>
          <X className="h-4 w-4 mr-1" />
          Limpar ({activeFiltersCount})
        </Button>
      )}
    </div>
  );
}
