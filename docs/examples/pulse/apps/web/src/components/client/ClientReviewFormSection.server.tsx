import { notFound, redirect } from "next/navigation";

import { ReviewBookingContext } from "@/components/client/ReviewBookingContext";
import { ReviewForm } from "@/components/client/ReviewForm.client";
import { resolveClientReviewPageAccess } from "@/data/client/get-client-review-form.server";

type ClientReviewFormSectionProps = {
  params: Promise<{ bookingId: string }>;
};

export async function ClientReviewFormSection({
  params,
}: ClientReviewFormSectionProps) {
  const { bookingId } = await params;
  const access = await resolveClientReviewPageAccess(bookingId);

  if (access.status === "redirect") {
    redirect(`/client/bookings/${access.bookingId}`);
  }

  if (access.status === "not_found") {
    notFound();
  }

  const context = access.context;

  return (
    <>
      <ReviewBookingContext context={context} />
      <ReviewForm bookingId={context.bookingId} />
    </>
  );
}
