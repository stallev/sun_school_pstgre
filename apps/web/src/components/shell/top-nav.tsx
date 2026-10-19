"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { NavBadge } from "@/components/shell/nav-badge";
import { NavLinkRow } from "@/components/shell/nav-link-row";
import type { ShellNavProps } from "@/components/shell/shell-nav-types";
import { useShellMessages } from "@/components/shell/shell-messages-provider.client";
import {
  isNavGroupActive,
  isNavLeafActive,
  isResolvedNavGroup,
  type ResolvedNavGroup,
} from "@/lib/shell/nav-resolver";
import { cn } from "@/lib/utils";

const badgeLabel = (template: string, count: number) => template.replace("{count}", String(count));

const TopNavGroup = ({
  group,
  activeKey,
  activeGroupKey,
  badgeCounts,
}: {
  group: ResolvedNavGroup;
  activeKey: string | null;
  activeGroupKey: string | null;
  badgeCounts: ShellNavProps["badgeCounts"];
}) => {
  const messages = useShellMessages();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const groupActive = activeGroupKey === group.key || isNavGroupActive(group, activeKey);
  const groupBadge =
    group.badgeSlotId && badgeCounts[group.badgeSlotId] ? badgeCounts[group.badgeSlotId]! : 0;

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

  return (
    <li className="relative">
      <Button
        ref={buttonRef}
        type="button"
        variant="ghost"
        className={cn("min-h-11", groupActive && "bg-cobalt-soft text-cobalt-ink")}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        onBlur={(event) => {
          if (!event.currentTarget.parentElement?.contains(event.relatedTarget)) setOpen(false);
        }}
      >
        <span>{group.label}</span>
        {groupBadge > 0 ? (
          <NavBadge count={groupBadge} ariaLabel={badgeLabel(messages.badgeInQueue, groupBadge)} />
        ) : null}
      </Button>
      {open ? (
        <ul
          id={panelId}
          className="absolute left-0 top-full z-50 mt-1 min-w-[14rem] rounded-lg border border-line bg-surface py-1 shadow-float"
        >
          {group.children.map((child) => (
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
      ) : null}
    </li>
  );
};

export const TopNav = ({ items, activeKey, activeGroupKey, badgeCounts }: ShellNavProps) => {
  const messages = useShellMessages();

  return (
    <nav className="hidden lg:block" aria-label={messages.mainNav}>
      <ul className="flex flex-wrap items-center gap-1">
        {items.map((item) => {
          if (isResolvedNavGroup(item)) {
            return (
              <TopNavGroup
                key={item.key}
                group={item}
                activeKey={activeKey}
                activeGroupKey={activeGroupKey}
                badgeCounts={badgeCounts}
              />
            );
          }
          return (
            <li key={item.key}>
              <NavLinkRow leaf={item} isActive={isNavLeafActive(item, activeKey)} onNavigate={() => {}} />
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
