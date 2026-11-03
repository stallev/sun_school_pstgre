"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useShellMessages } from "@/components/shell/shell-messages-provider.client";
import { writeSidebarCollapsedCookie } from "@/lib/shell/sidebar-collapsed-cookie";

type ShellSidebarToggleProps = {
  sidebarCollapsed: boolean;
  onSidebarCollapsedChange: (collapsed: boolean) => void;
  controlsId: string;
};

export const ShellSidebarToggle = ({
  sidebarCollapsed,
  onSidebarCollapsedChange,
  controlsId,
}: ShellSidebarToggleProps) => {
  const messages = useShellMessages();
  const expanded = !sidebarCollapsed;
  const label = expanded ? messages.sidebarCollapse : messages.sidebarExpand;

  const handleToggle = () => {
    const next = !sidebarCollapsed;
    writeSidebarCollapsedCookie(next);
    onSidebarCollapsedChange(next);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="ml-2 hidden lg:inline-flex"
      aria-controls={controlsId}
      aria-expanded={expanded}
      aria-label={label}
      title={label}
      onClick={handleToggle}
    >
      {expanded ? (
        <PanelLeftClose className="size-5" aria-hidden />
      ) : (
        <PanelLeftOpen className="size-5" aria-hidden />
      )}
    </Button>
  );
};
