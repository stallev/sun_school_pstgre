"use client";

import { StatsBar } from "@/components/ui/StatsBar.client";
import { getLandingTrustMetrics } from "@/lib/landing/landing-trust-metrics";
import { useLocale, useMessages } from "@/components/i18n/LocaleProvider.client";
import { usePrefersReducedMotion } from "@/lib/ui/use-prefers-reduced-motion";

export function LandingTrustBar() {
  const messages = useMessages();
  const locale = useLocale();
  const reducedMotion = usePrefersReducedMotion();

  return (
    <StatsBar
      metrics={getLandingTrustMetrics(messages, locale)}
      animate={!reducedMotion}
    />
  );
}
