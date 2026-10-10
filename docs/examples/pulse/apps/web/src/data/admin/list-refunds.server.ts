import "server-only";

import { REFUND_STATUS } from "@pulse/domain";
import { getPrisma } from "@pulse/db";

export type RefundListItem = {
  id: string;
  status: string;
  amountCents: number;
  currency: string;
  reason: string | null;
  createdAt: string;
  clientName: string;
  trainerName: string | null;
  bookingId: string;
  serviceName: string;
};

export type AdminRefundsKpi = {
  pendingCount: number;
  pendingTotalCents: number;
};

export async function listPendingRefunds(): Promise<RefundListItem[]> {
  const refunds = await getPrisma().refundRequest.findMany({
    where: { status: REFUND_STATUS.PENDING },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      status: true,
      amountCents: true,
      currency: true,
      reason: true,
      createdAt: true,
      bookingId: true,
      client: { select: { fullName: true } },
      booking: {
        select: {
          serviceNameSnapshot: true,
          trainerProfile: {
            select: { user: { select: { fullName: true } } },
          },
        },
      },
    },
  });

  return refunds.map((refund) => ({
    id: refund.id,
    status: refund.status,
    amountCents: refund.amountCents,
    currency: refund.currency,
    reason: refund.reason,
    createdAt: refund.createdAt.toISOString(),
    clientName: refund.client.fullName,
    trainerName: refund.booking.trainerProfile?.user.fullName ?? null,
    bookingId: refund.bookingId,
    serviceName: refund.booking.serviceNameSnapshot,
  }));
}

export async function getAdminRefundsKpi(): Promise<AdminRefundsKpi> {
  const [pendingCount, pendingTotalCents] = await Promise.all([
    countPendingRefunds(),
    getPendingRefundsTotalCents(),
  ]);

  return { pendingCount, pendingTotalCents };
}

export async function countPendingRefunds(): Promise<number> {
  return getPrisma().refundRequest.count({
    where: { status: REFUND_STATUS.PENDING },
  });
}

export async function getPendingRefundsTotalCents(): Promise<number> {
  const aggregate = await getPrisma().refundRequest.aggregate({
    where: { status: REFUND_STATUS.PENDING },
    _sum: { amountCents: true },
  });

  return aggregate._sum.amountCents ?? 0;
}
