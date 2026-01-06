import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WidgetConfig, WidgetType } from "@/stores/dashboardStore";
import { dealsSchema } from "@/mocks/schemas";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface WidgetConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  widgetType: WidgetType;
  initialConfig?: Partial<WidgetConfig>;
  onSave: (config: WidgetConfig) => void;
  mode?: "create" | "edit";
}

// Get dimension options from deals schema dynamically
const getDimensionOptions = () => {
  const temporal: { value: string; label: string; type: string }[] = [];
  const categorical: { value: string; label: string; type: string }[] = [];
  const numeric: { value: string; label: string; type: string }[] = [];
  
  dealsSchema.columns.forEach(col => {
    if (col.type === "date") {
      temporal.push({
        value: col.id,
        label: col.name,
        type: "temporal",
      });
    } else if (col.type === "select" || col.type === "relation") {
      categorical.push({
        value: col.id,
        label: col.name,
        type: "categorical",
      });
    } else if (col.type === "currency" || col.type === "number") {
      numeric.push({
        value: col.id,
        label: col.name,
        type: "numeric",
      });
    }
  });
  
  return { temporal, categorical, numeric, all: [...temporal, ...categorical] };
};

// Get metric options from deals schema dynamically
const getMetricOptions = () => {
  const baseMetrics = [
    { value: "count", label: "Contagem de negócios", aggregation: "count" },
    { value: "win_rate", label: "Win rate (%)", aggregation: "percent" },
  ];
  
  // Add currency/numeric columns as sum/avg metrics
  const numericMetrics: { value: string; label: string; aggregation: string }[] = [];
  dealsSchema.columns.forEach(col => {
    if (col.type === "currency") {
      numericMetrics.push({
        value: `sum_${col.id}`,
        label: `Soma de ${col.name} (R$)`,
        aggregation: "sum",
      });
      numericMetrics.push({
        value: `avg_${col.id}`,
        label: `Média de ${col.name} (R$)`,
        aggregation: "avg",
      });
    }
  });
  
  return [...baseMetrics, ...numericMetrics];
};

const granularityOptions = [
  { value: "day", label: "Dia" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
  { value: "quarter", label: "Trimestre" },
];

const periodPresets = [
  { value: "this_year", label: "Este ano" },
  { value: "last_12_months", label: "Últimos 12 meses" },
  { value: "this_month", label: "Mês atual" },
  { value: "custom", label: "Personalizado" },
];

const sortOptions = [
  { value: "label_asc", label: "Rótulo (A-Z)" },
  { value: "label_desc", label: "Rótulo (Z-A)" },
  { value: "value_asc", label: "Valor (menor primeiro)" },
  { value: "value_desc", label: "Valor (maior primeiro)" },
];

const sizeOptions = [
  { value: "sm", label: "Pequeno (1 coluna)" },
  { value: "md", label: "Médio (2 colunas)" },
  { value: "lg", label: "Grande (3 colunas)" },
  { value: "xl", label: "Extra Grande (4 colunas)" },
];

export function WidgetConfigModal({
  open,
  onOpenChange,
  widgetType,
  initialConfig,
  onSave,
  mode = "create",
}: WidgetConfigModalProps) {
  const dimensionOptions = useMemo(() => getDimensionOptions(), []);
  const metricOptions = useMemo(() => getMetricOptions(), []);
  
  const getDefaultConfig = () => ({
    type: widgetType,
    title: initialConfig?.title || getDefaultTitle(widgetType),
    dimension: initialConfig?.dimension || "stage",
    metric: initialConfig?.metric || "count",
    segmentation: initialConfig?.segmentation,
    granularity: initialConfig?.granularity || "month",
    periodPreset: initialConfig?.periodPreset || "this_year",
    sorting: initialConfig?.sorting || "value_desc",
    showLegend: initialConfig?.showLegend ?? true,
    showLabels: initialConfig?.showLabels ?? false,
    size: initialConfig?.size || "md",
    localFilters: initialConfig?.localFilters || {},
    kpiType: initialConfig?.kpiType,
    ...initialConfig,
  });

  const [config, setConfig] = useState<Partial<WidgetConfig>>(getDefaultConfig());
  const [validationError, setValidationError] = useState<string | null>(null);

  // Reset config when modal opens with new initialConfig
  useEffect(() => {
    if (open) {
      setConfig(getDefaultConfig());
      setValidationError(null);
    }
  }, [open, initialConfig?.id]);

  const selectedDimension = dimensionOptions.all.find(d => d.value === config.dimension);
  const isTemporal = selectedDimension?.type === "temporal";
  
  // Win rate validation
  const isWinRateValid = config.metric !== "win_rate" || 
    ["stage", "ownerId", "origin", "product"].includes(config.dimension || "");

  function getDefaultTitle(type: WidgetType): string {
    switch (type) {
      case "bar": return "Gráfico de Barras";
      case "line": return "Gráfico de Linha";
      case "area": return "Gráfico de Área";
      case "pie": return "Gráfico de Pizza";
      case "table": return "Tabela Resumida";
      case "funnel": return "Funil de Vendas";
      case "kpi": return "KPI";
      default: return "Novo Widget";
    }
  }

  const handleSave = () => {
    if (!config.title?.trim()) {
      setValidationError("O título é obrigatório");
      return;
    }
    
    if (!isWinRateValid) {
      setValidationError("Win rate requer uma dimensão categórica adequada");
      return;
    }

    const newWidget: WidgetConfig = {
      id: initialConfig?.id || `widget-${Date.now()}`,
      type: widgetType,
      title: config.title,
      dimension: config.dimension,
      metric: config.metric,
      segmentation: config.segmentation,
      granularity: config.granularity,
      periodPreset: config.periodPreset,
      sorting: config.sorting,
      showLegend: config.showLegend,
      showLabels: config.showLabels,
      size: config.size as "sm" | "md" | "lg" | "xl",
      localFilters: config.localFilters,
      dataKey: config.metric === "count" ? "count" : "value",
      groupBy: config.dimension as WidgetConfig["groupBy"],
      kpiType: config.kpiType,
    };

    onSave(newWidget);
    onOpenChange(false);
  };

  const updateConfig = (key: string, value: unknown) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setValidationError(null);
  };

  // Don't show full config for KPI or funnel
  const isSimpleWidget = widgetType === "kpi" || widgetType === "funnel";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Configurar Novo Widget" : "Editar Widget"}
          </DialogTitle>
          <DialogDescription>
            Configure as propriedades do gráfico baseado nos dados de Negócios
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="data" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="data">Dados</TabsTrigger>
            <TabsTrigger value="axis">Eixos</TabsTrigger>
            <TabsTrigger value="appearance">Aparência</TabsTrigger>
          </TabsList>

          {/* Data Tab */}
          <TabsContent value="data" className="space-y-4 mt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">Fonte: Negócios</Badge>
            </div>

            {!isSimpleWidget && (
              <>
                {/* Dimension (X axis) */}
                <div className="space-y-2">
                  <Label>Dimensão (Eixo X / Categorias)</Label>
                  <Select
                    value={config.dimension}
                    onValueChange={(v) => updateConfig("dimension", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a dimensão" />
                    </SelectTrigger>
                    <SelectContent>
                      {dimensionOptions.temporal.length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                            Temporal
                          </div>
                          {dimensionOptions.temporal.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </>
                      )}
                      {dimensionOptions.categorical.length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-1">
                            Categóricas
                          </div>
                          {dimensionOptions.categorical.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Metric (Y axis) */}
                <div className="space-y-2">
                  <Label>Métrica (Eixo Y)</Label>
                  <Select
                    value={config.metric}
                    onValueChange={(v) => updateConfig("metric", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a métrica" />
                    </SelectTrigger>
                    <SelectContent>
                      {metricOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!isWinRateValid && (
                    <Alert variant="destructive" className="mt-2">
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Win rate requer uma dimensão como Etapa, Origem, Produto ou Proprietário
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Segmentation (for bar/area/line) */}
                {["bar", "area", "line"].includes(widgetType) && (
                  <div className="space-y-2">
                    <Label>Segmentação (Stack/Séries) - Opcional</Label>
                    <Select
                      value={config.segmentation || "none"}
                      onValueChange={(v) => updateConfig("segmentation", v === "none" ? undefined : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Nenhuma" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma</SelectItem>
                        {dimensionOptions.categorical
                          .filter((opt) => opt.value !== config.dimension)
                          .map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Granularity (for temporal dimensions) */}
                {isTemporal && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Período</Label>
                      <Select
                        value={config.periodPreset}
                        onValueChange={(v) => updateConfig("periodPreset", v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {periodPresets.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Granularidade</Label>
                      <Select
                        value={config.granularity}
                        onValueChange={(v) => updateConfig("granularity", v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {granularityOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </>
            )}

            {widgetType === "funnel" && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  O funil usa automaticamente as etapas do pipeline: Prospecção → Qualificação → Proposta → Negociação → Fechamento → Ganho
                </AlertDescription>
              </Alert>
            )}

            {widgetType === "kpi" && (
              <div className="space-y-2">
                <Label>Tipo de KPI</Label>
                <Select
                  value={config.kpiType || "pipeTotal"}
                  onValueChange={(v) => updateConfig("kpiType", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pipeTotal">Pipe Total</SelectItem>
                    <SelectItem value="forecast">Forecast vs Meta</SelectItem>
                    <SelectItem value="winRate">Win Rate</SelectItem>
                    <SelectItem value="avgCycle">Ciclo Médio</SelectItem>
                    <SelectItem value="avgTicket">Ticket Médio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </TabsContent>

          {/* Axis Tab */}
          <TabsContent value="axis" className="space-y-4 mt-4">
            {!isSimpleWidget && (
              <>
                <div className="space-y-2">
                  <Label>Ordenação</Label>
                  <Select
                    value={config.sorting}
                    onValueChange={(v) => updateConfig("sorting", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-4 border rounded-lg space-y-3">
                  <h4 className="font-medium">Formatação do Eixo Y</h4>
                  <p className="text-sm text-muted-foreground">
                    {config.metric === "count" && "Número inteiro"}
                    {(config.metric?.startsWith("sum_") || config.metric?.startsWith("avg_")) && "Moeda (R$)"}
                    {config.metric === "win_rate" && "Percentual (%)"}
                  </p>
                </div>

                <div className="p-4 border rounded-lg space-y-3">
                  <h4 className="font-medium">Formatação do Eixo X</h4>
                  <p className="text-sm text-muted-foreground">
                    {isTemporal
                      ? `Data formatada por ${granularityOptions.find(g => g.value === config.granularity)?.label || "mês"}`
                      : "Categorias da dimensão selecionada"}
                  </p>
                </div>
              </>
            )}

            {isSimpleWidget && (
              <div className="text-center py-8 text-muted-foreground">
                Este tipo de widget não possui configurações de eixo
              </div>
            )}
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Título do Widget</Label>
              <Input
                value={config.title}
                onChange={(e) => updateConfig("title", e.target.value)}
                placeholder="Digite o título..."
              />
            </div>

            <div className="space-y-2">
              <Label>Tamanho</Label>
              <Select
                value={config.size}
                onValueChange={(v) => updateConfig("size", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sizeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!isSimpleWidget && (
              <>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mostrar legenda</Label>
                    <p className="text-sm text-muted-foreground">
                      Exibe a legenda no gráfico
                    </p>
                  </div>
                  <Switch
                    checked={config.showLegend}
                    onCheckedChange={(v) => updateConfig("showLegend", v)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mostrar valores</Label>
                    <p className="text-sm text-muted-foreground">
                      Exibe os valores nas barras/pontos
                    </p>
                  </div>
                  <Switch
                    checked={config.showLabels}
                    onCheckedChange={(v) => updateConfig("showLabels", v)}
                  />
                </div>
              </>
            )}

            {validationError && (
              <Alert variant="destructive">
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!isWinRateValid}>
            {mode === "create" ? "Adicionar ao painel" : "Salvar alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
