import { useMemo, useState, useCallback, useEffect } from "react";
import { useNegociosStore } from "@/stores/negociosStore";
import { useOrganizationStore } from "@/stores/organizationStore";
import { KanbanToolbar, KanbanBoard } from "@/components/kanban";
import { productOptions } from "@/mocks/schemas";
import { toast } from "sonner";
import { DateRange } from "react-day-picker";
import { ColumnOption, TableRow } from "@/types";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";

const KANBAN_ORDER_KEY_PREFIX = "crm_kanban_order_";

const Kanban = () => {
  const { activeOrganizationId } = useOrganizationStore();
  const { 
    negocios, 
    schema, 
    loading, 
    schemaLoading,
    loadNegocios, 
    loadSchema, 
    updateNegocio 
  } = useNegociosStore();

  // Load data when org changes
  useEffect(() => {
    if (activeOrganizationId) {
      loadNegocios(activeOrganizationId);
      loadSchema(activeOrganizationId);
    }
  }, [activeOrganizationId, loadNegocios, loadSchema]);

  // Convert negocios to deal-like format for kanban
  const deals = useMemo(() => {
    return negocios.map(n => ({
      id: n.id,
      name: n.title,
      value: n.value,
      ownerId: n.owner_id || "",
      createdAt: n.created_at,
      ...n.props,
    })) as TableRow[];
  }, [negocios]);

  // Get all select columns from schema
  const selectColumns = useMemo(() => {
    if (!schema) return [];
    return schema.columns.filter((col) => col.type === "select" && col.options && col.options.length > 0);
  }, [schema]);

  // Selected column for grouping
  const [selectedColumn, setSelectedColumn] = useState<string>(() => {
    const saved = localStorage.getItem("crm_kanban_selected_column");
    return saved || "stage";
  });

  // Column order state
  const [columnOrder, setColumnOrder] = useState<string[]>([]);

  // Load column order from localStorage
  useEffect(() => {
    const column = selectColumns.find((c) => c.id === selectedColumn);
    if (!column?.options) return;

    const storageKey = `${KANBAN_ORDER_KEY_PREFIX}${selectedColumn}`;
    const saved = localStorage.getItem(storageKey);
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setColumnOrder(parsed);
      } catch {
        setColumnOrder(column.options.map((o) => o.value));
      }
    } else {
      setColumnOrder(column.options.map((o) => o.value));
    }
  }, [selectedColumn, selectColumns]);

  // Save selected column to localStorage
  useEffect(() => {
    localStorage.setItem("crm_kanban_selected_column", selectedColumn);
  }, [selectedColumn]);

  // Get options for current column
  const currentOptions = useMemo((): ColumnOption[] => {
    const column = selectColumns.find((c) => c.id === selectedColumn);
    return column?.options || [];
  }, [selectColumns, selectedColumn]);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedProduct, setSelectedProduct] = useState("all");
  const [selectedOwner, setSelectedOwner] = useState("all");

  // Calculate active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (dateRange?.from) count++;
    if (selectedProduct !== "all") count++;
    if (selectedOwner !== "all") count++;
    return count;
  }, [searchTerm, dateRange, selectedProduct, selectedOwner]);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setSearchTerm("");
    setDateRange(undefined);
    setSelectedProduct("all");
    setSelectedOwner("all");
  }, []);

  // Filter deals
  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      // Text search
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchName = String(deal.name || "").toLowerCase().includes(searchLower);
        if (!matchName) return false;
      }

      // Date range filter
      if (dateRange?.from) {
        const dealDate = new Date(deal.createdAt as string);
        if (dealDate < dateRange.from) return false;
        if (dateRange.to && dealDate > dateRange.to) return false;
      }

      // Product filter
      if (selectedProduct !== "all" && deal.product !== selectedProduct) {
        return false;
      }

      // Owner filter
      if (selectedOwner !== "all" && deal.ownerId !== selectedOwner) {
        return false;
      }

      return true;
    });
  }, [deals, searchTerm, dateRange, selectedProduct, selectedOwner]);

  // Handle deal move - persist to Supabase
  const handleDealMove = useCallback(async (dealId: string, newValue: string) => {
    const negocio = negocios.find(n => n.id === dealId);
    if (!negocio) return;

    try {
      await updateNegocio(dealId, {
        props: {
          ...negocio.props,
          [selectedColumn]: newValue,
        },
      });
      toast.success("Negócio movido com sucesso");
    } catch (error) {
      toast.error("Erro ao mover negócio");
    }
  }, [updateNegocio, selectedColumn, negocios]);

  // Handle column reorder
  const handleColumnReorder = useCallback((newOrder: string[]) => {
    setColumnOrder(newOrder);
    const storageKey = `${KANBAN_ORDER_KEY_PREFIX}${selectedColumn}`;
    localStorage.setItem(storageKey, JSON.stringify(newOrder));
    toast.success("Ordem das colunas salva");
  }, [selectedColumn]);

  // Reset column order
  const handleResetColumnOrder = useCallback(() => {
    const column = selectColumns.find((c) => c.id === selectedColumn);
    if (!column?.options) return;
    
    const defaultOrder = column.options.map((o) => o.value);
    setColumnOrder(defaultOrder);
    
    const storageKey = `${KANBAN_ORDER_KEY_PREFIX}${selectedColumn}`;
    localStorage.removeItem(storageKey);
    toast.success("Ordem restaurada para o padrão");
  }, [selectedColumn, selectColumns]);

  // Export visible deals
  const handleExport = useCallback(() => {
    const exportData = filteredDeals.map((deal) => ({
      ...deal,
    }));

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `negocios-kanban-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filteredDeals.length} negócios exportados`);
  }, [filteredDeals]);

  // Reload data
  const handleReload = useCallback(() => {
    if (activeOrganizationId) {
      loadNegocios(activeOrganizationId);
      toast.success("Dados recarregados");
    }
  }, [activeOrganizationId, loadNegocios]);

  // Helper functions for card display
  const getCompanyName = useCallback((id: string) => undefined, []);
  const getOwnerName = useCallback((id: string) => undefined, []);

  // Handle column change
  const handleColumnChange = useCallback((columnId: string) => {
    setSelectedColumn(columnId);
  }, []);

  if (loading || schemaLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pipeline</h1>
          <p className="text-muted-foreground">
            Arraste os cards entre as etapas • {filteredDeals.length} negócios
          </p>
        </div>

        <KanbanToolbar
          selectColumns={selectColumns}
          selectedColumn={selectedColumn}
          onColumnChange={handleColumnChange}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          selectedProduct={selectedProduct}
          onProductChange={setSelectedProduct}
          selectedOwner={selectedOwner}
          onOwnerChange={setSelectedOwner}
          products={productOptions}
          owners={[]}
          onExport={handleExport}
          onReload={handleReload}
          onResetColumnOrder={handleResetColumnOrder}
          activeFiltersCount={activeFiltersCount}
          onClearFilters={handleClearFilters}
        />

        <KanbanBoard
          deals={filteredDeals}
          options={currentOptions}
          columnOrder={columnOrder}
          selectedColumnId={selectedColumn}
          getCompanyName={getCompanyName}
          getOwnerName={getOwnerName}
          onDealMove={handleDealMove}
          onColumnReorder={handleColumnReorder}
        />
      </div>
    </TooltipProvider>
  );
};

export default Kanban;
