"use client";

import { ContentText } from "@/components/atoms";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher.client";
import {
  DesignLabSection,
  VariantLabel,
} from "@/components/design-lab/DesignLabSection";

export function DesignLabSettings() {
  return (
    <DesignLabSection id="settings" title="L2 — Locale switcher">
      <ContentText variant="muted" as="p">
        Product routes use <code className="font-mono text-xs">LocaleSwitcher</code>{" "}
        with cookie-backed locale (ADR-009). Variants mirror marketing nav, footer, and
        profile settings row.
      </ContentText>

      <div className="space-y-8">
        <div>
          <VariantLabel>compact — top bar / landing nav</VariantLabel>
          <LocaleSwitcher variant="compact" />
        </div>
        <div>
          <VariantLabel>footer — marketing footer</VariantLabel>
          <LocaleSwitcher variant="footer" />
        </div>
        <div className="max-w-md rounded-2xl border border-border p-4">
          <VariantLabel>settingsRow — profile language row</VariantLabel>
          <div className="flex items-center justify-between gap-4">
            <ContentText variant="smallEmphasis" as="span">
              Language
            </ContentText>
            <LocaleSwitcher variant="settingsRow" />
          </div>
        </div>
      </div>
    </DesignLabSection>
  );
}
