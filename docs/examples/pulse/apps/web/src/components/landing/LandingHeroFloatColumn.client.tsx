"use client";

import { LandingHeroFloatCard } from "@/components/landing/LandingHeroFloatCard";
import type { LandingHeroFloatCardData } from "@/lib/landing/landing-hero-float-cards";

export type LandingHeroFloatColumnProps = {
  cards: LandingHeroFloatCardData[];
};

export function LandingHeroFloatColumn({ cards }: LandingHeroFloatColumnProps) {
  return (
    <div className="relative hidden h-[540px] lg:block">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[-60px] rounded-[60%_40%_50%_50%/50%_50%_60%_40%] bg-[radial-gradient(ellipse_75%_75%_at_55%_50%,hsl(var(--color-hero-glow)/0.35)_0%,transparent_65%)]"
      />
      {cards.map((card) => (
        <LandingHeroFloatCard key={card.id} card={card} />
      ))}
    </div>
  );
}
