"use client";

import type { ReactNode } from "react";
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
  collapsed?: boolean;
};

const badgeLabel = (template: string, count: number) => template.replace("{count}", String(count));

const buildAccessibleLabel = (label: string, count: number, template: string) =>
  count > 0 ? `${label}, ${badgeLabel(template, count)}` : label;

const sidebarRowClass = (isActive: boolean, isDisabled: boolean) =>
  cn(
    "flex min-h-10 w-full items-center gap-3 rounded-lg px-3 py-1.5 text-left text-base leading-tight no-underline transition-[background-color,color] duration-100",
    isDisabled
      ? "cursor-not-allowed text-muted"
      : cn(
          "hover:no-underline",
          isActive
            ? "bg-cobalt-soft font-bold text-cobalt-ink"
            : "text-ink hover:bg-line/60",
        ),
  );

const railRowClass = (isActive: boolean, isDisabled: boolean) =>
  cn(
    "relative mx-auto flex h-10 w-10 items-center justify-center rounded-lg text-base no-underline transition-[background-color,color] duration-100",
    isDisabled
      ? "cursor-not-allowed text-muted"
      : cn(
          "hover:no-underline",
          isActive
            ? "bg-cobalt-soft text-cobalt-ink"
            : "text-ink hover:bg-line/60",
        ),
  );

const DisabledNavRow = ({
  className,
  label,
  title,
  children,
}: {
  className: string;
  label: string;
  title: string;
  children: ReactNode;
}) => (
  <span className={className} aria-disabled="true" title={title} role="link">
    {children}
    <span className="min-w-0 flex-1">{label}</span>
  </span>
);

export const NavLinkRow = ({
  leaf,
  isActive,
  badgeCount = 0,
  onNavigate,
  density = "drawer",
  collapsed = false,
}: NavLinkRowProps) => {
  const messages = useShellMessages();
  const isDisabled = leaf.navDisabled === true;
  const disabledReason = messages.navDisabledReason;
  const slotId: NavBadgeSlotId | undefined = leaf.badgeSlotId;
  const count = slotId ? badgeCount : 0;

  if (isDisabled) {
    if (density === "sidebar" && collapsed) {
      return (
        <span
          className={railRowClass(false, true)}
          aria-disabled="true"
          aria-label={`${leaf.label}. ${disabledReason}`}
          title={disabledReason}
          role="link"
        >
          <NavIcon navKey={leaf.key} className="size-5 text-muted" />
        </span>
      );
    }
    return (
      <DisabledNavRow
        className={cn(
          density === "sidebar" ? sidebarRowClass(false, true) : cn(
            "flex h-11 min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-base text-muted",
          ),
        )}
        label={leaf.label}
        title={disabledReason}
      >
        <NavIcon navKey={leaf.key} className="text-muted" />
      </DisabledNavRow>
    );
  }

  if (density === "sidebar" && collapsed) {
    const accessibleLabel = buildAccessibleLabel(leaf.label, count, messages.badgeInQueue);
    return (
      <CustomLink
        href={leaf.href}
        aria-current={isActive ? "page" : undefined}
        aria-label={accessibleLabel}
        title={leaf.label}
        onClick={onNavigate}
        className={cn(railRowClass(isActive, false), "[&:focus-visible_.rail-label]:block")}
      >
        <NavIcon navKey={leaf.key} className={cn("size-5", !isActive && "text-ink-2")} />
        <span className="rail-label pointer-events-none absolute left-full top-1/2 z-10 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-lg border border-line bg-surface px-2 py-1 text-sm font-medium text-ink shadow-float">
          {leaf.label}
        </span>
        {count > 0 ? (
          <span
            className="absolute top-1.5 right-2 size-2.5 rounded-full bg-cobalt-ink ring-2 ring-surface"
            aria-hidden
          />
        ) : null}
      </CustomLink>
    );
  }

  if (density === "sidebar") {
    return (
      <CustomLink
        href={leaf.href}
        aria-current={isActive ? "page" : undefined}
        onClick={onNavigate}
        className={sidebarRowClass(isActive, false)}
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
