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

  return (
    <article className="rounded-xl border border-border bg-card p-4 space-y-3">
      <SectionTitle>{row.displayName}</SectionTitle>
      <ContentText tone="secondary">
        {row.loginProviders.map((provider) => loginLabel(provider, messages)).join(" · ")}
      </ContentText>
      <ContentText tone="secondary">
        {submittedLabel}: {new Date(row.submittedAtIso).toLocaleDateString()} ·{" "}
        {messages.approvals.consentVersion}: {row.consentVersion} ·{" "}
        {formatWaitingDays(messages.approvals.waitingDays, row.waitingDays)}
      </ContentText>
      <div className="flex flex-wrap gap-2">
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
    </article>
  );
};
