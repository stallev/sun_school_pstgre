"use client";

import dynamic from "next/dynamic";

import { TrainerProfileTabsSkeleton } from "@/components/trainer/TrainerProfileTabsSkeleton";
import type { TrainerProfileTabsShellProps } from "@/components/trainer/TrainerProfileTabsShell.client";

const TrainerProfileTabsShell = dynamic(
  () =>
    import("@/components/trainer/TrainerProfileTabsShell.client").then(
      (module) => ({ default: module.TrainerProfileTabsShell }),
    ),
  { loading: () => <TrainerProfileTabsSkeleton />, ssr: false },
);

export type TrainerProfileTabsShellDeferredProps = TrainerProfileTabsShellProps;

export function TrainerProfileTabsShellDeferred(
  props: TrainerProfileTabsShellDeferredProps,
) {
  return <TrainerProfileTabsShell {...props} />;
}
