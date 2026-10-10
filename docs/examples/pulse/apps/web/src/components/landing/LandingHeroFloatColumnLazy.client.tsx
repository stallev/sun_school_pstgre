"use client";

import dynamic from "next/dynamic";

import type { LandingHeroFloatCardData } from "@/lib/landing/landing-hero-float-cards";

const LandingHeroFloatColumn = dynamic(
  () =>
    import("@/components/landing/LandingHeroFloatColumn.client").then(
      (module) => ({ default: module.LandingHeroFloatColumn }),
    ),
  { ssr: false },
);

export type LandingHeroFloatColumnLazyProps = {
  cards: LandingHeroFloatCardData[];
};

export function LandingHeroFloatColumnLazy({
  cards,
}: LandingHeroFloatColumnLazyProps) {
  return <LandingHeroFloatColumn cards={cards} />;
}
