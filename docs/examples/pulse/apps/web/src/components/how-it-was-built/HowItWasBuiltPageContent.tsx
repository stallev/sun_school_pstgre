import { Suspense } from "react";

import { HowItWasBuiltArchitecture } from "@/components/how-it-was-built/HowItWasBuiltArchitecture";
import { HowItWasBuiltCta } from "@/components/how-it-was-built/HowItWasBuiltCta";
import { HowItWasBuiltDeveloper } from "@/components/how-it-was-built/HowItWasBuiltDeveloper";
import { HowItWasBuiltHero } from "@/components/how-it-was-built/HowItWasBuiltHero";
import { HowItWasBuiltMethodology } from "@/components/how-it-was-built/HowItWasBuiltMethodology";
import { HowItWasBuiltObservability } from "@/components/how-it-was-built/HowItWasBuiltObservability";
import { HowItWasBuiltOverview } from "@/components/how-it-was-built/HowItWasBuiltOverview";
import { HowItWasBuiltProduct } from "@/components/how-it-was-built/HowItWasBuiltProduct";
import { HowItWasBuiltRoadmap } from "@/components/how-it-was-built/HowItWasBuiltRoadmap";
import { HowItWasBuiltStack } from "@/components/how-it-was-built/HowItWasBuiltStack";
import { HowItWasBuiltTimeline } from "@/components/how-it-was-built/HowItWasBuiltTimeline";
import {
  HowItWasBuiltTocDesktop,
  HowItWasBuiltTocMobile,
  HowItWasBuiltTocProvider,
} from "@/components/how-it-was-built/HowItWasBuiltToc.client";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingFooterSkeleton } from "@/components/landing/LandingFooterSkeleton";
import { MarketingNav } from "@/components/landing/MarketingNav.server";
import { Container } from "@/components/ui/container";

export function HowItWasBuiltPageContent() {
  return (
    <HowItWasBuiltTocProvider>
      <MarketingNav />
      <HowItWasBuiltHero />
      <Container variant="marketing" className="pb-12 md:pb-16">
        <HowItWasBuiltTocMobile />
        <div className="grid gap-12 pt-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16 lg:pt-12">
          <HowItWasBuiltTocDesktop />
          <div className="min-w-0 space-y-16 md:space-y-20">
            <HowItWasBuiltOverview />
            <HowItWasBuiltTimeline />
            <HowItWasBuiltProduct />
            <HowItWasBuiltArchitecture />
            <HowItWasBuiltMethodology />
            <HowItWasBuiltRoadmap />
            <HowItWasBuiltStack />
            <HowItWasBuiltObservability />
            <HowItWasBuiltDeveloper />
          </div>
        </div>
      </Container>
      <HowItWasBuiltCta />
      <Suspense fallback={<LandingFooterSkeleton />}>
        <LandingFooter />
      </Suspense>
    </HowItWasBuiltTocProvider>
  );
}
