"use client";

import { LOGIN_PROVIDER, type LoginProvider } from "@sunschool/domain";
import { ContentText, SectionTitle } from "@/components/atoms";
import { ApproveRequestDialog } from "@/components/admin/ApproveRequestDialog.client";
import { RejectRequestDialog } from "@/components/admin/RejectRequestDialog.client";
import { useAdminMessages } from "@/components/admin/admin-messages-provider.client";
import type { ActiveGradeOption } from "@/data/access/load-active-grades.server";
import type { PendingApprovalRow } from "@/data/access/load-pending-approvals.server";
import { formatWaitingDays } from "@/lib/messages/admin-messages";
import type { Dictionary } from "@/lib/messages/get-dictionary";

type ApprovalRowProps = {
  row: PendingApprovalRow;
  grades: readonly ActiveGradeOption[];
  submittedLabel: string;
  dictionaries: Record<string, Dictionary>;
  formError: string;
  closeLabel: string;
};

const loginLabel = (
  provider: LoginProvider,
  messages: ReturnType<typeof useAdminMessages>,
): string =>
  provider === LOGIN_PROVIDER.TELEGRAM
    ? messages.approvals.loginTelegram
    : messages.approvals.loginCredentials;

export const ApprovalRow = ({
  row,
  grades,
  submittedLabel,
  dictionaries,
  formError,
  closeLabel,
}: ApprovalRowProps) => {
  const messages = useAdminMessages();

  const loginMethods = row.loginProviders.map((provider) => loginLabel(provider, messages)).join(" · ");
  const metaLine = `${submittedLabel}: ${new Date(row.submittedAtIso).toLocaleDateString()} · ${messages.approvals.consentVersion}: ${row.consentVersion} · ${formatWaitingDays(messages.approvals.waitingDays, row.waitingDays)}`;

  return (
    <article className="rounded-xl border border-line bg-surface p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_auto] md:items-center">
        <div className="min-w-0 space-y-1">
          <SectionTitle>{row.displayName}</SectionTitle>
          <ContentText tone="secondary" className="text-sm">{loginMethods}</ContentText>
        </div>
        <ContentText tone="secondary" className="text-sm md:text-end">
          {metaLine}
        </ContentText>
        <div className="flex flex-wrap gap-2 md:justify-end">
          <ApproveRequestDialog
            requestId={row.requestId}
            displayName={row.displayName}
            grades={grades}
            dictionaries={dictionaries}
            formError={formError}
            closeLabel={closeLabel}
          />
          <RejectRequestDialog
            requestId={row.requestId}
            displayName={row.displayName}
            dictionaries={dictionaries}
            formError={formError}
            closeLabel={closeLabel}
          />
        </div>
      </div>
    </article>
  );
};
