import { Suspense } from "react";

import { AdminDashboardHeader } from "@/components/admin/AdminDashboardHeader";
import { AdminDashboardKpiSection } from "@/components/admin/AdminDashboardKpiSection.server";
import { AdminDashboardKpiSkeleton } from "@/components/admin/AdminDashboardKpiSkeleton";
import { AdminNeedsAttentionSection } from "@/components/admin/AdminNeedsAttentionSection.server";
import { AdminNeedsAttentionSkeleton } from "@/components/admin/AdminNeedsAttentionSkeleton";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <AdminDashboardHeader />
      <Suspense fallback={<AdminDashboardKpiSkeleton />}>
        <AdminDashboardKpiSection />
      </Suspense>
      <Suspense fallback={<AdminNeedsAttentionSkeleton />}>
        <AdminNeedsAttentionSection />
      </Suspense>
    </div>
  );
}
