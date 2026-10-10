import { connection } from "next/server";

import { AdminDashboardKpiGrid } from "@/components/admin/AdminDashboardKpiGrid";
import { getAdminDashboardKpiData } from "@/data/admin/get-admin-dashboard.server";

export async function AdminDashboardKpiSection() {
  // KPI window uses `new Date()` — mark request-bound before DAL (Cache Components).
  await connection();
  const data = await getAdminDashboardKpiData();
  return <AdminDashboardKpiGrid data={data} />;
}
