import { Suspense } from "react";

import { AppShellFallback } from "@/components/shell/AppShellFallback";
import { ProductQueryToast } from "@/components/shell/ProductQueryToast.client";
import { TrainerAppShellGate } from "@/components/shell/TrainerAppShellGate.server";

export default function TrainerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Suspense fallback={null}>
        <ProductQueryToast />
      </Suspense>
      <Suspense fallback={<AppShellFallback />}>
        <TrainerAppShellGate>{children}</TrainerAppShellGate>
      </Suspense>
    </>
  );
}
