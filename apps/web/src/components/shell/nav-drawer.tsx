"use client";

import { MenuIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { NavLinkRow } from "@/components/shell/nav-link-row";
import type { ShellNavProps } from "@/components/shell/shell-nav-types";
import { useShellMessages } from "@/components/shell/shell-messages-provider.client";
import { CustomLink } from "@/components/ui/custom-link";
import { SignOutButton } from "@/components/shell/sign-out-button.client";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  isNavLeafActive,
  isResolvedNavGroup,
} from "@/lib/shell/nav-resolver";

type NavDrawerProps = ShellNavProps & {
  displayName: string;
  roleName: string;
};

const profileInitial = (displayName: string): string => {
  const trimmed = displayName.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
};

export const NavDrawer = ({
  items,
  activeKey,
  badgeCounts,
  displayName,
  roleName,
}: NavDrawerProps) => {
  const messages = useShellMessages();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 min-h-11 min-w-11 lg:hidden"
            aria-expanded={open}
            aria-controls="nav-drawer"
            aria-label={messages.openMenu}
          />
        }
      >
        <MenuIcon className="size-5" aria-hidden />
      </SheetTrigger>
      <SheetContent
        id="nav-drawer"
        side="left"
        className="flex w-[min(20rem,86vw)] gap-0 bg-surface p-0 shadow-none"
        aria-modal="true"
        aria-label={messages.menu}
      >
        <div className="flex h-14 shrink-0 items-center justify-end border-b border-line px-2">
          <SheetClose
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11"
                aria-label={messages.close}
              />
            }
          >
            <XIcon className="size-6" aria-hidden />
          </SheetClose>
        </div>
        <nav
          className="flex min-h-0 flex-1 flex-col space-y-3 overflow-y-auto px-3 pt-4"
          aria-label={messages.mainNav}
        >
          {items.map((item) => {
            if (isResolvedNavGroup(item)) {
              return (
                <div key={item.key}>
                  <p className="px-3 pb-1 text-sm font-medium text-muted">{item.label}</p>
                  <ul className="space-y-0.5">
                    {item.children.map((child) => (
                      <li key={child.key}>
                        <NavLinkRow
                          leaf={child}
                          isActive={isNavLeafActive(child, activeKey)}
                          badgeCount={child.badgeSlotId ? badgeCounts[child.badgeSlotId] : 0}
                          onNavigate={() => setOpen(false)}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            }
            return (
              <NavLinkRow
                key={item.key}
                leaf={item}
                isActive={isNavLeafActive(item, activeKey)}
                onNavigate={() => setOpen(false)}
              />
            );
          })}
        </nav>
        <footer className="mt-4 shrink-0 border-t border-line px-3 py-3">
          <CustomLink
            href="/profile"
            className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left no-underline hover:bg-paper hover:no-underline"
            onClick={() => setOpen(false)}
          >
            <span
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-paper font-display text-ink-2 ring-1 ring-line"
              aria-hidden
            >
              {profileInitial(displayName)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-ink">{displayName}</span>
              <span className="block truncate text-xs text-muted">{roleName}</span>
            </span>
          </CustomLink>
          <SignOutButton
            className="mt-1 flex h-10 w-full items-center gap-3 px-3 text-ink-2"
          />
        </footer>
      </SheetContent>
    </Sheet>
  );
};
