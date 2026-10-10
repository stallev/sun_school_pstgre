import { ContentText } from "@/components/atoms";
import { PulseCard } from "@/components/ui/card";
import { RatingStars } from "@/components/ui/RatingStars";

import type { ClientBookingReviewSummary } from "@/data/client/get-client-booking-detail.server";
import { getMessages } from "@/lib/messages/server";


export type ClientBookingReviewSubmittedProps = {
  review: ClientBookingReviewSummary;
};

export async function ClientBookingReviewSubmitted({  review,
}: ClientBookingReviewSubmittedProps) {
  const messages = await getMessages();

  return (
    <PulseCard className="space-y-3 rounded-2xl p-5">
      <ContentText variant="blockLabel" as="p">
        {messages.booking.reviewSubmitted.heading}
      </ContentText>
      <RatingStars
        value={review.rating}
        size="sm"
        aria-label={messages.review.ratingLabel}
      />
      <ContentText variant="small" as="p">
        {review.body}
      </ContentText>
      <ContentText variant="mutedMicro" as="p">
        {messages.booking.reviewSubmitted.disclaimer}
      </ContentText>
    </PulseCard>
  );
}
