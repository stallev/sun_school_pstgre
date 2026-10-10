import { Suspense } from "react";

import { AdminAppShellGate } from "@/components/shell/AdminAppShellGate.server";
import { AppShellFallback } from "@/components/shell/AppShellFallback";
import { ProductQueryToast } from "@/components/shell/ProductQueryToast.client";

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Suspense fallback={null}>
        <ProductQueryToast />
      </Suspense>
      <Suspense fallback={<AppShellFallback />}>
        <AdminAppShellGate>{children}</AdminAppShellGate>
      </Suspense>
    </>
  );
}
