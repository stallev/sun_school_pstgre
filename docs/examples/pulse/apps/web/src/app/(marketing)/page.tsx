import type { Metadata } from "next";
import { Suspense } from "react";

import { LandingAuthenticatedRedirect } from "@/components/landing/LandingAuthenticatedRedirect.server";
import { LandingFaq } from "@/components/landing/LandingFaq.client";
import { LandingFeaturedTrainers } from "@/components/landing/LandingFeaturedTrainers.server";
import { LandingFeaturedTrainersSkeleton } from "@/components/landing/LandingFeaturedTrainersSkeleton";
import { LandingFinalCta } from "@/components/landing/LandingFinalCta";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingFooterSkeleton } from "@/components/landing/LandingFooterSkeleton";
import { LandingForTrainers } from "@/components/landing/LandingForTrainers";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingHowItWorks } from "@/components/landing/LandingHowItWorks";
import { LandingJsonLd } from "@/components/landing/LandingJsonLd";
import { LandingNav } from "@/components/landing/LandingNav.server";
import { LandingSpecialtyPills } from "@/components/landing/LandingSpecialtyPills";
import { LandingTestimonials } from "@/components/landing/LandingTestimonials";
import { LandingTrustBar } from "@/components/landing/LandingTrustBar.client";
import { buildLandingMetadata } from "@/lib/landing/landing-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildLandingMetadata();
}

export default function HomePage() {
  return (
    <>
      <LandingJsonLd />
      <Suspense fallback={null}>
        <LandingAuthenticatedRedirect />
      </Suspense>
      <LandingNav />
      <LandingHero />
      <LandingTrustBar />
      <LandingHowItWorks />
      <LandingSpecialtyPills />
      <Suspense fallback={<LandingFeaturedTrainersSkeleton />}>
        <LandingFeaturedTrainers />
      </Suspense>
      <LandingTestimonials />
      <LandingForTrainers />
      <LandingFaq />
      <LandingFinalCta />
      <Suspense fallback={<LandingFooterSkeleton />}>
        <LandingFooter />
      </Suspense>
    </>
  );
}
