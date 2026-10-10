"use client";

import { useTransition } from "react";
import { Loader2Icon, LogOutIcon } from "lucide-react";

import { signOutAction } from "@/actions/auth/sign-out";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMessages } from "@/components/i18n/LocaleProvider.client";


type SignOutButtonProps = {
  className?: string;
};

export function SignOutButton({ className }: SignOutButtonProps) {
  const messages = useMessages();
  const [pending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(() => {
      void signOutAction();
    });
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn("min-w-11 shrink-0", className)}
      disabled={pending}
      aria-busy={pending}
      onClick={handleSignOut}
    >
      {pending ? (
        <Loader2Icon className="size-4 animate-spin" aria-hidden />
      ) : (
        <LogOutIcon aria-hidden className="size-4" />
      )}
      <span className="sr-only sm:not-sr-only sm:inline">
        {pending ? messages.shell.signOutPending : messages.shell.signOut}
      </span>
    </Button>
  );
}
