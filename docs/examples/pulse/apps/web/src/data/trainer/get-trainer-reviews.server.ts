import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { getPrisma } from "@pulse/db";

import { CACHE_TAGS } from "@/lib/cache/tags";
import { type AppLocale } from "@/lib/i18n/constants";
import { getLocale } from "@/lib/messages/server";
import { getMessagesForLocale } from "@/lib/messages/locale-catalog";

export type TrainerReviewItem = {
  id: string;
  rating: number;
  body: string;
  createdAt: string;
  clientDisplayName: string;
};

export type TrainerReviewsResult = {
  items: TrainerReviewItem[];
  ratingAvg: number;
  ratingCount: number;
};

const REVIEWS_PAGE_SIZE = 10;

function formatClientDisplayName(fullName: string, guestLabel: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) {
    return guestLabel;
  }

  return trimmed.split(/\s+/)[0] ?? guestLabel;
}

async function loadTrainerReviews(
  trainerProfileId: string,
  locale: AppLocale,
): Promise<TrainerReviewsResult> {
  "use cache";
  cacheTag(CACHE_TAGS.trainer(trainerProfileId));
  cacheLife("minutes");

  const prisma = getPrisma();
  const guestLabel = getMessagesForLocale(locale).common.guestClientName;
  const [profile, reviews] = await Promise.all([
    prisma.trainerProfile.findUnique({
      where: { id: trainerProfileId },
      select: { ratingAvg: true, ratingCount: true },
    }),
    prisma.review.findMany({
      where: {
        trainerProfileId,
        isHidden: false,
      },
      orderBy: { createdAt: "desc" },
      take: REVIEWS_PAGE_SIZE,
      select: {
        id: true,
        rating: true,
        body: true,
        createdAt: true,
        client: { select: { fullName: true } },
      },
    }),
  ]);

  return {
    items: reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      body: review.body,
      createdAt: review.createdAt.toISOString(),
      clientDisplayName: formatClientDisplayName(
        review.client.fullName,
        guestLabel,
      ),
    })),
    ratingAvg: Number(profile?.ratingAvg ?? 0),
    ratingCount: profile?.ratingCount ?? 0,
  };
}

export async function getTrainerReviews(
  trainerProfileId: string,
): Promise<TrainerReviewsResult> {
  const locale = await getLocale();
  return loadTrainerReviews(trainerProfileId, locale);
}
