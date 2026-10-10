import { Alert, AlertTitle } from "@/components/ui/alert";
import { getMessages } from "@/lib/messages/server";


export async function TrainerApplicationIncompleteAlert() {
  const messages = await getMessages();
  return (
    <Alert variant="destructive">
      <AlertTitle>{messages.admin.moderation.incomplete}</AlertTitle>
    </Alert>
  );
}
