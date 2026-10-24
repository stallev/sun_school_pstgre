"use client";

import { NavBadge } from "@/components/shell/nav-badge";
import { NavLinkRow } from "@/components/shell/nav-link-row";
import type { ShellNavProps } from "@/components/shell/shell-nav-types";
import { useShellMessages } from "@/components/shell/shell-messages-provider.client";
import { isNavLeafActive, isResolvedNavGroup } from "@/lib/shell/nav-resolver";
import { useId } from "react";
import { cn } from "@/lib/utils";

const badgeLabel = (template: string, count: number) => template.replace("{count}", String(count));

type SidebarNavProps = Pick<ShellNavProps, "items" | "activeKey" | "badgeCounts"> & {
  asideClassName?: string;
};

export const SidebarNav = ({ items, activeKey, badgeCounts, asideClassName }: SidebarNavProps) => {
  const messages = useShellMessages();
  const navId = useId();

  return (
    <aside
      className={cn(
        "sticky top-14 hidden h-[calc(100dvh-3.5rem)] overflow-y-auto border-r border-line bg-surface px-3 py-4 lg:block",
        asideClassName,
      )}
    >
      <nav id={navId} aria-label={messages.mainNav}>
        {items.map((item) => {
          if (isResolvedNavGroup(item)) {
            const groupHeadingId = `${navId}-group-${item.key}`;
            const groupBadge =
              item.badgeSlotId && badgeCounts[item.badgeSlotId]
                ? badgeCounts[item.badgeSlotId]!
                : 0;
            return (
              <div key={item.key} className="mt-5 first:mt-0">
                <p
                  id={groupHeadingId}
                  className="flex items-center px-3 pb-1 text-sm font-medium text-muted"
                >
                  <span className="min-w-0 flex-1">{item.label}</span>
                  {groupBadge > 0 ? (
                    <NavBadge
                      count={groupBadge}
                      ariaLabel={badgeLabel(messages.badgeInQueue, groupBadge)}
                    />
                  ) : null}
                </p>
                <ul aria-labelledby={groupHeadingId} className="space-y-0.5">
                  {item.children.map((child) => (
                    <li key={child.key}>
                      <NavLinkRow
                        leaf={child}
                        isActive={isNavLeafActive(child, activeKey)}
                        badgeCount={child.badgeSlotId ? badgeCounts[child.badgeSlotId] : 0}
                        density="sidebar"
                      />
                    </li>
                  ))}
                </ul>
              </div>
            );
          }
          return (
            <ul key={item.key} className="mt-1 first:mt-0">
              <li>
                <NavLinkRow
                  leaf={item}
                  isActive={isNavLeafActive(item, activeKey)}
                  badgeCount={item.badgeSlotId ? badgeCounts[item.badgeSlotId] : 0}
                  density="sidebar"
                />
              </li>
            </ul>
          );
        })}
      </nav>
    </aside>
  );
};
