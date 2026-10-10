import { ContentText } from "@/components/atoms";
import { CustomLink } from "@/components/ui/CustomLink";
import { SectionHeader } from "@/components/ui/SectionHeader";

import { getMessages } from "@/lib/messages/server";


export async function ClientDashboardFeaturedTrainersEmpty() {
  const messages = await getMessages();
  return (
    <section>
      <SectionHeader
        title={messages.dashboard.client.topTrainersTitle}
        actionHref="/trainers"
        actionLabel={messages.dashboard.client.topTrainersAll}
      />
      <ContentText variant="muted" as="p">
        {messages.dashboard.client.topTrainersEmpty}
      </ContentText>
      <CustomLink href="/trainers" className="mt-3 inline-flex">
        {messages.dashboard.client.nextSessionCta}
      </CustomLink>
    </section>
  );
}
