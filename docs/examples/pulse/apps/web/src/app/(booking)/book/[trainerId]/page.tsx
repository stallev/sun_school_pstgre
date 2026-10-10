import { Suspense } from "react";

import { BookingWizardSection } from "@/components/booking/BookingWizardSection.server";
import { BookingWizardSkeleton } from "@/components/booking/BookingWizardSkeleton";

type BookTrainerPageProps = {
  params: Promise<{ trainerId: string }>;
  searchParams: Promise<{ serviceId?: string; step?: string }>;
};

export default function BookTrainerPage({
  params,
  searchParams,
}: BookTrainerPageProps) {
  return (
    <Suspense fallback={<BookingWizardSkeleton />}>
      <BookingWizardSection params={params} searchParams={searchParams} />
    </Suspense>
  );
}
