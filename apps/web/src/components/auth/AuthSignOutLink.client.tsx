"use client";

import { signOut } from "next-auth/react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";

type AuthSignOutLinkProps = {
  signOutLabel: string;
  signOutPendingLabel: string;
};

export const AuthSignOutLink = ({ signOutLabel, signOutPendingLabel }: AuthSignOutLinkProps) => {
  const [pending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(async () => {
      await signOut({ callbackUrl: "/login" });
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full sm:w-auto"
      disabled={pending}
      aria-busy={pending}
      onClick={handleSignOut}
    >
      {pending ? signOutPendingLabel : signOutLabel}
    </Button>
  );
};
