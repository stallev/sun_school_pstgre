import { Suspense } from "react";

import { HybridAppShellFallback } from "@/components/shell/HybridAppShellFallback";
import { HybridAppShellGate } from "@/components/shell/HybridAppShellGate.server";

export default function DiscoveryLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <Suspense fallback={<HybridAppShellFallback />}>
      <HybridAppShellGate>{children}</HybridAppShellGate>
    </Suspense>
  );
}
