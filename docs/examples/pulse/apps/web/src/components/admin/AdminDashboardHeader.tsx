import { ContentText } from "@/components/atoms";
import { PageHeader } from "@/components/ui/PageHeader";
import { getMessages } from "@/lib/messages/server";


export async function AdminDashboardHeader() {
  const messages = await getMessages();
  return (
    <div>
      <ContentText as="p" className="text-sm text-muted-foreground">
        {messages.dashboard.adminSubtitle}
      </ContentText>
      <PageHeader title={messages.dashboard.adminTitle} className="mt-1" />
    </div>
  );
}
