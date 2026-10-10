"use client";

import dynamic from "next/dynamic";

import type { DemoRole } from "@/lib/demo/demo-credentials";
import { Skeleton } from "@/components/ui/skeleton";

function LoginDemoPanelFallback() {
  return (
    <div className="space-y-4" aria-busy="true">
      <Skeleton className="mx-auto h-4 w-48" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Skeleton className="h-40 w-full rounded-[var(--card-radius-lg)]" />
        <Skeleton className="h-40 w-full rounded-[var(--card-radius-lg)]" />
        <Skeleton className="h-40 w-full rounded-[var(--card-radius-lg)]" />
      </div>
    </div>
  );
}

const DemoRolePanel = dynamic(
  () =>
    import("@/components/auth/DemoRolePanel.client").then((module) => ({
      default: module.DemoRolePanel,
    })),
  { loading: LoginDemoPanelFallback },
);

export type LoginDemoPanelLazyProps = {
  activeRole: DemoRole | null;
  onRoleSelect: (role: DemoRole) => void;
};

export function LoginDemoPanelLazy({
  activeRole,
  onRoleSelect,
}: LoginDemoPanelLazyProps) {
  return <DemoRolePanel activeRole={activeRole} onRoleSelect={onRoleSelect} />;
}
