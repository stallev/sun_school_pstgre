"use client";

import { CustomLink } from "@/components/ui/custom-link";
import { NavBadge } from "@/components/shell/nav-badge";
import type { NavBadgeSlotId } from "@/components/shell/nav-config";
import { useShellMessages } from "@/components/shell/shell-messages-provider.client";
import type { ResolvedNavLeaf } from "@/lib/shell/nav-resolver";
import { cn } from "@/lib/utils";

type NavLinkRowProps = {
  leaf: ResolvedNavLeaf;
  isActive: boolean;
  badgeCount?: number;
  onNavigate?: () => void;
};

const badgeLabel = (template: string, count: number) => template.replace("{count}", String(count));

export const NavLinkRow = ({ leaf, isActive, badgeCount = 0, onNavigate }: NavLinkRowProps) => {
  const messages = useShellMessages();
  const slotId: NavBadgeSlotId | undefined = leaf.badgeSlotId;
  const count = slotId ? badgeCount : 0;

  return (
    <CustomLink
      href={leaf.href}
      aria-current={isActive ? "page" : undefined}
      onClick={onNavigate}
      className={cn(
        "flex min-h-11 items-center rounded-lg px-3 py-2 text-ink no-underline hover:bg-paper",
        isActive && "bg-cobalt-soft text-cobalt-ink",
      )}
    >
      <span className="flex-1">{leaf.label}</span>
      {count > 0 ? (
        <NavBadge count={count} ariaLabel={badgeLabel(messages.badgeInQueue, count)} />
      ) : null}
    </CustomLink>
  );
};
