"use client";

import { ContentText } from "@/components/atoms";
import { NavItem } from "@/components/shell/NavItem";
import { useMessages } from "@/components/i18n/LocaleProvider.client";
import {
  resolveBadgeCount,
  type AdminNavBadges,
  type NavItemConfig,
} from "@/lib/nav/nav-config";

type SidebarNavProps = {
  items: NavItemConfig[];
  sectionTitle: string;
  badges?: AdminNavBadges;
};

export function SidebarNav({ items, sectionTitle, badges }: SidebarNavProps) {
  const messages = useMessages();

  return (
    <nav
      aria-label={messages.shell.sidebarNavAriaLabel}
      className="hidden w-52 shrink-0 flex-col border-r border-border/60 bg-background px-3 py-6 md:sticky md:top-16 md:flex md:max-h-[calc(100dvh-4rem)] md:self-start md:overflow-y-auto lg:w-60"
    >
      <ContentText
        variant="statusLabel"
        as="p"
        className="mb-2 px-4 font-mono uppercase tracking-[0.08em] text-muted-foreground"
      >
        {sectionTitle}
      </ContentText>
      <div className="flex flex-col gap-1">
        {items.map((item) => (
          <NavItem
            key={item.href}
            label={item.label}
            href={item.href}
            iconKey={item.iconKey}
            badgeCount={resolveBadgeCount(item.badgeKey, badges)}
            layout="sidebar"
          />
        ))}
      </div>
    </nav>
  );
}
