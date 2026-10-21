"use client";

import { ChevronDownIcon } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { NavBadge } from "@/components/shell/nav-badge";
import { NavLinkRow } from "@/components/shell/nav-link-row";
import type { ShellNavProps } from "@/components/shell/shell-nav-types";
import { useShellMessages } from "@/components/shell/shell-messages-provider.client";
import {
  isNavGroupActive,
  isNavLeafActive,
  isResolvedNavGroup,
  type ResolvedNavGroup,
  type ResolvedNavLeaf,
} from "@/lib/shell/nav-resolver";
import {
  SHELL_NAV_DROPDOWN_PANEL,
  shellTopNavTriggerClass,
} from "@/lib/shell/nav-chrome-classes";
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
      <button
        ref={buttonRef}
        type="button"
        className={shellTopNavTriggerClass({ isActive: groupActive, isOpen: open })}
        aria-expanded={open}
        aria-haspopup="menu"
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
        <ChevronDownIcon
          className={cn("size-4 transition-transform duration-150", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {open ? (
        <div id={panelId} role="menu" className={cn(SHELL_NAV_DROPDOWN_PANEL, "left-0")}>
          {group.children.map((child) => (
            <NavLinkRow
              key={child.key}
              leaf={child}
              isActive={isNavLeafActive(child, activeKey)}
              badgeCount={child.badgeSlotId ? badgeCounts[child.badgeSlotId] : 0}
              onNavigate={() => setOpen(false)}
              showDescription
              density="topnav"
            />
          ))}
        </div>
      ) : null}
    </li>
  );
};

const TopNavLeaf = ({
  leaf,
  activeKey,
}: {
  leaf: ResolvedNavLeaf;
  activeKey: string | null;
}) => {
  const isActive = isNavLeafActive(leaf, activeKey);
  return (
    <NavLinkRow
      leaf={leaf}
      isActive={isActive}
      density="topnav"
      onNavigate={() => {}}
    />
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
              <TopNavLeaf leaf={item} activeKey={activeKey} />
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
