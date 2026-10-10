import { ContentText } from "@/components/atoms";
import { getMessages } from "@/lib/messages/server";

export async function LoginDemoDivider() {
  const messages = await getMessages();

  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center" aria-hidden>
        <span className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center">
        <ContentText
          as="span"
          variant="subtle"
          className="bg-background px-3 text-xs uppercase tracking-wide"
        >
          {messages.auth.demo.dividerLabel}
        </ContentText>
      </div>
    </div>
  );
}
