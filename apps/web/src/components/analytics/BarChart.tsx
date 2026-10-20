"use client";

import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type AnalyticsBarChartProps = {
  labels: string[];
  values: (number | null)[];
  formatLabel: (dateIso: string) => string;
  formatValue: (value: number) => string;
  positiveClassName?: string;
  negativeClassName?: string;
  yDomain: [number, number];
  xLabel?: string;
  ariaLabel: string;
};

const CHART_HEIGHT_PX = 192;
const CHART_TICK = { fill: "var(--color-muted-foreground)", fontSize: 14 } as const;

type ChartRow = {
  date: string;
  value: number;
};

export const BarChart = ({
  labels,
  values,
  formatLabel,
  formatValue,
  positiveClassName = "fill-cobalt-ink",
  negativeClassName = "fill-danger",
  yDomain,
  xLabel,
  ariaLabel,
}: AnalyticsBarChartProps) => {
  const rows: ChartRow[] = labels
    .map((date, index) => {
      const value = values[index];
      if (value === null || value === undefined) return null;
      return { date, value };
    })
    .filter((row): row is ChartRow => row !== null);

  if (rows.length === 0) return null;

  return (
    <div className="flex w-full flex-col gap-1" role="img" aria-label={ariaLabel}>
      {xLabel ? (
        <p className="text-center text-sm text-muted-foreground">{xLabel}</p>
      ) : null}
      <ResponsiveContainer width="100%" height={CHART_HEIGHT_PX}>
        <RechartsBarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-line" vertical={false} />
          <XAxis dataKey="date" tickFormatter={formatLabel} tick={CHART_TICK} tickLine={false} axisLine={false} />
          <YAxis domain={yDomain} tick={CHART_TICK} tickLine={false} axisLine={false} width={40} />
          <Tooltip
            formatter={(value) => formatValue(typeof value === "number" ? value : Number(value ?? 0))}
            labelFormatter={(label) => formatLabel(String(label))}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {rows.map((row) => (
              <Cell
                key={row.date}
                className={row.value >= 0 ? positiveClassName : negativeClassName}
              />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};
