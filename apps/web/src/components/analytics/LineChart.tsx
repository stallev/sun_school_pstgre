"use client";

import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AnalyticsChartPoint } from "@/data/analytics/analytics-compute.server";

export type AnalyticsLineChartProps = {
  points: AnalyticsChartPoint[];
  formatLabel: (dateIso: string) => string;
  formatValue: (point: AnalyticsChartPoint) => string;
  yDomain?: [number, number];
  ariaLabel: string;
};

const CHART_HEIGHT_PX = 280;
const CHART_TICK = { fill: "var(--color-muted-foreground)", fontSize: 14 } as const;

type ChartRow = {
  date: string;
  value: number;
  observationCount: number;
};

export const LineChart = ({
  points,
  formatLabel,
  formatValue,
  yDomain,
  ariaLabel,
}: AnalyticsLineChartProps) => {
  const rows: ChartRow[] = points
    .filter((point) => point.value !== null)
    .map((point) => ({
      date: point.lessonDate,
      value: point.value as number,
      observationCount: point.observationCount,
    }));

  return (
    <div className="w-full" role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height={CHART_HEIGHT_PX}>
        <RechartsLineChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-line)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatLabel}
            tick={CHART_TICK}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={yDomain ?? ["auto", "auto"]}
            tick={CHART_TICK}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip
            formatter={(value, _name, item) => {
              const payload = item.payload as ChartRow;
              const numericValue = typeof value === "number" ? value : Number(value);
              return [
                formatValue({
                  lessonId: "",
                  lessonDate: payload.date,
                  value: numericValue,
                  observationCount: payload.observationCount,
                }),
                "",
              ];
            }}
            labelFormatter={(label) => formatLabel(String(label))}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--color-cobalt-ink)"
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--color-cobalt-ink)" }}
            isAnimationActive={false}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};
