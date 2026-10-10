import { ContentText, Heading } from "@/components/atoms";
import { PulseCard } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/UserAvatar";

import type { ClientReviewFormContext } from "@/data/client/get-client-review-form.server";

export type ReviewBookingContextProps = {
  context: ClientReviewFormContext;
};

export function ReviewBookingContext({ context }: ReviewBookingContextProps) {
  return (
    <PulseCard className="flex items-center gap-4 p-4">
      <UserAvatar
        name={context.trainerName}
        src={context.trainerPhotoUrl}
        size="lg"
      />
      <div className="min-w-0 space-y-1">
        <Heading as="h2" visualLevel="h4">
          {context.trainerName}
        </Heading>
        <ContentText variant="muted" as="p">
          {context.serviceNameSnapshot}
        </ContentText>
        <ContentText variant="mutedMicro" as="p" className="font-mono">
          {context.sessionDateLabel}
        </ContentText>
      </div>
    </PulseCard>
  );
}
