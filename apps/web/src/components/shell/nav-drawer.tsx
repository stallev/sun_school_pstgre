"use client";

import { MenuIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { NavLinkRow } from "@/components/shell/nav-link-row";
import type { ShellNavProps } from "@/components/shell/shell-nav-types";
import { useShellMessages } from "@/components/shell/shell-messages-provider.client";
import { CustomLink } from "@/components/ui/custom-link";
import { SignOutButton } from "@/components/shell/sign-out-button.client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  isNavLeafActive,
  isResolvedNavGroup,
} from "@/lib/shell/nav-resolver";

export const NavDrawer = ({
  items,
  activeKey,
  badgeCounts,
}: ShellNavProps) => {
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
            className="min-h-11 min-w-11 lg:hidden"
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
        closeLabel={messages.close}
        className="w-[min(20rem,86vw)] bg-surface"
        aria-modal="true"
      >
        <SheetHeader>
          <SheetTitle>{messages.menu}</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-2" aria-label={messages.mainNav}>
          {items.map((item) => {
            if (isResolvedNavGroup(item)) {
              return (
                <div key={item.key} className="space-y-1">
                  <p className="px-3 text-sm font-medium text-muted">{item.label}</p>
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
        <footer className="mt-auto space-y-0.5 border-t border-line px-2 py-3">
          <CustomLink
            href="/profile"
            className="block min-h-11 rounded-lg px-3 py-2.5 text-ink no-underline hover:bg-paper"
            onClick={() => setOpen(false)}
          >
            {messages.profile}
          </CustomLink>
          <SignOutButton />
        </footer>
      </SheetContent>
    </Sheet>
  );
};
