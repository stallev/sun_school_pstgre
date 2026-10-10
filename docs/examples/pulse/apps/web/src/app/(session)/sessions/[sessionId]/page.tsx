import { RoutePlaceholder } from "@/components/shell/RoutePlaceholder";
import { getMessages } from "@/lib/messages/server";


export default async function SessionPage() {
  const messages = await getMessages();
  return (
    <RoutePlaceholder
      title={messages.shell.sessionTitle}
      description={messages.placeholders.sessionVideo}
    />
  );
}
