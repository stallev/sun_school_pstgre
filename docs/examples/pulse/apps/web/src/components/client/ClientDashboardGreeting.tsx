import { ContentText, Heading } from "@/components/atoms";

import { getMessages } from "@/lib/messages/server";


export type ClientDashboardGreetingProps = {
  name: string;
};

export async function ClientDashboardGreeting({ name }: ClientDashboardGreetingProps) {
  const messages = await getMessages();
  return (
    <div>
      <ContentText variant="mutedMicro" as="p">
        {messages.dashboard.client.greeting}
      </ContentText>
      <Heading as="h1" visualLevel="display" className="mt-1">
        {name}
      </Heading>
    </div>
  );
}
