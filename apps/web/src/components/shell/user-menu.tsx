"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CustomLink } from "@/components/ui/custom-link";
import { SignOutButton } from "@/components/shell/sign-out-button.client";
import { useShellMessages } from "@/components/shell/shell-messages-provider.client";

type UserMenuProps = {
  displayName: string;
};

export const UserMenu = ({ displayName }: UserMenuProps) => {
  const messages = useShellMessages();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        className="max-w-[12rem] truncate"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={messages.userMenu}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="truncate" title={displayName}>{displayName}</span>
      </Button>
      {open ? (
        <div
          className="absolute right-0 top-full z-50 mt-1 min-w-[12rem] rounded-lg border border-line bg-surface py-1 shadow-float"
          role="group"
        >
          <CustomLink
            href="/profile"
            className="block px-3 py-2.5 text-ink no-underline hover:bg-paper"
            onClick={() => setOpen(false)}
          >
            {messages.profile}
          </CustomLink>
          <SignOutButton className="px-3" />
        </div>
      ) : null}
    </div>
  );
};
