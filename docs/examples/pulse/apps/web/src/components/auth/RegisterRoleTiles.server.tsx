import { ChoiceCard } from "@/components/ui/ChoiceCard";
import { getMessages } from "@/lib/messages/server";

export async function RegisterRoleTiles() {
  const messages = await getMessages();

  return (
    <div className="grid gap-3">
      <ChoiceCard
        selected
        title={messages.auth.register.clientTileTitle}
        meta={messages.auth.register.clientTileDescription}
        trailing="🧍"
        disabled
        aria-pressed
      />
      <ChoiceCard
        href="/auth/register/trainer"
        title={messages.auth.register.trainerTileTitle}
        meta={messages.auth.register.trainerTileDescription}
        trailing="🏋"
      />
    </div>
  );
}
