import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, LineChart, PieChart, Activity, Table, Target, TrendingUp } from "lucide-react";
import { WidgetConfig, WidgetType, useDashboardsStore } from "@/stores/dashboardsStore";
import { useOrganizationStore } from "@/stores/organizationStore";
import { WidgetConfigModal } from "./WidgetConfigModal";

interface DrawerAddWidgetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dashboardSlug: string;
}

interface WidgetTemplate {
  type: WidgetType;
  title: string;
  description: string;
  icon: React.ElementType;
}

const widgetTemplates: WidgetTemplate[] = [
  {
    type: "bar",
    title: "Gráfico de Barras",
    description: "Compare valores entre categorias",
    icon: BarChart3,
  },
  {
    type: "line",
    title: "Gráfico de Linha",
    description: "Visualize tendências ao longo do tempo",
    icon: LineChart,
  },
  {
    type: "area",
    title: "Gráfico de Área",
    description: "Mostra volume acumulado ao longo do tempo",
    icon: Activity,
  },
  {
    type: "pie",
    title: "Gráfico de Pizza",
    description: "Distribuição proporcional por categoria",
    icon: PieChart,
  },
  {
    type: "table",
    title: "Tabela Resumida",
    description: "Dados tabulares com totais por origem e mês",
    icon: Table,
  },
  {
    type: "funnel",
    title: "Funil",
    description: "Visualize conversão entre etapas do pipeline",
    icon: TrendingUp,
  },
  {
    type: "kpi",
    title: "KPI Card",
    description: "Exibe um indicador numérico com meta opcional",
    icon: Target,
  },
];

export function DrawerAddWidget({
  open,
  onOpenChange,
  dashboardSlug,
}: DrawerAddWidgetProps) {
  const { activeOrganizationId } = useOrganizationStore();
  const { addWidget, savedViews, loadView } = useDashboardsStore();
  const views = savedViews[dashboardSlug] || [];

  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<WidgetType | null>(null);

  const handleSelectTemplate = (template: WidgetTemplate) => {
    setSelectedType(template.type);
    setConfigModalOpen(true);
  };

  const handleSaveWidget = async (config: WidgetConfig) => {
    if (activeOrganizationId) {
      await addWidget(activeOrganizationId, dashboardSlug, config);
    }
    setConfigModalOpen(false);
    setSelectedType(null);
    onOpenChange(false);
  };

  const handleLoadView = (viewId: string) => {
    loadView(dashboardSlug, viewId);
    onOpenChange(false);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Adicionar Conteúdo</SheetTitle>
            <SheetDescription>
              Escolha um widget para configurar e adicionar ao seu painel
            </SheetDescription>
          </SheetHeader>

          <Tabs defaultValue="ready" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ready">Widgets Prontos</TabsTrigger>
              <TabsTrigger value="saved">Visões Salvas</TabsTrigger>
            </TabsList>

            <TabsContent value="ready" className="mt-4">
              <div className="grid gap-3">
                {widgetTemplates.map((template) => (
                  <Card
                    key={template.type}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg p-2 bg-primary/10">
                          <template.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-sm">{template.title}</CardTitle>
                          <CardDescription className="text-xs">
                            {template.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="saved" className="mt-4">
              {views.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <p>Nenhuma visão salva ainda.</p>
                  <p className="text-sm mt-1">
                    Salve uma visão para reutilizar sua configuração de widgets.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {views.map((view) => (
                    <Card
                      key={view.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleLoadView(view.id)}
                    >
                      <CardHeader className="p-4">
                        <CardTitle className="text-sm">{view.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {view.widgets.length} widgets
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      {selectedType && (
        <WidgetConfigModal
          open={configModalOpen}
          onOpenChange={(open) => {
            setConfigModalOpen(open);
            if (!open) setSelectedType(null);
          }}
          widgetType={selectedType}
          onSave={handleSaveWidget}
          mode="create"
        />
      )}
    </>
  );
}