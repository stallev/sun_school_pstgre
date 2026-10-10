import Link from "next/link";

import { ContentText, Heading } from "@/components/atoms";
import { PulseCard } from "@/components/ui/card";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { RatingStars } from "@/components/ui/RatingStars";
import { SpecChip } from "@/components/ui/SpecChip";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import type { CatalogTrainerCard } from "@/lib/catalog/catalog-trainer-card";
import { formatMoney } from "@/lib/format-money";
import type { AppLocale } from "@/lib/i18n/constants";
import type { Messages } from "@/lib/messages";
import { cn } from "@/lib/utils";

export type FeaturedTrainerCardViewProps = {
  trainer: CatalogTrainerCard;
  messages: Messages;
  locale: AppLocale;
  className?: string;
  imagePriority?: boolean;
};

function getFeaturedTagline(trainer: CatalogTrainerCard): string {
  if (trainer.bio?.trim()) {
    return trainer.bio.trim();
  }
  return trainer.specializations.map((item) => item.name).join(" · ");
}

export function FeaturedTrainerCardView({
  trainer,
  messages,
  locale,
  className,
  imagePriority = false,
}: FeaturedTrainerCardViewProps) {
  const tagline = getFeaturedTagline(trainer);
  const visibleSpecs = trainer.specializations.slice(0, 2);
  const firstName = trainer.fullName.split(" ")[0]?.toUpperCase() ?? "PHOTO";

  return (
    <Link
      href={`/trainers/${trainer.id}`}
      prefetch={true}
      className={cn("group block h-full", className)}
    >
      <PulseCard
        variant="elevated"
        interactive
        className="flex h-full flex-col overflow-hidden rounded-[22px] border-foreground/5 shadow-sm transition-all duration-250 hover:-translate-y-2 hover:shadow-[var(--shadow-overlay)]"
      >
        <div className="relative h-[200px] overflow-hidden">
          <PhotoSlot
            label={`PHOTO · ${firstName}`}
            src={trainer.photoUrl}
            alt={trainer.fullName}
            aspect="cover"
            className="size-full rounded-none"
            sizes="(max-width: 768px) 100vw, 400px"
            priority={imagePriority}
          />
          <div
            aria-hidden
            className="absolute inset-0 z-10 bg-gradient-to-t from-foreground/40 to-transparent"
          />
          {trainer.fromPriceCents !== null && trainer.currency ? (
            <div className="absolute right-3.5 bottom-3.5 z-20 rounded-full bg-card px-3.5 py-1.5 text-[13px] font-bold text-foreground shadow-sm">
              {messages.landing.featured.fromPriceLabel}{" "}
              {formatMoney(trainer.fromPriceCents, trainer.currency, locale)}
              {messages.common.perHourSuffix}
            </div>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col p-5">
          <div className="mb-1 flex items-center justify-between gap-2">
            <Heading as="h3" visualLevel="h4" className="truncate font-sans font-bold">
              {trainer.fullName}
            </Heading>
            <VerifiedBadge iconOnly className="shrink-0">
              {messages.landing.featured.verifiedBadge}
            </VerifiedBadge>
          </div>
          <div className="mb-2.5 flex flex-wrap items-center gap-2">
            <ContentText variant="muted" as="span" className="text-[13px]">
              {tagline}
            </ContentText>
          </div>
          <div className="mb-3 flex items-center gap-1.5">
            <RatingStars value={trainer.ratingAvg} size="sm" />
            <ContentText variant="small" as="span" className="font-semibold">
              {trainer.ratingAvg.toFixed(1)}
            </ContentText>
            <ContentText variant="muted" as="span">
              · {trainer.ratingCount}{" "}
              {messages.landing.featured.reviewsLabel}
            </ContentText>
          </div>
          <div className="mt-auto flex flex-wrap gap-1.5">
            {visibleSpecs.map((spec) => (
              <SpecChip
                key={spec.slug}
                className="bg-primary-container text-primary"
              >
                {spec.name}
              </SpecChip>
            ))}
          </div>
        </div>
      </PulseCard>
    </Link>
  );
}
