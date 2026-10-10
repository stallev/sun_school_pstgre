import { ContentText, Heading } from "@/components/atoms";
import { RatingStars } from "@/components/ui/RatingStars";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import type { LandingHeroFloatCardData } from "@/lib/landing/landing-hero-float-cards";
import { cn } from "@/lib/utils";

const TONE_CLASSES = {
  forest:
    "bg-gradient-to-br from-[hsl(var(--color-primary-light))] to-primary",
  gold: "bg-gradient-to-br from-secondary to-[hsl(var(--color-secondary-hover))]",
  slate:
    "bg-gradient-to-br from-[hsl(var(--color-ink-2))] to-[hsl(var(--color-ink-3))]",
} as const;

export type LandingHeroFloatCardProps = {
  card: LandingHeroFloatCardData;
};

export function LandingHeroFloatCard({ card }: LandingHeroFloatCardProps) {
  return (
    <div
      style={card.style}
      className="cursor-default overflow-hidden rounded-[20px] bg-card shadow-[var(--shadow-float-card)] transition-transform duration-300 hover:-translate-y-2.5"
    >
      <div
        className={cn(
          "relative flex h-32 items-center justify-center overflow-hidden",
          TONE_CLASSES[card.tone],
        )}
      >
        <span
          aria-hidden
          className="font-heading text-[44px] italic text-primary-foreground/55"
        >
          {card.initials}
        </span>
        <VerifiedBadge
          iconOnly
          className="absolute top-2 right-2 z-10 shadow-sm"
        >
          Verified
        </VerifiedBadge>
      </div>
      <div className="p-3.5">
        <ContentText variant="smallEmphasis" as="p" className="mb-0.5">
          {card.name}
        </ContentText>
        <ContentText variant="muted" as="p" className="mb-2 text-[12px]">
          {card.spec}
        </ContentText>
        <div className="mb-1.5 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <RatingStars value={Number(card.rating)} size="sm" />
            <ContentText variant="small" as="span">
              {card.rating}
            </ContentText>
          </div>
          <span className="rounded-full bg-primary-container px-1.5 py-0.5 text-[11px] font-semibold text-primary">
            {card.cert}
          </span>
        </div>
        <Heading as="h3" visualLevel="h6" variant="brand" className="font-sans text-[13px] font-bold">
          {card.price}
        </Heading>
      </div>
    </div>
  );
}
