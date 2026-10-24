"use client";

import { CustomLink } from "@/components/ui/custom-link";
import { NavBadge } from "@/components/shell/nav-badge";
import { NavIcon } from "@/components/shell/NavIcon";
import type { NavBadgeSlotId } from "@/components/shell/nav-config";
import { useShellMessages } from "@/components/shell/shell-messages-provider.client";
import type { ResolvedNavLeaf } from "@/lib/shell/nav-resolver";
import { cn } from "@/lib/utils";

type NavLinkRowProps = {
  leaf: ResolvedNavLeaf;
  isActive: boolean;
  badgeCount?: number;
  onNavigate?: () => void;
  /** Sidebar and drawer row metrics (global_shell_spec §6.1). */
  density?: "drawer" | "sidebar";
};

const badgeLabel = (template: string, count: number) => template.replace("{count}", String(count));

const sidebarRowClass = (isActive: boolean) =>
  cn(
    "flex min-h-10 w-full items-center gap-3 rounded-lg px-3 py-1.5 text-left text-base leading-tight no-underline transition-[background-color,color] duration-100 hover:no-underline",
    isActive
      ? "bg-cobalt-soft font-bold text-cobalt-ink"
      : "text-ink hover:bg-line/60",
  );

export const NavLinkRow = ({
  leaf,
  isActive,
  badgeCount = 0,
  onNavigate,
  density = "drawer",
}: NavLinkRowProps) => {
  const messages = useShellMessages();
  const slotId: NavBadgeSlotId | undefined = leaf.badgeSlotId;
  const count = slotId ? badgeCount : 0;

  if (density === "sidebar") {
    return (
      <CustomLink
        href={leaf.href}
        aria-current={isActive ? "page" : undefined}
        onClick={onNavigate}
        className={sidebarRowClass(isActive)}
      >
        <NavIcon navKey={leaf.key} className={!isActive ? "text-ink-2" : undefined} />
        <span className="min-w-0 flex-1">{leaf.label}</span>
        {count > 0 ? (
          <NavBadge count={count} ariaLabel={badgeLabel(messages.badgeInQueue, count)} />
        ) : null}
      </CustomLink>
    );
  }

  return (
    <CustomLink
      href={leaf.href}
      aria-current={isActive ? "page" : undefined}
      onClick={onNavigate}
      className={cn(
        "flex h-11 min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-base no-underline hover:bg-paper hover:no-underline",
        isActive ? "bg-cobalt-soft font-bold text-cobalt-ink" : "text-ink-2 hover:text-ink",
      )}
    >
      <NavIcon navKey={leaf.key} className={!isActive ? "text-ink-2" : undefined} />
      <span className="min-w-0 flex-1">{leaf.label}</span>
      {count > 0 ? (
        <NavBadge count={count} ariaLabel={badgeLabel(messages.badgeInQueue, count)} />
      ) : null}
    </CustomLink>
  );
};
