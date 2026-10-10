import { ContentText, Heading } from "@/components/atoms";
import { PulseCard } from "@/components/ui/card";
import { getMessages } from "@/lib/messages/server";


export async function TrainerReviewBanner() {
  const messages = await getMessages();
  return (
    <PulseCard variant="compact" state="warning" className="border-amber-200/60">
      <Heading as="h2" visualLevel="h6">
        {messages.trainerReviewBanner.title}
      </Heading>
      <ContentText variant="small" className="mt-1">
        {messages.trainerReviewBanner.description}
      </ContentText>
    </PulseCard>
  );
}
