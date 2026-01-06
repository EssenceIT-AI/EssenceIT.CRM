import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { WidgetConfig, DashboardFilters } from "@/stores/dashboardStore";
import { Deal } from "@/types";
import {
  getWidgetChartData,
  getStackedChartData,
  formatMetricValue,
  getDrillDownParams,
  getLabelForValue,
  ChartDataPoint,
} from "@/lib/widgetDataHelpers";
import { buildDrillDownUrl } from "@/lib/dashboardHelpers";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line,
  Legend,
} from "recharts";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(210, 70%, 60%)",
  "hsl(280, 60%, 55%)",
  "hsl(30, 80%, 55%)",
];

interface DynamicChartProps {
  widget: WidgetConfig;
  deals: Deal[];
  globalFilters: DashboardFilters;
  getUserName?: (id: string) => string;
}

export function DynamicChart({ widget, deals, globalFilters, getUserName }: DynamicChartProps) {
  const navigate = useNavigate();
  
  const metric = widget.metric || (widget.dataKey === "count" ? "count" : "sum_value");
  const hasSegmentation = !!widget.segmentation && ["bar", "area", "line"].includes(widget.type);
  
  const { chartData, seriesKeys } = useMemo(() => {
    if (hasSegmentation) {
      const result = getStackedChartData(deals, widget, globalFilters, getUserName);
      return { chartData: result.data, seriesKeys: result.seriesKeys };
    }
    return {
      chartData: getWidgetChartData(deals, widget, globalFilters, getUserName),
      seriesKeys: ["value"],
    };
  }, [deals, widget, globalFilters, getUserName, hasSegmentation]);
  
  const handleClick = (data: ChartDataPoint) => {
    const params = getDrillDownParams(widget, data);
    navigate(buildDrillDownUrl(params));
  };
  
  const formatTooltip = (value: number) => formatMetricValue(value, metric);
  
  const formatYAxis = (value: number) => {
    if (metric === "count") return value.toString();
    if (metric === "win_rate") return `${value}%`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value.toString();
  };
  
  // Render based on widget type
  switch (widget.type) {
    case "bar":
      return (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={chartData}
            layout={widget.dimension === "stage" ? "vertical" : "horizontal"}
            onClick={(e) => e?.activePayload?.[0]?.payload && handleClick(e.activePayload[0].payload)}
            style={{ cursor: "pointer" }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            {widget.dimension === "stage" ? (
              <>
                <XAxis type="number" tickFormatter={formatYAxis} className="text-xs" />
                <YAxis dataKey="name" type="category" width={90} className="text-xs" />
              </>
            ) : (
              <>
                <XAxis dataKey="name" className="text-xs" />
                <YAxis tickFormatter={formatYAxis} className="text-xs" />
              </>
            )}
            <Tooltip formatter={formatTooltip} />
            {widget.showLegend && hasSegmentation && <Legend />}
            {hasSegmentation ? (
              seriesKeys.map((key, idx) => (
                <Bar
                  key={key}
                  dataKey={key}
                  name={getLabelForValue(widget.segmentation!, key)}
                  stackId="stack"
                  fill={COLORS[idx % COLORS.length]}
                  radius={idx === seriesKeys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                />
              ))
            ) : (
              <Bar
                dataKey="value"
                fill="hsl(var(--primary))"
                radius={widget.dimension === "stage" ? [0, 4, 4, 0] : [4, 4, 0, 0]}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      );
      
    case "line":
      return (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart
            data={chartData}
            onClick={(e) => e?.activePayload?.[0]?.payload && handleClick(e.activePayload[0].payload)}
            style={{ cursor: "pointer" }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" className="text-xs" />
            <YAxis tickFormatter={formatYAxis} className="text-xs" />
            <Tooltip formatter={formatTooltip} />
            {widget.showLegend && hasSegmentation && <Legend />}
            {hasSegmentation ? (
              seriesKeys.map((key, idx) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={getLabelForValue(widget.segmentation!, key)}
                  stroke={COLORS[idx % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              ))
            ) : (
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      );
      
    case "area":
      return (
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart
            data={chartData}
            onClick={(e) => e?.activePayload?.[0]?.payload && handleClick(e.activePayload[0].payload)}
            style={{ cursor: "pointer" }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" className="text-xs" />
            <YAxis tickFormatter={formatYAxis} className="text-xs" />
            <Tooltip formatter={formatTooltip} />
            {widget.showLegend && hasSegmentation && <Legend />}
            {hasSegmentation ? (
              seriesKeys.map((key, idx) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={getLabelForValue(widget.segmentation!, key)}
                  stackId="stack"
                  stroke={COLORS[idx % COLORS.length]}
                  fill={COLORS[idx % COLORS.length]}
                  fillOpacity={0.4}
                />
              ))
            ) : (
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.3}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      );
      
    case "pie":
      return (
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={widget.showLabels ? ({ name }) => name : false}
              onClick={(data) => handleClick(data)}
              style={{ cursor: "pointer" }}
            >
              {chartData.map((_, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={formatTooltip} />
            {widget.showLegend !== false && <Legend />}
          </PieChart>
        </ResponsiveContainer>
      );
      
    default:
      return null;
  }
}
