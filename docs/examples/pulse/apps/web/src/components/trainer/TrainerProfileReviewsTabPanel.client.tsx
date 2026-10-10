"use client";

import { useEffect, useState } from "react";

import { ContentText, Heading, SectionTitle } from "@/components/atoms";
import { useLocale, useMessages } from "@/components/i18n/LocaleProvider.client";
import { PulseCard } from "@/components/ui/card";
import { RatingStars } from "@/components/ui/RatingStars";
import type { TrainerReviewsResult } from "@/data/trainer/get-trainer-reviews.server";
import { formatDateTime } from "@/lib/i18n/format";
import { TrainerProfileReviewsSkeleton } from "@/components/trainer/TrainerProfileReviewsSkeleton";

export type TrainerProfileReviewsTabPanelProps = {
  trainerProfileId: string;
};

export function TrainerProfileReviewsTabPanel({
  trainerProfileId,
}: TrainerProfileReviewsTabPanelProps) {
  const messages = useMessages();
  const locale = useLocale();
  const [reviews, setReviews] = useState<TrainerReviewsResult | undefined>(
    undefined,
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(
          `/api/public/trainers/${trainerProfileId}/reviews`,
        );
        if (!response.ok) {
          throw new Error("reviews failed");
        }
        const data = (await response.json()) as { reviews: TrainerReviewsResult };
        if (!cancelled) {
          setReviews(data.reviews);
        }
      } catch {
        if (!cancelled) {
          setReviews({ items: [], ratingAvg: 0, ratingCount: 0 });
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [trainerProfileId]);

  if (reviews === undefined) {
    return <TrainerProfileReviewsSkeleton />;
  }

  if (reviews.items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-6 text-center">
        <SectionTitle as="h2">{messages.trainer.profile.reviewsEmpty.title}</SectionTitle>
        <ContentText variant="muted" as="p" className="mt-2">
          {messages.trainer.profile.reviewsEmpty.description}
        </ContentText>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <Heading as="h2" visualLevel="h2" className="font-heading text-[42px] md:text-[56px]">
          {reviews.ratingAvg.toFixed(1)}
        </Heading>
        <div>
          <RatingStars value={reviews.ratingAvg} size="md" />
          <ContentText variant="mutedMicro" as="p" className="mt-1">
            {reviews.ratingCount} {messages.landing.featured.reviewsLabel}
          </ContentText>
        </div>
      </div>

      <div className="grid items-stretch gap-3 md:grid-cols-2">
        {reviews.items.map((review) => (
          <PulseCard key={review.id} className="flex h-full flex-col p-4 md:p-5">
            <div className="flex items-center justify-between gap-2">
              <ContentText variant="smallEmphasis" as="p">
                {review.clientDisplayName}
              </ContentText>
              <RatingStars value={review.rating} size="sm" />
            </div>
            <ContentText variant="mutedMicro" as="p" className="mt-1">
              {formatDateTime(review.createdAt, {
                locale,
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </ContentText>
            <ContentText as="p" className="mt-3 flex-1">
              {review.body}
            </ContentText>
          </PulseCard>
        ))}
      </div>
    </div>
  );
}
