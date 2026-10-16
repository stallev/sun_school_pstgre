"use client";

import { signIn } from "next-auth/react";
import { SendIcon } from "lucide-react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useAuthMessages } from "@/components/auth/auth-messages-provider.client";

type ProviderButtonProps = {
  callbackUrl: string;
};

export const ProviderButton = ({ callbackUrl }: ProviderButtonProps) => {
  const messages = useAuthMessages();
  const [pending, startTransition] = useTransition();

  const handleTelegramSignIn = () => {
    startTransition(async () => {
      await signIn("telegram", { callbackUrl });
    });
  };

  return (
    <Button
      type="button"
      className="min-h-12 w-full"
      disabled={pending}
      aria-busy={pending}
      onClick={handleTelegramSignIn}
    >
      <SendIcon className="size-4" aria-hidden />
      {pending ? messages.login.telegramPending : messages.login.telegram}
    </Button>
  );
};
