"use client";

import { Menu } from "@base-ui/react/menu";
import { MoreHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type RowActionsMenuProps = {
  triggerLabel: string;
  children: ReactNode;
  className?: string;
};

export const RowActionsMenu = ({ triggerLabel, children, className }: RowActionsMenuProps) => (
  <Menu.Root>
    <Menu.Trigger
      nativeButton
      type="button"
      aria-haspopup="menu"
      aria-label={triggerLabel}
      className={cn(
        "inline-flex h-9 shrink-0 items-center justify-center rounded-lg px-2 text-ink-2 transition-colors duration-100 ease-out-soft hover:bg-paper hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none",
        className,
      )}
    >
      <MoreHorizontal className="size-4" aria-hidden />
    </Menu.Trigger>
    <Menu.Portal>
      <Menu.Positioner side="bottom" align="end" sideOffset={4} collisionAvoidance={{ side: "flip" }}>
        <Menu.Popup className="min-w-44 rounded-lg border border-line bg-surface py-1 shadow-float outline-none">
          {children}
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Portal>
  </Menu.Root>
);

export type RowActionsMenuItemProps = {
  children: ReactNode;
  destructive?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  closeOnClick?: boolean;
};

export const RowActionsMenuItem = ({
  children,
  destructive = false,
  disabled = false,
  onClick,
  closeOnClick = true,
}: RowActionsMenuItemProps) => (
  <Menu.Item
    disabled={disabled}
    closeOnClick={closeOnClick}
    onClick={onClick}
    className={cn(
      "flex min-h-9 cursor-default select-none items-center rounded-md px-3 text-sm outline-none data-highlighted:bg-paper data-disabled:pointer-events-none data-disabled:opacity-50",
      destructive ? "text-danger data-highlighted:bg-danger-soft" : "text-ink-2 data-highlighted:text-ink",
    )}
  >
    {children}
  </Menu.Item>
);
