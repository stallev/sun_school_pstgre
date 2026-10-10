"use client";

import { ContentText, SectionEyebrow } from "@/components/atoms";
import { DesignLabMarketingPatternBlock } from "@/components/design-lab/DesignLabMarketingPatternBlock";
import { BrandSection } from "@/components/ui/BrandSection";
import { Container } from "@/components/ui/container";
import { MarketingSectionHeader } from "@/components/ui/MarketingSectionHeader";

export function DesignLabMarketingWaveA() {
  return (
    <>
      <DesignLabMarketingPatternBlock
        patternId="/"
        title="Wave A — SectionEyebrow tones"
      >
        <div className="flex flex-wrap gap-3">
          <SectionEyebrow>Default</SectionEyebrow>
          <SectionEyebrow tone="outline">Outline</SectionEyebrow>
          <div className="rounded-xl bg-brand-band p-4">
            <SectionEyebrow tone="onDark">On dark</SectionEyebrow>
          </div>
          <div className="rounded-xl bg-primary p-4">
            <SectionEyebrow tone="onPrimary">On primary</SectionEyebrow>
          </div>
        </div>
      </DesignLabMarketingPatternBlock>

      <DesignLabMarketingPatternBlock
        patternId="/"
        title="Wave A — Container marketing"
      >
        <Container
          variant="marketing"
          className="rounded-xl border border-dashed border-border bg-muted/40 py-6 text-center"
        >
          <ContentText variant="small" as="p">
            max-w 1280px · px-6 md:px-14
          </ContentText>
        </Container>
      </DesignLabMarketingPatternBlock>

      <DesignLabMarketingPatternBlock
        patternId="/"
        title="Wave A — MarketingSectionHeader"
      >
        <MarketingSectionHeader
          label="How It Works"
          title="Get started in 3 minutes"
          subtitle="From choosing your goal to your first session — it's that simple."
        />
        <BrandSection tone="darkForest" className="py-12">
          <MarketingSectionHeader
            tone="onDark"
            label="For Trainers"
            title={
              <>
                Grow your practice{" "}
                <em className="text-[hsl(var(--color-secondary-light))] not-italic">
                  with Pulse
                </em>
              </>
            }
            subtitle="Join certified professionals — we handle the rest."
          />
        </BrandSection>
      </DesignLabMarketingPatternBlock>
    </>
  );
}
