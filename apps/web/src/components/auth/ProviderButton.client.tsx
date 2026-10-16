"use client";

import { signIn } from "next-auth/react";
import { SendIcon } from "lucide-react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useAuthMessages } from "@/components/auth/auth-messages-provider.client";
import { FORM_SUBMIT_BUTTON_CLASS } from "@/lib/ui/form-submit-button-class";

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
      className={FORM_SUBMIT_BUTTON_CLASS}
      disabled={pending}
      aria-busy={pending}
      onClick={handleTelegramSignIn}
    >
      <SendIcon className="size-4" aria-hidden />
      {pending ? messages.login.telegramPending : messages.login.telegram}
    </Button>
  );
};
