"use client";

import { signOut } from "next-auth/react";
import { useTransition } from "react";
import { useShellMessages } from "@/components/shell/shell-messages-provider.client";
import { cn } from "@/lib/utils";

type SignOutButtonProps = {
  className?: string;
};

export const SignOutButton = ({ className }: SignOutButtonProps) => {
  const messages = useShellMessages();
  const [pending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(async () => {
      await signOut({ callbackUrl: "/login" });
    });
  };

  return (
    <button
      type="button"
      className={cn(
        "w-full rounded-lg px-3 py-2.5 text-left text-ink hover:bg-paper disabled:opacity-70",
        className,
      )}
      disabled={pending}
      aria-busy={pending}
      onClick={handleSignOut}
    >
      {pending ? messages.signOutPending : messages.signOut}
    </button>
  );
};
