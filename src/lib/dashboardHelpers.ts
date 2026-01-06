import { Deal } from "@/types";
import { DashboardFilters } from "@/stores/dashboardStore";
import { format, parseISO, differenceInDays, startOfMonth, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface DashboardAggregations {
  pipeTotal: number;
  forecast: number;
  winRate: number;
  avgCycle: number;
  avgTicket: number;
  byMonth: Record<string, { count: number; value: number }>;
  byOrigin: Record<string, { count: number; value: number }>;
  byStage: Record<string, { count: number; value: number }>;
  byProduct: Record<string, { count: number; value: number }>;
  byOwner: Record<string, { count: number; value: number }>;
  funnelData: { stage: string; count: number; value: number }[];
  monthlyByOrigin: Record<string, Record<string, number>>; // month -> origin -> count
}

// Stage probabilities for forecast
const stageProbabilities: Record<string, number> = {
  prospecting: 0.1,
  qualification: 0.2,
  proposal: 0.5,
  negotiation: 0.7,
  closing: 0.9,
  won: 1,
  lost: 0,
};

// Stage order for funnel
const stageOrder = ["prospecting", "qualification", "proposal", "negotiation", "closing", "won"];

// Origin labels
export const originLabels: Record<string, string> = {
  inbound: "Inbound",
  outbound: "Outbound - SDR",
  marketing: "Marketing",
  referral: "Indicação",
  partner: "Parceiros",
  event: "Eventos",
  whatsapp: "WhatsApp SDR",
};

// Stage labels
export const stageLabels: Record<string, string> = {
  prospecting: "Prospecção",
  qualification: "Qualificação",
  proposal: "Proposta",
  negotiation: "Negociação",
  closing: "Fechamento",
  won: "Ganho",
  lost: "Perdido",
};

// Product labels
export const productLabels: Record<string, string> = {
  VAR: "VAR",
  COM: "COM",
  AMS: "AMS",
};

export function getFilteredDeals(deals: Deal[], filters: DashboardFilters): Deal[] {
  return deals.filter((deal) => {
    // Date range filter
    if (filters.dateRange.from || filters.dateRange.to) {
      const dealDate = parseISO(deal.createdAt);
      if (filters.dateRange.from && filters.dateRange.to) {
        if (!isWithinInterval(dealDate, {
          start: parseISO(filters.dateRange.from),
          end: parseISO(filters.dateRange.to),
        })) {
          return false;
        }
      } else if (filters.dateRange.from) {
        if (dealDate < parseISO(filters.dateRange.from)) return false;
      } else if (filters.dateRange.to) {
        if (dealDate > parseISO(filters.dateRange.to)) return false;
      }
    }

    // Origin filter
    if (filters.origins.length > 0 && !filters.origins.includes(deal.origin)) {
      return false;
    }

    // Product filter
    if (filters.products.length > 0 && !filters.products.includes(deal.product)) {
      return false;
    }

    // Owner filter
    if (filters.owners.length > 0 && !filters.owners.includes(deal.ownerId)) {
      return false;
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (!deal.name.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    return true;
  });
}

export function calculateAggregations(deals: Deal[], meta: number = 1000000): DashboardAggregations {
  const openDeals = deals.filter((d) => d.stage !== "won" && d.stage !== "lost");
  const wonDeals = deals.filter((d) => d.stage === "won");
  const lostDeals = deals.filter((d) => d.stage === "lost");

  // Pipe total (open deals)
  const pipeTotal = openDeals.reduce((sum, d) => sum + d.value, 0);

  // Forecast (weighted by probability)
  const forecast = openDeals.reduce((sum, d) => {
    const prob = stageProbabilities[d.stage] || 0;
    return sum + d.value * prob;
  }, 0);

  // Win rate
  const closedDeals = wonDeals.length + lostDeals.length;
  const winRate = closedDeals > 0 ? (wonDeals.length / closedDeals) * 100 : 0;

  // Average cycle (won deals only)
  const avgCycle = wonDeals.length > 0
    ? wonDeals.reduce((sum, d) => {
        const created = parseISO(d.createdAt);
        const closed = d.closedAt ? parseISO(d.closedAt) : new Date();
        return sum + differenceInDays(closed, created);
      }, 0) / wonDeals.length
    : 0;

  // Average ticket (won deals only)
  const avgTicket = wonDeals.length > 0
    ? wonDeals.reduce((sum, d) => sum + d.value, 0) / wonDeals.length
    : 0;

  // By month
  const byMonth: Record<string, { count: number; value: number }> = {};
  deals.forEach((d) => {
    const monthKey = format(parseISO(d.createdAt), "yyyy-MM");
    if (!byMonth[monthKey]) byMonth[monthKey] = { count: 0, value: 0 };
    byMonth[monthKey].count++;
    byMonth[monthKey].value += d.value;
  });

  // By origin
  const byOrigin: Record<string, { count: number; value: number }> = {};
  deals.forEach((d) => {
    if (!byOrigin[d.origin]) byOrigin[d.origin] = { count: 0, value: 0 };
    byOrigin[d.origin].count++;
    byOrigin[d.origin].value += d.value;
  });

  // By stage
  const byStage: Record<string, { count: number; value: number }> = {};
  deals.forEach((d) => {
    if (!byStage[d.stage]) byStage[d.stage] = { count: 0, value: 0 };
    byStage[d.stage].count++;
    byStage[d.stage].value += d.value;
  });

  // By product
  const byProduct: Record<string, { count: number; value: number }> = {};
  deals.forEach((d) => {
    if (!byProduct[d.product]) byProduct[d.product] = { count: 0, value: 0 };
    byProduct[d.product].count++;
    byProduct[d.product].value += d.value;
  });

  // By owner
  const byOwner: Record<string, { count: number; value: number }> = {};
  deals.forEach((d) => {
    if (!byOwner[d.ownerId]) byOwner[d.ownerId] = { count: 0, value: 0 };
    byOwner[d.ownerId].count++;
    byOwner[d.ownerId].value += d.value;
  });

  // Funnel data
  const funnelData = stageOrder.map((stage) => ({
    stage,
    count: byStage[stage]?.count || 0,
    value: byStage[stage]?.value || 0,
  }));

  // Monthly by origin (for stacked chart)
  const monthlyByOrigin: Record<string, Record<string, number>> = {};
  deals.forEach((d) => {
    const monthKey = format(parseISO(d.createdAt), "yyyy-MM");
    if (!monthlyByOrigin[monthKey]) monthlyByOrigin[monthKey] = {};
    if (!monthlyByOrigin[monthKey][d.origin]) monthlyByOrigin[monthKey][d.origin] = 0;
    monthlyByOrigin[monthKey][d.origin]++;
  });

  return {
    pipeTotal,
    forecast,
    winRate,
    avgCycle,
    avgTicket,
    byMonth,
    byOrigin,
    byStage,
    byProduct,
    byOwner,
    funnelData,
    monthlyByOrigin,
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function getMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return format(date, "MMM/yy", { locale: ptBR });
}

// Export data as CSV
export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers.map((h) => {
        const value = row[h];
        if (typeof value === "string" && value.includes(",")) {
          return `"${value}"`;
        }
        return String(value ?? "");
      }).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
}

// Export chart as PNG (simplified mock)
export function exportToPNG(elementId: string, filename: string): void {
  const element = document.getElementById(elementId);
  if (!element) return;

  // Use html2canvas if available, otherwise just alert
  import("html2canvas").then(({ default: html2canvas }) => {
    html2canvas(element).then((canvas) => {
      const link = document.createElement("a");
      link.download = `${filename}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    });
  }).catch(() => {
    console.warn("PNG export requires html2canvas library");
  });
}

// Build drill-down URL
export function buildDrillDownUrl(params: Record<string, string | undefined>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParams.set(key, value);
  });
  return `/negocios?${searchParams.toString()}`;
}
