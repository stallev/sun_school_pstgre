"use client";

import { LOGIN_PROVIDER, type LoginProvider } from "@sunschool/domain";
import { SectionTitle } from "@/components/atoms";
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
    <article className="rounded-xl border border-line bg-surface">
      <div className="grid grid-cols-1 gap-3 p-4 sm:p-5 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto] md:items-center md:gap-6">
        <div className="min-w-0 space-y-1">
          <SectionTitle className="font-medium text-cobalt-ink">{row.displayName}</SectionTitle>
        </div>
        <div className="text-sm text-ink-2">
          <p className="flex flex-wrap gap-x-1">{loginMethods}</p>
          <p>{metaLine}</p>
        </div>
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
