"use client";

import { useActionState } from "react";
import { Loader2Icon } from "lucide-react";
import { LOGIN_PROVIDER, type LoginProvider, type MutationResult } from "@sunschool/domain";
import { approveRequestAction } from "@/actions/access-admin";
import { ApprovalRoleSelect } from "@/components/admin/ApprovalRoleSelect";
import { RejectRequestDialog } from "@/components/admin/RejectRequestDialog.client";
import { useAdminMessages } from "@/components/admin/admin-messages-provider.client";
import { SectionTitle } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import type { ActiveGradeOption } from "@/data/access/load-active-grades.server";
import type { PendingApprovalRow } from "@/data/access/load-pending-approvals.server";
import type { MessageLocale } from "@/lib/messages/dictionary-types";
import { formatDate } from "@/lib/i18n/format";
import { formatWaitingDays } from "@/lib/messages/admin-messages";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import { useAdminFormMutation } from "@/lib/admin/use-admin-form-mutation";
import { FORM_SUBMIT_BUTTON_CLASS } from "@/lib/ui/form-submit-button-class";

type ApprovalRowProps = {
  row: PendingApprovalRow;
  grades: readonly ActiveGradeOption[];
  submittedLabel: string;
  uiLocale: MessageLocale;
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
  uiLocale,
  dictionaries,
  formError,
  closeLabel,
}: ApprovalRowProps) => {
  const messages = useAdminMessages();
  const [state, formAction, pending] = useActionState<MutationResult | null, FormData>(
    approveRequestAction,
    null,
  );

  useAdminFormMutation({
    state,
    dictionaries,
    successMessage: messages.approvals.toastApproved,
    formErrorFallback: formError,
  });

  const loginMethods = row.loginProviders.map((provider) => loginLabel(provider, messages)).join(" · ");
  const submittedDate = formatDate(row.submittedAtIso.slice(0, 10), uiLocale);
  const metaLine = `${submittedLabel}: ${submittedDate} · ${messages.approvals.consentVersion}: ${row.consentVersion} · ${formatWaitingDays(messages.approvals.waitingDays, row.waitingDays)}`;

  return (
    <article className="rounded-xl border border-line bg-surface">
      <div className="grid grid-cols-1 gap-4 p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] md:items-start md:gap-6">
          <div className="min-w-0 space-y-1">
            <SectionTitle className="font-medium text-cobalt-ink">{row.displayName}</SectionTitle>
            <p className="text-sm text-ink-2">{loginMethods}</p>
            <p className="text-sm text-ink-2">{metaLine}</p>
          </div>
          <form action={formAction} className="space-y-4" aria-busy={pending}>
            <input type="hidden" name="requestId" value={row.requestId} />
            <ApprovalRoleSelect grades={grades} requestedRoles={row.requestedRoles} disabled={pending} />
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={pending} aria-busy={pending} className={FORM_SUBMIT_BUTTON_CLASS}>
                {pending ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" aria-hidden />
                    {messages.approvals.submitPending}
                  </>
                ) : (
                  messages.approvals.approve
                )}
              </Button>
              <RejectRequestDialog
                requestId={row.requestId}
                displayName={row.displayName}
                dictionaries={dictionaries}
                formError={formError}
                closeLabel={closeLabel}
              />
            </div>
          </form>
        </div>
      </div>
    </article>
  );
};
