"use client";

import {
  CalendarIcon,
  CheckIcon,
  LockIcon,
  SearchIcon,
  ShieldIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";

import {
  DesignLabFeaturedTrainerCardPreview,
  DesignLabTrainerCardPreview,
} from "@/components/design-lab/DesignLabCatalogCardPreviews.client";
import { DesignLabMarketingPatternBlock } from "@/components/design-lab/DesignLabMarketingPatternBlock";
import { VariantLabel } from "@/components/design-lab/DesignLabSection";
import { BenefitRow } from "@/components/ui/BenefitRow";
import { BrandSection } from "@/components/ui/BrandSection";
import { Button } from "@/components/ui/button";
import { CtaBand } from "@/components/ui/CtaBand";
import { DarkStatTile } from "@/components/ui/DarkStatTile";
import { DiscoveryPill } from "@/components/ui/DiscoveryPill";
import { MarketingAccordion } from "@/components/ui/MarketingAccordion.client";
import { Reveal } from "@/components/ui/Reveal.client";
import { StatsBar } from "@/components/ui/StatsBar.client";
import { StepCard } from "@/components/ui/StepCard";
import { TestimonialCard } from "@/components/ui/TestimonialCard";
import { TrustFeaturePill } from "@/components/ui/TrustFeaturePill";
import {
  LANDING_FAQ_FIXTURE,
  LANDING_SPECIALTY_FIXTURE,
  LANDING_STATS_FIXTURE,
  LANDING_TRAINER_FIXTURE,
} from "@/lib/design-lab/marketing-fixtures";

export function DesignLabMarketingPatterns() {
  return (
    <>
      <DesignLabMarketingPatternBlock
        patternId="/ hero"
        title="TrustFeaturePill + Reveal"
      >
        <Reveal className="flex flex-wrap gap-2">
          <TrustFeaturePill icon={CheckIcon}>Background-checked</TrustFeaturePill>
          <TrustFeaturePill icon={LockIcon}>Secure checkout</TrustFeaturePill>
          <TrustFeaturePill icon={ShieldIcon}>Verified trainers</TrustFeaturePill>
        </Reveal>
      </DesignLabMarketingPatternBlock>

      <DesignLabMarketingPatternBlock patternId="/ #how" title="StepCard">
        <div className="grid items-stretch gap-7 md:grid-cols-3">
          <StepCard step="01" icon={SearchIcon} title="Choose your goal" description="Filter by goal, format, and budget." />
          <StepCard step="02" icon={UsersIcon} title="Find your trainer" description="Browse profiles, reviews, and availability." />
          <StepCard step="03" icon={CalendarIcon} title="Book your session" description="Pay securely and get a reminder." />
        </div>
      </DesignLabMarketingPatternBlock>

      <DesignLabMarketingPatternBlock patternId="/ specialties" title="DiscoveryPill">
        <div className="flex flex-wrap justify-center gap-3">
          {LANDING_SPECIALTY_FIXTURE.map((item) => (
            <DiscoveryPill key={item.slug} href="#marketing" label={item.label} count={item.count} />
          ))}
        </div>
      </DesignLabMarketingPatternBlock>

      <DesignLabMarketingPatternBlock patternId="/ #trainers" title="FeaturedTrainerCard vs TrainerCard">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <VariantLabel>FeaturedTrainerCard (marketing)</VariantLabel>
            <DesignLabFeaturedTrainerCardPreview trainer={LANDING_TRAINER_FIXTURE} />
          </div>
          <div>
            <VariantLabel>TrainerCard (catalog)</VariantLabel>
            <DesignLabTrainerCardPreview trainer={LANDING_TRAINER_FIXTURE} />
          </div>
        </div>
      </DesignLabMarketingPatternBlock>

      <DesignLabMarketingPatternBlock patternId="/ #reviews" title="TestimonialCard">
        <div className="grid items-stretch gap-6 md:grid-cols-3">
          <TestimonialCard quote="Flexible scheduling, 100% online — Pulse changed my relationship with working out." author="Kate L." meta="26 · Austin, TX" avatarColor="primaryLight" />
          <TestimonialCard quote="Found a trainer who actually listens. Booked in minutes." author="Maria S." meta="29 · New York" avatarColor="primary" />
          <TestimonialCard quote="Clear pricing, no surprises. Exactly what I needed." author="Alex R." meta="34 · Chicago" avatarColor="secondary" />
        </div>
      </DesignLabMarketingPatternBlock>

      <DesignLabMarketingPatternBlock patternId="/ trust bar" title="StatsBar">
        <StatsBar metrics={LANDING_STATS_FIXTURE} />
      </DesignLabMarketingPatternBlock>

      <DesignLabMarketingPatternBlock patternId="/ for-trainers" title="BenefitRow + DarkStatTile">
        <BrandSection tone="darkForest" className="py-10">
          <BenefitRow tone="onDark" icon={UsersIcon} title="Grow your client base" description="Receive booking requests from potential clients." />
          <div className="mt-6 grid grid-cols-2 items-stretch gap-4">
            <DarkStatTile value="200+" label="active trainers" />
            <DarkStatTile value="98%" label="rebook within 30 days" />
          </div>
        </BrandSection>
      </DesignLabMarketingPatternBlock>

      <DesignLabMarketingPatternBlock patternId="/ #faq" title="MarketingAccordion">
        <MarketingAccordion items={LANDING_FAQ_FIXTURE.slice(0, 3)} />
      </DesignLabMarketingPatternBlock>

      <DesignLabMarketingPatternBlock patternId="/ final CTA" title="CtaBand">
        <CtaBand
          eyebrow="Start Today"
          title={<>Your first session — <em className="text-[hsl(var(--color-secondary-light))] not-italic">this week</em></>}
          description="Choose a certified trainer and take the first step."
          actions={
            <>
              <Button asChild size="lg"><Link href="#marketing">Find My Trainer</Link></Button>
              <Button asChild variant="outline" size="lg" className="border-white/35 bg-transparent text-primary-foreground hover:bg-white/10"><Link href="#marketing">Apply as a Trainer</Link></Button>
            </>
          }
          footnotes={<TrustFeaturePill icon={CheckIcon} className="border-white/20 bg-transparent text-primary-foreground/60">No subscription</TrustFeaturePill>}
        />
      </DesignLabMarketingPatternBlock>
    </>
  );
}
