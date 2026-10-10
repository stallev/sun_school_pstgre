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

export type TrainerCardViewProps = {
  trainer: CatalogTrainerCard;
  messages: Messages;
  locale: AppLocale;
  className?: string;
  /** Grid/dashboard layout — shrink inside CSS grid (no catalog horizontal-scroll min-width). */
  gridLayout?: boolean;
  /** Preload photo for above-the-fold LCP candidates (catalog grid, landing). */
  imagePriority?: boolean;
};

function getTrainerTagline(trainer: CatalogTrainerCard): string {
  if (trainer.bio?.trim()) {
    return trainer.bio.trim();
  }

  return trainer.specializations.map((item) => item.name).join(" · ");
}

export function TrainerCardView({
  trainer,
  messages,
  locale,
  className,
  gridLayout = false,
  imagePriority = false,
}: TrainerCardViewProps) {
  const tagline = getTrainerTagline(trainer);
  const visibleSpecs = trainer.specializations.slice(0, 2);
  const hiddenSpecCount = trainer.specializations.length - visibleSpecs.length;
  const firstName = trainer.fullName.split(" ")[0]?.toUpperCase() ?? "PHOTO";
  const photoLabel = `PHOTO · ${firstName}`;

  return (
    <div
      className={cn(
        gridLayout ? "min-w-0 w-full" : "min-w-[280px] shrink-0 md:min-w-0",
        className,
      )}
    >
      <Link
        href={`/trainers/${trainer.id}`}
        prefetch={true}
        className="block h-full min-w-0"
      >
        <PulseCard variant="catalog" interactive className="h-full min-w-0">
          <div className="flex h-full min-w-0 gap-3 p-3 md:min-h-[7.5rem]">
            <PhotoSlot
              label={photoLabel}
              src={trainer.photoUrl}
              alt={trainer.fullName}
              aspect="square"
              className="w-24 shrink-0 self-start"
              priority={imagePriority}
            />
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <Heading
                    as="h3"
                    visualLevel="h4"
                    className="truncate font-heading font-normal"
                  >
                    {trainer.fullName}
                  </Heading>
                  <ContentText variant="muted" as="p" className="mt-0.5 line-clamp-1">
                    {tagline}
                  </ContentText>
                </div>
                <VerifiedBadge iconOnly className="shrink-0">
                  {messages.landing.featured.verifiedBadge}
                </VerifiedBadge>
              </div>

              <div className="mt-1.5 flex items-center gap-1.5">
                <RatingStars value={trainer.ratingAvg} size="sm" />
                <ContentText
                  variant="mutedMicro"
                  as="span"
                  className="font-mono text-foreground"
                >
                  {trainer.ratingAvg.toFixed(1)}
                </ContentText>
                <ContentText variant="mutedMicro" as="span">
                  · {trainer.ratingCount} {messages.landing.featured.reviewsLabel}
                </ContentText>
              </div>

              <div className="mt-auto flex items-end justify-between gap-2 pt-2">
                <div className="flex flex-wrap gap-1">
                  {visibleSpecs.map((spec) => (
                    <SpecChip key={spec.slug}>{spec.name}</SpecChip>
                  ))}
                  {hiddenSpecCount > 0 ? (
                    <SpecChip>+{hiddenSpecCount}</SpecChip>
                  ) : null}
                </div>
                {trainer.fromPriceCents !== null && trainer.currency ? (
                  <div className="shrink-0 text-right">
                    <ContentText variant="mutedMicro" as="p" className="leading-none">
                      {messages.landing.featured.fromPriceLabel}
                    </ContentText>
                    <ContentText
                      as="p"
                      variant="smallEmphasis"
                      className="mt-0.5 font-heading text-[18px] leading-none"
                    >
                      {formatMoney(trainer.fromPriceCents, trainer.currency, locale)}
                    </ContentText>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </PulseCard>
      </Link>
    </div>
  );
}
