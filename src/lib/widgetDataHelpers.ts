import { Deal } from "@/types";
import { WidgetConfig, WidgetLocalFilters, DashboardFilters } from "@/stores/dashboardStore";
import { dealsSchema, dealStages, dealOrigins, productOptions } from "@/mocks/schemas";
import { format, parseISO, differenceInDays, startOfWeek, startOfMonth, startOfQuarter, isWithinInterval, subMonths, startOfYear, endOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface ChartDataPoint {
  name: string;
  value: number;
  count: number;
  rawKey: string;
  [key: string]: string | number; // For stacked series
}

// Get label for a value based on dimension
export function getLabelForValue(dimension: string, value: string): string {
  const column = dealsSchema.columns.find(c => c.id === dimension);
  
  if (column?.options) {
    const option = column.options.find(o => o.value === value);
    if (option) return option.label;
  }
  
  // Special handling for stages
  if (dimension === "stage") {
    const stage = dealStages.find(s => s.id === value);
    if (stage) return stage.name;
  }
  
  // Special handling for origins
  if (dimension === "origin") {
    const origin = dealOrigins.find(o => o.value === value);
    if (origin) return origin.label;
  }
  
  // Special handling for products
  if (dimension === "product") {
    const product = productOptions.find(p => p.value === value);
    if (product) return product.label;
  }
  
  return value;
}

// Format date based on granularity
function formatDateByGranularity(date: Date, granularity: string): string {
  switch (granularity) {
    case "day":
      return format(date, "dd/MM/yy", { locale: ptBR });
    case "week":
      return format(startOfWeek(date), "'Sem' w/yy", { locale: ptBR });
    case "month":
      return format(date, "MMM/yy", { locale: ptBR });
    case "quarter":
      const q = Math.floor(date.getMonth() / 3) + 1;
      return `T${q}/${format(date, "yy")}`;
    default:
      return format(date, "MMM/yy", { locale: ptBR });
  }
}

// Get date key for grouping
function getDateKey(date: Date, granularity: string): string {
  switch (granularity) {
    case "day":
      return format(date, "yyyy-MM-dd");
    case "week":
      return format(startOfWeek(date), "yyyy-'W'ww");
    case "month":
      return format(date, "yyyy-MM");
    case "quarter":
      const q = Math.floor(date.getMonth() / 3) + 1;
      return `${format(date, "yyyy")}-Q${q}`;
    default:
      return format(date, "yyyy-MM");
  }
}

// Get date range based on period preset
function getDateRangeFromPreset(preset: string): { from: Date | null; to: Date | null } {
  const now = new Date();
  
  switch (preset) {
    case "this_year":
      return { from: startOfYear(now), to: endOfYear(now) };
    case "last_12_months":
      return { from: subMonths(now, 12), to: now };
    case "this_month":
      return { from: startOfMonth(now), to: now };
    case "custom":
    default:
      return { from: null, to: null };
  }
}

// Apply local filters to deals
export function applyLocalFilters(
  deals: Deal[],
  globalFilters: DashboardFilters,
  localFilters?: WidgetLocalFilters
): Deal[] {
  let filtered = [...deals];
  
  // Apply global date range
  if (globalFilters.dateRange.from || globalFilters.dateRange.to) {
    filtered = filtered.filter(deal => {
      const dealDate = parseISO(deal.createdAt);
      if (globalFilters.dateRange.from && globalFilters.dateRange.to) {
        return isWithinInterval(dealDate, {
          start: parseISO(globalFilters.dateRange.from),
          end: parseISO(globalFilters.dateRange.to),
        });
      } else if (globalFilters.dateRange.from) {
        return dealDate >= parseISO(globalFilters.dateRange.from);
      } else if (globalFilters.dateRange.to) {
        return dealDate <= parseISO(globalFilters.dateRange.to);
      }
      return true;
    });
  }
  
  // Apply global filters
  if (globalFilters.origins.length > 0) {
    filtered = filtered.filter(d => globalFilters.origins.includes(d.origin));
  }
  if (globalFilters.products.length > 0) {
    filtered = filtered.filter(d => globalFilters.products.includes(d.product));
  }
  if (globalFilters.owners.length > 0) {
    filtered = filtered.filter(d => globalFilters.owners.includes(d.ownerId));
  }
  
  // Apply local filters (intersection with global)
  if (localFilters) {
    if (localFilters.origins && localFilters.origins.length > 0) {
      filtered = filtered.filter(d => localFilters.origins!.includes(d.origin));
    }
    if (localFilters.products && localFilters.products.length > 0) {
      filtered = filtered.filter(d => localFilters.products!.includes(d.product));
    }
    if (localFilters.owners && localFilters.owners.length > 0) {
      filtered = filtered.filter(d => localFilters.owners!.includes(d.ownerId));
    }
    if (localFilters.dateRange?.from || localFilters.dateRange?.to) {
      filtered = filtered.filter(deal => {
        const dealDate = parseISO(deal.createdAt);
        if (localFilters.dateRange?.from && localFilters.dateRange?.to) {
          return isWithinInterval(dealDate, {
            start: parseISO(localFilters.dateRange.from),
            end: parseISO(localFilters.dateRange.to),
          });
        } else if (localFilters.dateRange?.from) {
          return dealDate >= parseISO(localFilters.dateRange.from);
        } else if (localFilters.dateRange?.to) {
          return dealDate <= parseISO(localFilters.dateRange.to);
        }
        return true;
      });
    }
  }
  
  return filtered;
}

// Calculate metric value for a group of deals
function calculateMetric(deals: Deal[], metric: string): number {
  if (!deals.length) return 0;
  
  switch (metric) {
    case "count":
      return deals.length;
    case "sum_value":
      return deals.reduce((sum, d) => sum + (d.value || 0), 0);
    case "avg_value":
      return deals.reduce((sum, d) => sum + (d.value || 0), 0) / deals.length;
    case "win_rate":
      const won = deals.filter(d => d.stage === "won").length;
      const closed = deals.filter(d => d.stage === "won" || d.stage === "lost").length;
      return closed > 0 ? (won / closed) * 100 : 0;
    default:
      // Handle dynamic sum_/avg_ metrics
      if (metric.startsWith("sum_")) {
        const field = metric.replace("sum_", "") as keyof Deal;
        return deals.reduce((sum, d) => sum + (Number(d[field]) || 0), 0);
      }
      if (metric.startsWith("avg_")) {
        const field = metric.replace("avg_", "") as keyof Deal;
        return deals.reduce((sum, d) => sum + (Number(d[field]) || 0), 0) / deals.length;
      }
      return deals.length;
  }
}

// Get chart data based on widget configuration
export function getWidgetChartData(
  deals: Deal[],
  widget: WidgetConfig,
  globalFilters: DashboardFilters,
  getUserName?: (id: string) => string
): ChartDataPoint[] {
  // Apply local filters
  const filteredDeals = applyLocalFilters(deals, globalFilters, widget.localFilters);
  
  // Apply period preset if temporal dimension
  const dimension = widget.dimension || widget.groupBy || "stage";
  const metric = widget.metric || (widget.dataKey === "count" ? "count" : "sum_value");
  const granularity = widget.granularity || "month";
  const sorting = widget.sorting || "value_desc";
  
  const column = dealsSchema.columns.find(c => c.id === dimension);
  const isTemporal = column?.type === "date";
  
  // Group deals by dimension
  const groups: Record<string, Deal[]> = {};
  
  filteredDeals.forEach(deal => {
    let key: string;
    
    if (isTemporal) {
      const dateValue = deal[dimension as keyof Deal];
      if (typeof dateValue === "string") {
        const date = parseISO(dateValue);
        key = getDateKey(date, granularity);
      } else {
        key = "unknown";
      }
    } else {
      key = String(deal[dimension as keyof Deal] || "unknown");
    }
    
    if (!groups[key]) groups[key] = [];
    groups[key].push(deal);
  });
  
  // Calculate metrics for each group
  let chartData: ChartDataPoint[] = Object.entries(groups).map(([key, groupDeals]) => {
    let name: string;
    
    if (isTemporal) {
      // Format date key to readable label
      if (granularity === "month") {
        const [year, month] = key.split("-");
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        name = format(date, "MMM/yy", { locale: ptBR });
      } else if (granularity === "quarter") {
        name = key.replace("-", " ");
      } else if (key.includes("-W")) {
        name = key.replace("-W", " Sem ");
      } else {
        name = key;
      }
    } else if (dimension === "ownerId" && getUserName) {
      name = getUserName(key);
    } else {
      name = getLabelForValue(dimension, key);
    }
    
    const metricValue = calculateMetric(groupDeals, metric);
    
    return {
      name,
      value: metricValue,
      count: groupDeals.length,
      rawKey: key,
    };
  });
  
  // Apply sorting
  switch (sorting) {
    case "label_asc":
      chartData.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "label_desc":
      chartData.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case "value_asc":
      chartData.sort((a, b) => a.value - b.value);
      break;
    case "value_desc":
      chartData.sort((a, b) => b.value - a.value);
      break;
    default:
      // For temporal data, sort chronologically
      if (isTemporal) {
        chartData.sort((a, b) => a.rawKey.localeCompare(b.rawKey));
      }
  }
  
  return chartData;
}

// Get stacked chart data with segmentation
export function getStackedChartData(
  deals: Deal[],
  widget: WidgetConfig,
  globalFilters: DashboardFilters,
  getUserName?: (id: string) => string
): { data: ChartDataPoint[]; seriesKeys: string[] } {
  const filteredDeals = applyLocalFilters(deals, globalFilters, widget.localFilters);
  
  const dimension = widget.dimension || widget.groupBy || "stage";
  const segmentation = widget.segmentation;
  const metric = widget.metric || (widget.dataKey === "count" ? "count" : "sum_value");
  const granularity = widget.granularity || "month";
  const sorting = widget.sorting || "value_desc";
  
  const column = dealsSchema.columns.find(c => c.id === dimension);
  const isTemporal = column?.type === "date";
  
  // If no segmentation, return regular data
  if (!segmentation) {
    return {
      data: getWidgetChartData(deals, widget, globalFilters, getUserName),
      seriesKeys: ["value"],
    };
  }
  
  // Group by dimension and segmentation
  const groups: Record<string, Record<string, Deal[]>> = {};
  const allSegmentValues = new Set<string>();
  
  filteredDeals.forEach(deal => {
    let dimKey: string;
    
    if (isTemporal) {
      const dateValue = deal[dimension as keyof Deal];
      if (typeof dateValue === "string") {
        const date = parseISO(dateValue);
        dimKey = getDateKey(date, granularity);
      } else {
        dimKey = "unknown";
      }
    } else {
      dimKey = String(deal[dimension as keyof Deal] || "unknown");
    }
    
    const segKey = String(deal[segmentation as keyof Deal] || "other");
    allSegmentValues.add(segKey);
    
    if (!groups[dimKey]) groups[dimKey] = {};
    if (!groups[dimKey][segKey]) groups[dimKey][segKey] = [];
    groups[dimKey][segKey].push(deal);
  });
  
  // Build chart data with segment columns
  let chartData: ChartDataPoint[] = Object.entries(groups).map(([dimKey, segments]) => {
    let name: string;
    
    if (isTemporal) {
      if (granularity === "month") {
        const [year, month] = dimKey.split("-");
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        name = format(date, "MMM/yy", { locale: ptBR });
      } else {
        name = dimKey;
      }
    } else if (dimension === "ownerId" && getUserName) {
      name = getUserName(dimKey);
    } else {
      name = getLabelForValue(dimension, dimKey);
    }
    
    const point: ChartDataPoint = {
      name,
      value: 0,
      count: 0,
      rawKey: dimKey,
    };
    
    // Add each segment value
    let totalValue = 0;
    let totalCount = 0;
    allSegmentValues.forEach(segKey => {
      const segDeals = segments[segKey] || [];
      const segValue = calculateMetric(segDeals, metric);
      point[segKey] = segValue;
      totalValue += segValue;
      totalCount += segDeals.length;
    });
    
    point.value = totalValue;
    point.count = totalCount;
    
    return point;
  });
  
  // Apply sorting
  if (isTemporal) {
    chartData.sort((a, b) => a.rawKey.localeCompare(b.rawKey));
  } else {
    switch (sorting) {
      case "label_asc":
        chartData.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "label_desc":
        chartData.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "value_asc":
        chartData.sort((a, b) => a.value - b.value);
        break;
      case "value_desc":
      default:
        chartData.sort((a, b) => b.value - a.value);
    }
  }
  
  return {
    data: chartData,
    seriesKeys: Array.from(allSegmentValues),
  };
}

// Format value based on metric type
export function formatMetricValue(value: number, metric: string): string {
  if (metric === "count") {
    return new Intl.NumberFormat("pt-BR").format(Math.round(value));
  }
  if (metric === "win_rate" || metric.includes("rate")) {
    return `${value.toFixed(1)}%`;
  }
  if (metric.startsWith("sum_") || metric.startsWith("avg_") || metric === "sum_value" || metric === "avg_value") {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
  return new Intl.NumberFormat("pt-BR").format(value);
}

// Get drill-down params from chart click
export function getDrillDownParams(
  widget: WidgetConfig,
  dataPoint: ChartDataPoint
): Record<string, string | undefined> {
  const dimension = widget.dimension || widget.groupBy || "stage";
  
  const params: Record<string, string | undefined> = {};
  
  // Add dimension filter
  params[dimension] = dataPoint.rawKey;
  
  // Add local filters if present
  if (widget.localFilters) {
    if (widget.localFilters.origins?.length) {
      params.origin = widget.localFilters.origins.join(",");
    }
    if (widget.localFilters.products?.length) {
      params.product = widget.localFilters.products.join(",");
    }
    if (widget.localFilters.owners?.length) {
      params.ownerId = widget.localFilters.owners.join(",");
    }
  }
  
  return params;
}
