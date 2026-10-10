import { ContentText } from "@/components/atoms";

import {
  DesignLabSection,
  VariantLabel,
} from "@/components/design-lab/DesignLabSection";

const BRAND_SWATCHES = [
  { label: "primary", className: "bg-primary" },
  { label: "secondary (gold)", className: "bg-secondary" },
  { label: "background", className: "bg-background border border-border" },
  { label: "card", className: "bg-card border border-border" },
  { label: "muted", className: "bg-muted" },
  { label: "destructive", className: "bg-destructive" },
] as const;

const STATUS_SWATCHES = [
  { label: "success text", className: "bg-[color:var(--green-text)]" },
  { label: "green soft", className: "bg-[color:var(--green-soft)]" },
  { label: "amber soft", className: "bg-[color:var(--amber-soft)]" },
  { label: "gold", className: "bg-[color:var(--gold)]" },
] as const;

export function DesignLabTokenSwatches() {
  return (
    <DesignLabSection id="tokens" title="L1 — Tokens">
      <div className="space-y-8">
        <div>
          <VariantLabel>Brand & surfaces</VariantLabel>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {BRAND_SWATCHES.map((swatch) => (
              <div key={swatch.label} className="space-y-2">
                <div
                  className={`h-14 rounded-[var(--card-radius-md)] ${swatch.className}`}
                />
                <ContentText variant="mutedMicro" as="p">
                  {swatch.label}
                </ContentText>
              </div>
            ))}
          </div>
        </div>
        <div>
          <VariantLabel>Status & accent</VariantLabel>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {STATUS_SWATCHES.map((swatch) => (
              <div key={swatch.label} className="space-y-2">
                <div
                  className={`h-14 rounded-[var(--card-radius-md)] ${swatch.className}`}
                />
                <ContentText variant="mutedMicro" as="p">
                  {swatch.label}
                </ContentText>
              </div>
            ))}
          </div>
        </div>
        <div>
          <VariantLabel>Radius samples</VariantLabel>
          <div className="flex flex-wrap gap-3">
            {[
              ["sm", "var(--card-radius-sm)"],
              ["md", "var(--card-radius-md)"],
              ["lg", "var(--card-radius-lg)"],
              ["xl", "var(--card-radius-xl)"],
            ].map(([name, radius]) => (
              <div
                key={name}
                className="flex h-16 w-16 items-center justify-center border border-border bg-card font-mono text-xs"
                style={{ borderRadius: radius }}
              >
                {name}
              </div>
            ))}
          </div>
        </div>
        <div>
          <VariantLabel>Elevation</VariantLabel>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["card", "var(--shadow-card)"],
              ["hover", "var(--shadow-hover)"],
              ["overlay", "var(--shadow-overlay)"],
            ].map(([name, shadow]) => (
              <div
                key={name}
                className="rounded-[var(--card-radius-lg)] border border-border bg-card p-4"
                style={{ boxShadow: shadow }}
              >
                <ContentText variant="small" as="p">
                  {name}
                </ContentText>
              </div>
            ))}
          </div>
        </div>
        <div>
          <VariantLabel>Type scale</VariantLabel>
          <div className="space-y-3 rounded-[var(--card-radius-lg)] border border-border bg-card p-4">
            <p className="font-heading text-[clamp(2rem,4vw,2.5rem)]">
              font-heading — Source Serif 4
            </p>
            <p className="font-sans text-base">font-sans — Manrope body</p>
            <p className="font-mono text-sm">font-mono — JetBrains Mono 14:30</p>
          </div>
        </div>
      </div>
    </DesignLabSection>
  );
}
