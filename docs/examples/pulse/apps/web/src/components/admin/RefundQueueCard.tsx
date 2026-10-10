import { ContentText } from "@/components/atoms";
import { RefundActions } from "@/components/admin/RefundActions.client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PulseCard, PulseCardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { RefundListItem } from "@/data/admin/list-refunds.server";
import { formatAdminRelativeDate } from "@/lib/date/format-admin-relative";
import { formatMoney } from "@/lib/format-money";
import { getLocale, getMessages } from "@/lib/messages/server";


function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export type RefundQueueCardProps = {
  refund: RefundListItem;
};

export async function RefundQueueCard({ refund }: RefundQueueCardProps) {
  const [messages, locale] = await Promise.all([getMessages(), getLocale()]);
  return (
    <PulseCard variant="base" className="h-full rounded-2xl">
      <PulseCardContent density="sm" className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <Avatar className="size-10 shrink-0">
              <AvatarFallback>{getInitials(refund.clientName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <ContentText as="p" className="truncate font-medium">
                {refund.clientName}
              </ContentText>
              {refund.trainerName ? (
                <ContentText as="p" className="truncate text-[11px] text-muted-foreground">
                  {messages.admin.refunds.trainerLine.replace(
                    "{name}",
                    refund.trainerName,
                  )}
                </ContentText>
              ) : null}
              <ContentText as="p" className="mt-1 truncate text-sm text-muted-foreground">
                {refund.serviceName}
              </ContentText>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <ContentText variant="statValue" as="p" className="leading-none">
              {formatMoney(refund.amountCents, refund.currency, locale)}
            </ContentText>
            <StatusBadge status="pending" className="mt-1.5">
              {messages.admin.refunds.pendingStatus}
            </StatusBadge>
          </div>
        </div>

        {refund.reason ? (
          <ContentText as="p" className="text-sm">
            <span className="text-muted-foreground">
              {messages.admin.refunds.reason}:
            </span>{" "}
            {refund.reason}
          </ContentText>
        ) : null}

        <ContentText as="p" className="text-[11.5px] text-muted-foreground">
          {formatAdminRelativeDate(refund.createdAt, locale)}
        </ContentText>

        <RefundActions refundRequestId={refund.id} />
      </PulseCardContent>
    </PulseCard>
  );
}
