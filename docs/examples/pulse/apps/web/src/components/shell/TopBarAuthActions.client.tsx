"use client";

import Link from "next/link";

import { SignOutButton } from "@/components/shell/SignOutButton.client";
import { Button } from "@/components/ui/button";
import { CustomLink } from "@/components/ui/CustomLink";
import { useMessages } from "@/components/i18n/LocaleProvider.client";


type TopBarAuthActionsProps = {
  isAuthenticated: boolean;
  userName?: string | null;
};

export function TopBarAuthActions({  isAuthenticated,
  userName,
}: TopBarAuthActionsProps) {
  const messages = useMessages();

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <CustomLink as="text" href="/auth/login" variant="quiet">
          {messages.shell.login}
        </CustomLink>
        <Button asChild size="sm">
          <Link href="/auth/register">{messages.shell.register}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {userName ? (
        <span className="hidden max-w-[10rem] truncate text-sm text-muted-foreground md:inline">
          {userName}
        </span>
      ) : null}
      <SignOutButton />
    </div>
  );
}
