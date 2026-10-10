import {
  AlertText,
  ContentText,
  Heading,
  SectionTitle,
} from "@/components/atoms";

import {
  DesignLabSection,
  VariantLabel,
} from "@/components/design-lab/DesignLabSection";
import {
  CONTENT_TEXT_VARIANTS,
  HEADING_VISUAL_LEVELS,
} from "@/lib/design-lab/matrices";

export function DesignLabTypography() {
  return (
    <DesignLabSection id="typography" title="L2 — Typography">
      <div className="space-y-10">
        <div>
          <VariantLabel>Heading visualLevel</VariantLabel>
          <div className="space-y-4">
            {HEADING_VISUAL_LEVELS.map((level) => (
              <div key={level}>
                <VariantLabel>{level}</VariantLabel>
                <Heading as="h2" visualLevel={level}>
                  The quick brown fox
                </Heading>
              </div>
            ))}
          </div>
        </div>
        <div>
          <VariantLabel>SectionTitle</VariantLabel>
          <SectionTitle as="h2">Find your perfect trainer</SectionTitle>
        </div>
        <div>
          <VariantLabel>ContentText variants</VariantLabel>
          <div className="grid gap-4 sm:grid-cols-2">
            {CONTENT_TEXT_VARIANTS.map((variant) => (
              <div
                key={variant}
                className="rounded-[var(--card-radius-md)] border border-border bg-card p-3"
              >
                <VariantLabel>{variant}</VariantLabel>
                <ContentText variant={variant}>
                  {variant === "statValue" ? "128" : "Sample copy for lab"}
                </ContentText>
              </div>
            ))}
          </div>
        </div>
        <div>
          <VariantLabel>AlertText</VariantLabel>
          <AlertText>Could not save changes. Try again.</AlertText>
        </div>
      </div>
    </DesignLabSection>
  );
}
