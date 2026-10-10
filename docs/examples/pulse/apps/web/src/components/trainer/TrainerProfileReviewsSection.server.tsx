import { getTrainerReviews } from "@/data/trainer/get-trainer-reviews.server";
import { TrainerProfileReviewsTab } from "@/components/trainer/TrainerProfileReviewsTab";

export type TrainerProfileReviewsSectionProps = {
  trainerProfileId: string;
};

export async function TrainerProfileReviewsSection({
  trainerProfileId,
}: TrainerProfileReviewsSectionProps) {
  const reviews = await getTrainerReviews(trainerProfileId);
  return <TrainerProfileReviewsTab reviews={reviews} />;
}
