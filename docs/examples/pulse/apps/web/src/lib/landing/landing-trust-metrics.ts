import type { StatsBarMetric } from "@/components/ui/StatsBar.client";
import { formatNumber } from "@/lib/i18n/format";

import type { AppLocale } from "@/lib/i18n/constants";
import type { Messages } from "@/lib/messages/types";

const LANDING_TRUST_FORMATTERS: Record<
  string,
  (value: number, locale: AppLocale) => React.ReactNode
> = {
  trainers: (value) => `${value}+`,
  sessions: (value, locale) => `${formatNumber(value, locale)}+`,
  satisfaction: (value) => `${value}%`,
  rating: (value) => `${(value / 10).toFixed(1)}★`,
};

export function getLandingTrustMetrics(
  messages: Messages,
  locale: AppLocale,
): StatsBarMetric[] {
  return messages.landing.trustBar.metrics.map((metric) => ({
    id: metric.id,
    target: metric.target,
    label: metric.label,
    format: (value: number) => LANDING_TRUST_FORMATTERS[metric.id]?.(value, locale),
  }));
}
