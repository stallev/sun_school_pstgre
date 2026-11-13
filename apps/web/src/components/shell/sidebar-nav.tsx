"use client";

import { NavBadge } from "@/components/shell/nav-badge";
import { NavLinkRow } from "@/components/shell/nav-link-row";
import type { ShellNavProps } from "@/components/shell/shell-nav-types";
import { useShellMessages } from "@/components/shell/shell-messages-provider.client";
import { Separator } from "@/components/ui/separator";
import { ContentText } from "@/components/atoms";
import { isNavLeafActive, isResolvedNavGroup } from "@/lib/shell/nav-resolver";
import type { SidebarPreference } from "@/lib/shell/sidebar-collapsed-cookie";
import { Fragment, useId } from "react";
import { cn } from "@/lib/utils";

const badgeLabel = (template: string, count: number) => template.replace("{count}", String(count));

type SidebarNavProps = Pick<ShellNavProps, "items" | "activeKey" | "badgeCounts" | "emptyHint"> & {
  id?: string;
  asideClassName?: string;
  collapsed?: boolean;
  /** Overrides `collapsed`; `auto` = rail below `xl`, expanded from `xl` (ADR-022 §4.1). */
  rail?: SidebarPreference;
};

export const SidebarNav = ({
  id,
  items,
  activeKey,
  badgeCounts,
  asideClassName,
  collapsed: collapsedProp = false,
  rail,
  emptyHint,
}: SidebarNavProps) => {
  const preference: SidebarPreference = rail ?? (collapsedProp ? "collapsed" : "expanded");
  const collapsed = preference === "collapsed";
  const auto = preference === "auto";
  const messages = useShellMessages();
  const generatedId = useId();
  const navId = id ?? generatedId;

  return (
    <aside
      className={cn(
        "sticky top-14 hidden h-[calc(100dvh-3.5rem)] overflow-y-auto border-r border-line bg-surface py-4 lg:block",
        collapsed ? "px-2" : "px-3",
        auto && "max-xl:px-2",
        asideClassName,
      )}
    >
      <nav id={navId} aria-label={messages.mainNav}>
        {items.length === 0 && emptyHint ? (
          <ContentText className="px-3 text-sm text-muted">{emptyHint}</ContentText>
        ) : null}
        {items.map((item, index) => {
          if (isResolvedNavGroup(item)) {
            const groupHeadingId = `${navId}-group-${item.key}`;
            const groupBadge =
              item.badgeSlotId && badgeCounts[item.badgeSlotId]
                ? badgeCounts[item.badgeSlotId]!
                : 0;
            return (
              <Fragment key={item.key}>
                {(collapsed || auto) && index > 0 ? (
                  <Separator className={cn("my-3 bg-line", auto && "xl:hidden")} />
                ) : null}
                <div
                  className={cn(
                    "mt-5 first:mt-0",
                    collapsed && "mt-0 first:mt-0",
                    auto && "max-xl:mt-0",
                  )}
                >
                  <p
                    id={groupHeadingId}
                    className={cn(
                      "flex items-center px-3 pb-1 text-sm font-medium text-muted",
                      collapsed && "sr-only",
                      auto && "max-xl:sr-only",
                    )}
                  >
                    <span className="min-w-0 flex-1">{item.label}</span>
                    {!collapsed && groupBadge > 0 ? (
                      <NavBadge
                        count={groupBadge}
                        className={auto ? "max-xl:hidden" : undefined}
                        ariaLabel={badgeLabel(messages.badgeInQueue, groupBadge)}
                      />
                    ) : null}
                  </p>
                  <ul
                    aria-labelledby={groupHeadingId}
                    className={cn("space-y-0.5", collapsed && "space-y-1", auto && "max-xl:space-y-1")}
                  >
                    {item.children.map((child) => (
                      <li key={child.key}>
                        <NavLinkRow
                          leaf={child}
                          isActive={isNavLeafActive(child, activeKey)}
                          badgeCount={child.badgeSlotId ? badgeCounts[child.badgeSlotId] : 0}
                          density="sidebar"
                          collapsed={collapsed}
                          auto={auto}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              </Fragment>
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
                  collapsed={collapsed}
                  auto={auto}
                />
              </li>
            </ul>
          );
        })}
      </nav>
    </aside>
  );
};
