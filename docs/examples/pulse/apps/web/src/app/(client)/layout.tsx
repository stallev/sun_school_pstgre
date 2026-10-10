import { Suspense } from "react";

import { AppShellFallback } from "@/components/shell/AppShellFallback";
import { ClientAppShellGate } from "@/components/shell/ClientAppShellGate.server";
import { ProductQueryToast } from "@/components/shell/ProductQueryToast.client";

export default function ClientLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Suspense fallback={null}>
        <ProductQueryToast />
      </Suspense>
      <Suspense fallback={<AppShellFallback />}>
        <ClientAppShellGate>{children}</ClientAppShellGate>
      </Suspense>
    </>
  );
}
