"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SchoolChartSeries } from "@/data/analytics/load-school-analytics-page.server";
import {
  formatAnalyticsPercent,
  formatAnalyticsShortDate,
} from "@/lib/analytics/format-analytics-display";

const CHART_HEIGHT_PX = 240;
const CHART_TICK = { fill: "var(--color-muted-foreground)", fontSize: 14 } as const;

const SERIES_COLORS = [
  "var(--color-cobalt-ink)",
  "var(--color-ok)",
  "var(--color-warn)",
  "var(--color-ink-2)",
];

type SchoolAttendanceChartProps = {
  labels: string[];
  series: SchoolChartSeries[];
  locale: string;
  percentTemplate: string;
  ariaLabel: string;
};

export const SchoolAttendanceChart = ({
  labels,
  series,
  locale,
  percentTemplate,
  ariaLabel,
}: SchoolAttendanceChartProps) => {
  const formatLabel = (dateIso: string) => formatAnalyticsShortDate(dateIso, locale);
  const formatPercent = (value: number) => formatAnalyticsPercent(percentTemplate, value);
  const rows = labels.map((date) => {
    const row: Record<string, string | number | null> = { date };
    for (const item of series) {
      const point = item.points.find((p) => p.lessonDate === date);
      row[item.gradeId] = point?.value ?? null;
    }
    return row;
  });

  if (rows.length === 0) return null;

  return (
    <div className="w-full" role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height={CHART_HEIGHT_PX}>
        <LineChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-line" vertical={false} />
          <XAxis dataKey="date" tickFormatter={formatLabel} tick={CHART_TICK} tickLine={false} axisLine={false} />
          <YAxis
            domain={[0, 100]}
            tick={CHART_TICK}
            tickFormatter={(v) => formatPercent(Number(v))}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip
            labelFormatter={(label) => formatLabel(String(label))}
            formatter={(value) => [formatPercent(Number(value)), ""]}
          />
          <Legend />
          {series.map((item, index) => (
            <Line
              key={item.gradeId}
              type="monotone"
              dataKey={item.gradeId}
              name={item.gradeName}
              stroke={SERIES_COLORS[index % SERIES_COLORS.length]}
              strokeWidth={2}
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
