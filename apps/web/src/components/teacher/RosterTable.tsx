"use client";

import { useActionState, useState, useTransition } from "react";
import { Loader2Icon } from "lucide-react";
import type { MutationResult } from "@sunschool/domain";
import { enrollPupilAction, unenrollPupilAction } from "@/actions/school-pupils";
import { ContentText } from "@/components/atoms/ContentText";
import { Button } from "@/components/ui/button";
import { StatusText } from "@/components/ui/status-text";
import type { TeacherAddCandidate, TeacherRosterRow } from "@/data/school/load-teacher-group-page.server";
import { useAdminFormMutation } from "@/lib/admin/use-admin-form-mutation";
import type { TeacherRosterMessages } from "@/lib/messages/teacher-messages";
import { fillMessage } from "@/lib/messages/fill-message";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";
import { toast } from "sonner";

type RosterTableProps = {
  gradeId: string;
  pupils: readonly TeacherRosterRow[];
  addCandidates: readonly TeacherAddCandidate[];
  canMutate: boolean;
  defaultDate: string;
  messages: TeacherRosterMessages;
  dictionaries: Record<string, Dictionary>;
  formError: string;
};

export const RosterTable = ({
  gradeId,
  pupils,
  addCandidates,
  canMutate,
  defaultDate,
  messages,
  dictionaries,
  formError,
}: RosterTableProps) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [enrollState, enrollAction, enrollPending] = useActionState<MutationResult | null, FormData>(
    enrollPupilAction,
    null,
  );
  useAdminFormMutation({
    state: enrollState,
    dictionaries,
    successMessage: messages.toastEnrolled,
    formErrorFallback: formError,
    onSuccess: () => setSelected([]),
  });

  const pending = isPending || enrollPending;
  const allSelected = pupils.length > 0 && selected.length === pupils.length;

  const toggleAll = () => {
    setSelected(allSelected ? [] : pupils.map((row) => row.pupilId));
  };

  const toggleOne = (pupilId: string) => {
    setSelected((current) =>
      current.includes(pupilId) ? current.filter((id) => id !== pupilId) : [...current, pupilId],
    );
  };

  const handleBulkUnenroll = () => {
    if (selected.length === 0) return;
    startTransition(async () => {
      for (const pupilId of selected) {
        const formData = new FormData();
        formData.set("pupilId", pupilId);
        formData.set("endsOn", defaultDate);
        const result = await unenrollPupilAction(null, formData);
        if (!result.ok) {
          toast.error(formError, { duration: PRODUCT_TOAST_DURATION_MS });
          return;
        }
      }
      toast.success(messages.toastUnenrolled, { duration: PRODUCT_TOAST_DURATION_MS });
      setSelected([]);
    });
  };

  return (
    <>
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      {canMutate ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
          <label className="inline-flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-cobalt-ink"
              checked={allSelected}
              onChange={toggleAll}
              disabled={pending || pupils.length === 0}
            />
            {messages.selectAll}
          </label>
          <Button
            type="button"
            variant="destructive"
            size="compact"
            className="min-h-11"
            disabled={pending || selected.length === 0}
            aria-busy={pending}
            onClick={handleBulkUnenroll}
          >
            {fillMessage(messages.removeSelected, { count: selected.length })}
          </Button>
        </div>
      ) : null}
      <ul className="divide-y divide-line">
        {pupils.map((row) => (
          <li key={row.pupilId} className="flex items-center gap-3 px-5 py-3">
              {canMutate ? (
                <input
                  type="checkbox"
                  className="size-4 shrink-0 accent-cobalt-ink"
                  checked={selected.includes(row.pupilId)}
                  onChange={() => toggleOne(row.pupilId)}
                  disabled={pending}
                  aria-label={fillMessage(messages.selectPupil, { name: row.displayName })}
                />
              ) : null}
            <div className="min-w-0 flex-1">
              <ContentText className="truncate font-medium text-ink">{row.displayName}</ContentText>
              <ContentText tone="secondary" className="text-sm">
                {fillMessage(messages.enrolledSince, { date: row.enrolledSinceIso })}
              </ContentText>
            </div>
            <StatusText className="shrink-0 text-xs sm:text-sm" tone={row.isLegacyPending || !row.hasConsent ? "warn" : "ok"}>
              {row.isLegacyPending
                ? messages.consentNoLegacy
                : row.hasConsent
                  ? messages.consentYes
                  : messages.consentNo}
            </StatusText>
          </li>
        ))}
      </ul>
      {canMutate && addCandidates.length > 0 ? (
        <form action={enrollAction} className="flex flex-wrap items-end gap-3 border-t border-line px-5 py-3">
          <input type="hidden" name="gradeId" value={gradeId} />
          <input type="hidden" name="startsOn" value={defaultDate} />
          <label className="grid min-w-[12rem] flex-1 gap-1 text-sm">
            <span>{messages.addPupilLabel}</span>
            <select name="pupilId" required className="min-h-11 rounded-lg border border-input bg-paper px-3" disabled={pending}>
              <option value="">{messages.addPupilPlaceholder}</option>
              {addCandidates.map((candidate) => (
                <option key={candidate.pupilId} value={candidate.pupilId} disabled={!candidate.hasConsent}>
                  {candidate.displayName}
                  {candidate.isLegacyPending
                    ? ` (${messages.consentNoLegacy})`
                    : !candidate.hasConsent
                      ? ` (${messages.consentNo})`
                      : ""}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" className="min-h-11" disabled={pending} aria-busy={pending}>
            {pending ? <Loader2Icon className="size-4 animate-spin" aria-hidden /> : null}
            {messages.addPupilSubmit}
          </Button>
        </form>
      ) : null}
    </div>
    <ContentText tone="secondary" className="mt-3 text-sm">
      {messages.unenrollHint}
    </ContentText>
    </>
  );
};
