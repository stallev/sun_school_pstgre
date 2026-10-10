import "server-only";

import { getPrisma } from "@pulse/db";

export type ReviewModerationItem = {
  id: string;
  rating: number;
  body: string;
  isHidden: boolean;
  createdAt: string;
  clientName: string;
  trainerName: string;
  trainerProfileId: string;
};

export type ReviewModerationCounts = {
  visible: number;
  hidden: number;
};

export async function getReviewModerationCounts(): Promise<ReviewModerationCounts> {
  const prisma = getPrisma();

  const [visible, hidden] = await Promise.all([
    prisma.review.count({ where: { isHidden: false } }),
    prisma.review.count({ where: { isHidden: true } }),
  ]);

  return { visible, hidden };
}

export async function listReviewsForModeration(options: {
  isHidden: boolean;
}): Promise<ReviewModerationItem[]> {
  const reviews = await getPrisma().review.findMany({
    where: { isHidden: options.isHidden },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      rating: true,
      body: true,
      isHidden: true,
      createdAt: true,
      trainerProfileId: true,
      client: { select: { fullName: true } },
      trainerProfile: {
        select: { user: { select: { fullName: true } } },
      },
    },
  });

  return reviews.map((review) => ({
    id: review.id,
    rating: review.rating,
    body: review.body,
    isHidden: review.isHidden,
    createdAt: review.createdAt.toISOString(),
    clientName: review.client.fullName,
    trainerName: review.trainerProfile.user.fullName,
    trainerProfileId: review.trainerProfileId,
  }));
}
