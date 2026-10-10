"use client";

import { useEffect, useRef, useState } from "react";

import { Container } from "@/components/ui/container";
import { StatMetricCell } from "@/components/ui/StatMetricCell";
import { useCountUp } from "@/lib/ui/use-count-up";
import { DEFAULT_LOCALE } from "@/lib/i18n/constants";
import { formatNumber } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";

export type StatsBarMetric = {
  id: string;
  target: number;
  format?: (value: number) => React.ReactNode;
  label: React.ReactNode;
};

export type StatsBarProps = {
  metrics: StatsBarMetric[];
  animate?: boolean;
  className?: string;
};

function defaultFormat(value: number): React.ReactNode {
  return `${formatNumber(value, DEFAULT_LOCALE)}+`;
}

export function StatsBar({
  metrics,
  animate = true,
  className,
}: StatsBarProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!animate || !ref.current) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [animate]);

  return (
    <div
      ref={ref}
      className={cn("bg-brand-band text-on-brand-band", className)}
    >
      <Container
        variant="marketing"
        className="grid grid-cols-2 md:grid-cols-4"
      >
        {metrics.map((metric) => (
          <StatsBarCell
            key={metric.id}
            metric={metric}
            active={visible}
            animate={animate}
          />
        ))}
      </Container>
    </div>
  );
}

function StatsBarCell({
  metric,
  active,
  animate,
}: {
  metric: StatsBarMetric;
  active: boolean;
  animate: boolean;
}) {
  const count = useCountUp(metric.target, active && animate);
  const format = metric.format ?? defaultFormat;
  const value = animate ? format(count) : format(metric.target);

  return <StatMetricCell value={value} label={metric.label} />;
}
