"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CustomLink } from "@/components/ui/custom-link";
import { SignOutButton } from "@/components/shell/sign-out-button.client";
import { useShellMessages } from "@/components/shell/shell-messages-provider.client";
import { SHELL_NAV_DROPDOWN_PANEL } from "@/lib/shell/nav-chrome-classes";
import { cn } from "@/lib/utils";

type UserMenuProps = {
  displayName: string;
};

export const UserMenu = ({ displayName }: UserMenuProps) => {
  const messages = useShellMessages();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <Button
        ref={buttonRef}
        type="button"
        variant="ghost"
        className="max-w-[12rem] truncate min-h-11"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={panelId}
        aria-label={`${messages.userMenu}: ${displayName}`}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="truncate" title={displayName}>{displayName}</span>
      </Button>
      {open ? (
        <div
          id={panelId}
          className={cn(SHELL_NAV_DROPDOWN_PANEL, "right-0 min-w-56")}
          role="group"
        >
          <CustomLink
            href="/profile"
            className="flex min-h-11 items-center px-3 py-2.5 text-ink no-underline hover:bg-paper"
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
