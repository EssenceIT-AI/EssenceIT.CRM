import { useState, useMemo, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, RotateCcw, Share2, LayoutDashboard, Loader2 } from "lucide-react";
import { useDashboardsStore, WidgetConfig } from "@/stores/dashboardsStore";
import { useNegociosStore } from "@/stores/negociosStore";
import { useOrganizationStore } from "@/stores/organizationStore";
import { FiltersBar } from "@/components/dashboard/FiltersBar";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { TableCard } from "@/components/dashboard/TableCard";
import { FunnelChart } from "@/components/dashboard/FunnelChart";
import { DrawerAddWidget } from "@/components/dashboard/DrawerAddWidget";
import { DynamicChart } from "@/components/dashboard/DynamicChart";
import { WidgetGrid } from "@/components/dashboard/WidgetGrid";
import { getFilteredDeals, calculateAggregations } from "@/lib/dashboardHelpers";
import { getWidgetChartData } from "@/lib/widgetDataHelpers";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

export default function DashboardPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { activeOrganizationId } = useOrganizationStore();
  const { 
    dashboards,
    loading,
    loadDashboards,
    getDashboard, 
    filters, 
    resetDashboard, 
    updateWidget, 
    duplicateWidget, 
    removeWidget,
    reorderWidgets,
    widgetOrder,
  } = useDashboardsStore();
  
  const { negocios, loadNegocios } = useNegociosStore();

  // Load data when org changes
  useEffect(() => {
    if (activeOrganizationId) {
      loadDashboards(activeOrganizationId);
      loadNegocios(activeOrganizationId);
    }
  }, [activeOrganizationId, loadDashboards, loadNegocios]);

  const dashboard = getDashboard(slug || "c-level");

  // Transform negocios to deals format for compatibility
  const deals = useMemo(() => {
    return negocios.map(n => ({
      id: n.id,
      name: n.title,
      value: n.value,
      stage: (n.props?.stage as string) || "lead",
      origin: (n.props?.origem as string) || "",
      origem: (n.props?.origem as string) || "",
      product: ((n.props?.product as string) || "VAR") as "VAR" | "COM" | "AMS",
      ownerId: n.owner_id || "",
      createdAt: n.created_at,
      expectedCloseDate: (n.props?.expectedCloseDate as string) || "",
      closedAt: (n.props?.closedAt as string) || undefined,
      companyId: (n.props?.companyId as string) || "",
      contactId: (n.props?.contactId as string) || "",
    }));
  }, [negocios]);

  const filteredDeals = useMemo(() => getFilteredDeals(deals, filters), [deals, filters]);
  const aggregations = useMemo(() => calculateAggregations(filteredDeals, 2000000), [filteredDeals]);

  const getUserName = useCallback((id: string) => id, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Dashboard não encontrado</p>
      </div>
    );
  }

  const canEdit = true; // All dashboards are editable

  const handleReset = async () => {
    if (!activeOrganizationId) return;
    try {
      await resetDashboard(activeOrganizationId, dashboard.slug);
      toast({ title: "Painel resetado", description: "Configuração padrão restaurada" });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao resetar painel" });
    }
  };

  const handleUpdateWidget = async (widgetId: string, config: WidgetConfig) => {
    if (!activeOrganizationId) return;
    try {
      await updateWidget(activeOrganizationId, dashboard.slug, widgetId, config);
      toast({ title: "Widget atualizado" });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao atualizar widget" });
    }
  };

  const handleDuplicateWidget = async (widgetId: string) => {
    if (!activeOrganizationId) return;
    try {
      await duplicateWidget(activeOrganizationId, dashboard.slug, widgetId);
      toast({ title: "Widget duplicado" });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao duplicar widget" });
    }
  };

  const handleRemoveWidget = async (widgetId: string) => {
    if (!activeOrganizationId) return;
    try {
      await removeWidget(activeOrganizationId, dashboard.slug, widgetId);
      toast({ title: "Widget removido" });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao remover widget" });
    }
  };

  const handleSizeChange = async (widgetId: string, colSpan: number) => {
    if (!activeOrganizationId) return;
    await updateWidget(activeOrganizationId, dashboard.slug, widgetId, { 
      layout: { colSpan, rowSpan: 1 } 
    });
  };

  const handleReorder = (newOrder: string[]) => {
    reorderWidgets(dashboard.slug, newOrder);
  };

  // Get ordered widgets
  const orderedWidgets = useMemo(() => {
    const order = widgetOrder[dashboard.slug];
    if (!order) return dashboard.widgets;
    
    const widgetMap = new Map(dashboard.widgets.map(w => [w.id, w]));
    const ordered: WidgetConfig[] = [];
    
    order.forEach(id => {
      const widget = widgetMap.get(id);
      if (widget) {
        ordered.push(widget);
        widgetMap.delete(id);
      }
    });
    
    widgetMap.forEach(widget => ordered.push(widget));
    
    return ordered;
  }, [dashboard.widgets, dashboard.slug, widgetOrder]);

  const renderWidget = (widget: WidgetConfig) => {
    const commonProps = {
      widget,
      canEdit,
      onEdit: (config: WidgetConfig) => handleUpdateWidget(widget.id, config),
      onDuplicate: () => handleDuplicateWidget(widget.id),
      onRemove: () => handleRemoveWidget(widget.id),
      onSizeChange: (colSpan: number) => handleSizeChange(widget.id, colSpan),
    };

    if (widget.type === "kpi") {
      const kpiProps = (() => {
        switch (widget.kpiType) {
          case "pipeTotal":
            return { value: aggregations.pipeTotal, type: "currency" as const, icon: "dollar" as const };
          case "forecast":
            return { value: aggregations.forecast, type: "currency" as const, target: 2000000, icon: "target" as const };
          case "winRate":
            return { value: aggregations.winRate, type: "percent" as const, icon: "percent" as const };
          case "avgCycle":
            return { value: aggregations.avgCycle, type: "days" as const, icon: "clock" as const };
          case "avgTicket":
            return { value: aggregations.avgTicket, type: "currency" as const, icon: "ticket" as const };
          default:
            return { value: 0, type: "number" as const, icon: "dollar" as const };
        }
      })();
      return <KpiCard key={widget.id} title={widget.title} {...kpiProps} {...commonProps} />;
    }

    if (widget.type === "funnel") {
      return <FunnelChart key={widget.id} title={widget.title} data={aggregations.funnelData} {...commonProps} />;
    }

    if (widget.type === "table") {
      return <TableCard key={widget.id} title={widget.title} monthlyByOrigin={aggregations.monthlyByOrigin} {...commonProps} />;
    }

    const chartData = getWidgetChartData(deals, widget, filters, getUserName);

    return (
      <ChartCard
        key={widget.id}
        title={widget.title}
        data={chartData}
        size={widget.size}
        {...commonProps}
      >
        <DynamicChart
          widget={widget}
          deals={deals}
          globalFilters={filters}
          getUserName={getUserName}
        />
      </ChartCard>
    );
  };

  const gridItems = orderedWidgets.map(widget => ({
    id: widget.id,
    element: renderWidget(widget),
    layout: widget.layout,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{dashboard.name}</h1>
          {dashboard.description && (
            <p className="text-muted-foreground text-sm">{dashboard.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/dashboards")}>
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Painéis
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast({ title: "Compartilhar", description: "Funcionalidade em desenvolvimento" })}>
            <Share2 className="h-4 w-4 mr-2" />
            Compartilhar
          </Button>
          {canEdit && (
            <>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Resetar
              </Button>
              <Button size="sm" onClick={() => setDrawerOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </>
          )}
        </div>
      </div>

      <FiltersBar collapsed={isMobile} />

      <WidgetGrid
        items={gridItems}
        onReorder={handleReorder}
        disabled={!canEdit}
      />

      <DrawerAddWidget open={drawerOpen} onOpenChange={setDrawerOpen} dashboardSlug={dashboard.slug} />
    </div>
  );
}
