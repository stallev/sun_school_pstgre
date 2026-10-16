import type { NavBadgeSlotId } from "@/components/shell/nav-config";
import type { ResolvedNavItem } from "@/lib/shell/nav-resolver";

export type NavBadgeCounts = Partial<Record<NavBadgeSlotId, number>>;

export type ShellNavProps = {
  items: ResolvedNavItem[];
  pathname: string;
  activeKey: string | null;
  activeGroupKey: string | null;
  badgeCounts: NavBadgeCounts;
};
