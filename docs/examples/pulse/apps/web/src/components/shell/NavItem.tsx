"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createElement } from "react";

import { useMessages } from "@/components/i18n/LocaleProvider.client";
import { cn } from "@/lib/utils";
import { isNavItemActive, type NavIconKey } from "@/lib/nav/nav-config";
import { getNavIcon } from "@/lib/nav/nav-icons.client";

type NavItemProps = {
  label: string;
  href: string;
  iconKey: NavIconKey;
  badgeCount?: number;
  layout?: "bottom" | "sidebar";
};

function renderNavIcon(iconKey: NavIconKey, className: string) {
  return createElement(getNavIcon(iconKey), {
    "aria-hidden": true,
    className,
    strokeWidth: 1.75,
  });
}

export function NavItem({
  label,
  href,
  iconKey,
  badgeCount = 0,
  layout = "bottom",
}: NavItemProps) {
  const pathname = usePathname();
  const messages = useMessages();
  const isActive = isNavItemActive(pathname, href);
  const showBadge = badgeCount > 0;
  const badgeAriaLabel = messages.shell.badgeInQueue.replace(
    "{count}",
    String(badgeCount),
  );

  if (layout === "sidebar") {
    return (
      <Link
        href={href}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex h-11 items-center gap-3 rounded-full px-3 text-sm font-medium transition-colors",
          isActive
            ? "bg-primary-container text-on-primary-container"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        {renderNavIcon(iconKey, "size-4 shrink-0")}
        <span className="truncate">{label}</span>
        {showBadge ? (
          <span
            aria-label={badgeAriaLabel}
            className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-semibold text-destructive-foreground"
          >
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        ) : null}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className="group relative flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 py-2.5"
    >
      <span
        className={cn(
          "relative flex h-7 w-12 items-center justify-center rounded-full transition-colors",
          isActive
            ? "bg-primary-container text-on-primary-container"
            : "text-muted-foreground group-hover:text-foreground",
        )}
      >
        {renderNavIcon(iconKey, "size-5 shrink-0")}
        {showBadge ? (
          <span
            aria-label={badgeAriaLabel}
            className="absolute -top-0.5 right-1.5 inline-flex size-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground"
          >
            {badgeCount > 9 ? "9+" : badgeCount}
          </span>
        ) : null}
      </span>
      <span
        className={cn(
          "max-w-full truncate text-[10.5px] font-medium",
          isActive ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
    </Link>
  );
}
