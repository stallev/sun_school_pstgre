"use client";

import { useActionState, useMemo, useState } from "react";
import { Loader2Icon } from "lucide-react";
import { LOGIN_PROVIDER, USER_ROLE, type LoginProvider, type MutationResult } from "@sunschool/domain";
import { approveRequestAction } from "@/actions/access-admin";
import { ApprovalRoleSelect, resolveDefaultApprovalRoles } from "@/components/admin/ApprovalRoleSelect";
import { RejectRequestDialog } from "@/components/admin/RejectRequestDialog.client";
import { useAdminMessages } from "@/components/admin/admin-messages-provider.client";
import { SectionTitle } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import { TermLabel, nonEmptyTerm } from "@/components/ui/term-label";
import type { ActiveGradeOption } from "@/data/access/load-active-grades.server";
import type { PendingApprovalRow } from "@/data/access/load-pending-approvals.server";
import type { MessageLocale } from "@/lib/messages/dictionary-types";
import { formatRelativeCalendarDay } from "@/lib/i18n/relative-day";
import { formatApprovalSubmitLabel, formatWaitingDays } from "@/lib/messages/admin-messages";
import type { RoleSelectorSelection } from "@/components/admin/RoleSelector";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import type { HintTerm } from "@/lib/messages/pick-hints-messages";
import { useAdminFormMutation } from "@/lib/admin/use-admin-form-mutation";
import { FORM_SUBMIT_BUTTON_CLASS } from "@/lib/ui/form-submit-button-class";

type ApprovalRowProps = {
  row: PendingApprovalRow;
  grades: readonly ActiveGradeOption[];
  uiLocale: MessageLocale;
  schoolTimeZone: string;
  dictionaries: Record<string, Dictionary>;
  formError: string;
  closeLabel: string;
  rolesHint: HintTerm;
  groupsHint: HintTerm;
  consentVersionHint: HintTerm;
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
  uiLocale,
  schoolTimeZone,
  dictionaries,
  formError,
  closeLabel,
  rolesHint,
  groupsHint,
  consentVersionHint,
}: ApprovalRowProps) => {
  const messages = useAdminMessages();
  const defaultRoles = resolveDefaultApprovalRoles(row.requestedRoles);
  const [selection, setSelection] = useState<RoleSelectorSelection>(() => ({
    adminSelected: defaultRoles.includes(USER_ROLE.ADMIN),
    teacherSelected: defaultRoles.includes(USER_ROLE.TEACHER),
    selectedGradeIds: [],
  }));
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
  const submittedRelative = formatRelativeCalendarDay({
    instantIso: row.submittedAtIso,
    schoolTimeZone,
    locale: uiLocale,
    messages: {
      today: messages.approvals.submittedToday,
      yesterday: messages.approvals.submittedYesterday,
      onDate: messages.approvals.submittedOn,
    },
  });
  const waitingPart =
    row.waitingDays > 0
      ? formatWaitingDays(messages.approvals.waitingDays, row.waitingDays)
      : null;
  const metaLine = [submittedRelative, waitingPart].filter(Boolean).join(" · ");

  const approveLabel = useMemo(() => {
    const gradeNameById = new Map(grades.map((grade) => [grade.gradeId, grade.name]));
    const selectedGradeNames = selection.selectedGradeIds
      .map((gradeId) => gradeNameById.get(gradeId))
      .filter((name): name is string => Boolean(name));
    return formatApprovalSubmitLabel(messages.approvals, {
      adminSelected: selection.adminSelected,
      teacherSelected: selection.teacherSelected,
      selectedGradeNames,
    });
  }, [grades, messages.approvals, selection]);

  return (
    <article className="rounded-xl border border-line bg-surface">
      <div className="grid grid-cols-1 gap-stack p-card">
        <div className="grid grid-cols-1 gap-stack">
          <div className="min-w-0 space-y-hint">
            <SectionTitle className="font-medium text-cobalt-ink">{row.displayName}</SectionTitle>
            <p className="text-sm text-ink-2">{[loginMethods, metaLine].filter(Boolean).join(" · ")}</p>
            <div className="flex flex-wrap items-center gap-chip text-sm text-ink-2">
              <TermLabel
                term={nonEmptyTerm(consentVersionHint.term)}
                hint={consentVersionHint.hint}
                ariaLabel={consentVersionHint.term}
                popoverSide="top"
              />
              <span>{row.consentVersion}</span>
            </div>
          </div>
          <form action={formAction} className="space-y-stack" aria-busy={pending}>
            <input type="hidden" name="requestId" value={row.requestId} />
            <ApprovalRoleSelect
              grades={grades}
              requestedRoles={row.requestedRoles}
              disabled={pending}
              onSelectionChange={setSelection}
              rolesHint={rolesHint}
              groupsHint={groupsHint}
            />
            <div className="flex flex-wrap gap-chip">
              <Button type="submit" disabled={pending} aria-busy={pending} className={FORM_SUBMIT_BUTTON_CLASS}>
                {pending ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" aria-hidden />
                    {messages.approvals.submitPending}
                  </>
                ) : (
                  approveLabel
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
