"use client";

import { CustomLink } from "@/components/ui/custom-link";
import { NavBadge } from "@/components/shell/nav-badge";
import { NavIcon } from "@/components/shell/NavIcon";
import type { NavBadgeSlotId } from "@/components/shell/nav-config";
import { useShellMessages } from "@/components/shell/shell-messages-provider.client";
import type { ResolvedNavLeaf } from "@/lib/shell/nav-resolver";
import { shellTopNavTriggerClass } from "@/lib/shell/nav-chrome-classes";
import { cn } from "@/lib/utils";

type NavLinkRowProps = {
  leaf: ResolvedNavLeaf;
  isActive: boolean;
  badgeCount?: number;
  onNavigate?: () => void;
  showDescription?: boolean;
  /** Topnav uses `h-9` per UX-03 §6; drawer keeps 44px touch target. */
  density?: "drawer" | "topnav";
};

const badgeLabel = (template: string, count: number) => template.replace("{count}", String(count));

export const NavLinkRow = ({
  leaf,
  isActive,
  badgeCount = 0,
  onNavigate,
  showDescription = false,
  density = "drawer",
}: NavLinkRowProps) => {
  const messages = useShellMessages();
  const slotId: NavBadgeSlotId | undefined = leaf.badgeSlotId;
  const count = slotId ? badgeCount : 0;

  if (density === "topnav" && !showDescription) {
    return (
      <CustomLink
        href={leaf.href}
        aria-current={isActive ? "page" : undefined}
        onClick={onNavigate}
        className={cn(
          shellTopNavTriggerClass({ isActive, isOpen: false }),
          "no-underline hover:no-underline",
        )}
      >
        <NavIcon navKey={leaf.key} />
        {leaf.label}
      </CustomLink>
    );
  }

  return (
    <CustomLink
      href={leaf.href}
      aria-current={isActive ? "page" : undefined}
      onClick={onNavigate}
      className={cn(
        "flex w-full rounded-lg text-left text-[0.9375rem] no-underline hover:bg-paper hover:no-underline",
        density === "topnav" ? "items-start gap-3 px-2.5 py-2" : "h-11 min-h-11 items-center gap-3 px-3",
        isActive
          ? "bg-cobalt-soft font-bold text-cobalt-ink"
          : "text-ink-2 hover:text-ink",
      )}
    >
      <NavIcon navKey={leaf.key} className={cn(showDescription && "mt-0.5", !isActive && "text-ink-2")} />
      <span className="min-w-0 flex-1">
        <span className={cn("flex items-center gap-2", !isActive && density === "topnav" && "font-medium")}>
          {leaf.label}
        </span>
        {showDescription && leaf.description ? (
          <span className="mt-0.5 block text-sm text-muted">{leaf.description}</span>
        ) : null}
      </span>
      {count > 0 ? (
        <NavBadge count={count} ariaLabel={badgeLabel(messages.badgeInQueue, count)} />
      ) : null}
    </CustomLink>
  );
};
