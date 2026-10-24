"use client";

import { ChevronDownIcon } from "lucide-react";
import { type UserRole } from "@sunschool/domain";
import { useEffect, useId, useRef, useState } from "react";
import type { DevRoleMenuGroup } from "@/components/shell/user-menu-dev.client";
import { CustomLink } from "@/components/ui/custom-link";
import { SignOutButton } from "@/components/shell/sign-out-button.client";
import { useShellMessages } from "@/components/shell/shell-messages-provider.client";
import { SHELL_NAV_DROPDOWN_PANEL } from "@/lib/shell/nav-chrome-classes";
import { cn } from "@/lib/utils";

type UserMenuProps = {
  displayName: string;
  roleSubtitle?: string;
  showDevSwitcher?: boolean;
  shellRole?: UserRole;
  previewRole?: UserRole;
  onPreviewRoleChange?: (role: UserRole) => void;
};

const profileInitial = (displayName: string): string => {
  const trimmed = displayName.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
};

export const UserMenu = ({
  displayName,
  roleSubtitle,
  showDevSwitcher = false,
  shellRole,
  previewRole,
  onPreviewRoleChange,
}: UserMenuProps) => {
  const messages = useShellMessages();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [DevRoleMenuGroup, setDevRoleMenuGroup] = useState<DevRoleMenuGroup | null>(null);

  useEffect(() => {
    if (process.env.APP_ENV !== "dev") return;
    if (!showDevSwitcher || !shellRole || !previewRole || !onPreviewRoleChange) return;
    void import("@/components/shell/user-menu-dev.client").then((mod) => {
      void mod.loadDevRoleMenuGroup().then((component) => {
        setDevRoleMenuGroup(() => component);
      });
    });
  }, [onPreviewRoleChange, previewRole, showDevSwitcher, shellRole]);

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
      <button
        ref={buttonRef}
        type="button"
        className="inline-flex h-10 items-center gap-2 rounded-lg px-1.5 hover:bg-paper"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={panelId}
        aria-label={`${messages.userMenu}: ${displayName}`}
        onClick={() => setOpen((value) => !value)}
      >
        <span
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-paper font-display text-ink-2 ring-1 ring-line"
          aria-hidden
        >
          {profileInitial(displayName)}
        </span>
        <span className="hidden max-w-[10rem] truncate text-base font-medium xl:inline">
          {displayName}
        </span>
        <ChevronDownIcon className="size-4 shrink-0 text-ink-2 hidden sm:block" aria-hidden />
      </button>
      {open ? (
        <div
          id={panelId}
          className={cn(SHELL_NAV_DROPDOWN_PANEL, "right-0 min-w-64")}
          role="menu"
        >
          <div className="border-b border-line px-2.5 pt-1 pb-2">
            <p className="font-medium text-ink">{displayName}</p>
            {roleSubtitle ? <p className="text-sm text-muted">{roleSubtitle}</p> : null}
          </div>
          <CustomLink
            href="/profile"
            role="menuitem"
            className="mt-1 flex h-10 items-center gap-3 rounded-lg px-2.5 text-base text-ink no-underline hover:bg-paper"
            onClick={() => setOpen(false)}
          >
            {messages.profile}
          </CustomLink>
          {showDevSwitcher && shellRole && previewRole && onPreviewRoleChange && DevRoleMenuGroup ? (
            <DevRoleMenuGroup
              shellRole={shellRole}
              previewRole={previewRole}
              onPreviewRoleChange={onPreviewRoleChange}
            />
          ) : null}
          <SignOutButton className="px-2.5" />
        </div>
      ) : null}
    </div>
  );
};
