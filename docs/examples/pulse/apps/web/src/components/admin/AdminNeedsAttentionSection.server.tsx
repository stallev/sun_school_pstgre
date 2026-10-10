import { CheckCircleIcon } from "lucide-react";

import { Heading } from "@/components/atoms";
import {
  AdminNeedsAttentionCard,
  resolveNeedsAttentionIcon,
} from "@/components/admin/AdminNeedsAttentionCard";
import { AdminQueueEmptyState } from "@/components/admin/AdminQueueEmptyState";
import { getAdminNeedsAttentionData } from "@/data/admin/get-admin-dashboard.server";
import { formatMoney } from "@/lib/format-money";
import { getLocale, getMessages } from "@/lib/messages/server";

export async function AdminNeedsAttentionSection() {
  const [messages, locale, data] = await Promise.all([
    getMessages(),
    getLocale(),
    getAdminNeedsAttentionData(),
  ]);

  const needsAttention = [
    data.pendingTrainers > 0
      ? {
          href: "/admin/trainers",
          title: messages.dashboard.adminNeedsAttention.trainers,
          detail:
            data.oldestPendingTrainerDays !== null
              ? messages.dashboard.adminNeedsAttention.oldestWaiting.replace(
                  "{days}",
                  String(data.oldestPendingTrainerDays),
                )
              : undefined,
          count: data.pendingTrainers,
          icon: resolveNeedsAttentionIcon("/admin/trainers"),
        }
      : null,
    data.openComplaints > 0
      ? {
          href: "/admin/complaints",
          title: messages.dashboard.adminNeedsAttention.complaints,
          detail: data.hasHighPriorityComplaint
            ? messages.dashboard.adminNeedsAttention.highPriority
            : undefined,
          count: data.openComplaints,
          icon: resolveNeedsAttentionIcon("/admin/complaints"),
        }
      : null,
    data.pendingRefunds > 0
      ? {
          href: "/admin/refunds",
          title: messages.dashboard.adminNeedsAttention.refunds,
          detail: messages.dashboard.adminNeedsAttention.pendingTotal.replace(
            "{amount}",
            formatMoney(data.pendingRefundsTotalCents, "USD", locale),
          ),
          count: data.pendingRefunds,
          icon: resolveNeedsAttentionIcon("/admin/refunds"),
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <section className="space-y-3">
      <Heading as="h2" visualLevel="h4">
        {messages.dashboard.adminNeedsAttention.title}
      </Heading>

      {needsAttention.length === 0 ? (
        <AdminQueueEmptyState
          icon={CheckCircleIcon}
          variant="success"
          title={messages.dashboard.adminNeedsAttention.allClear}
          description={messages.empty.adminDashboard.description}
        />
      ) : (
        <AdminNeedsAttentionCard items={needsAttention} />
      )}
    </section>
  );
}
