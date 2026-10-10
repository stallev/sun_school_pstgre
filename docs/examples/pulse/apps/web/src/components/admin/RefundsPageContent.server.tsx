import { ContentText } from "@/components/atoms";
import { AdminRefundsKpiGrid } from "@/components/admin/AdminRefundsKpiGrid";
import { RefundsList } from "@/components/admin/RefundsList";
import {
  getAdminRefundsKpi,
  listPendingRefunds,
} from "@/data/admin/list-refunds.server";
import { getMessages } from "@/lib/messages/server";


export async function RefundsPageContent() {
  const messages = await getMessages();
  const [kpi, refunds] = await Promise.all([
    getAdminRefundsKpi(),
    listPendingRefunds(),
  ]);

  return (
    <div className="space-y-6">
      <ContentText as="p" className="text-sm text-muted-foreground">
        {messages.admin.refunds.manualNote}
      </ContentText>
      <AdminRefundsKpiGrid kpi={kpi} />
      <RefundsList refunds={refunds} />
    </div>
  );
}
