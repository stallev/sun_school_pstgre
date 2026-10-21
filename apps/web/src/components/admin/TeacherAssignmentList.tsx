"use client";

import { useActionState } from "react";
import type { MutationResult } from "@sunschool/domain";
import { assignTeacherAction, unassignTeacherAction } from "@/actions/school-groups";
import { useAdminMessages } from "@/components/admin/admin-messages-provider.client";
import { ContentText, SectionTitle } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import type { GroupAdminDetail } from "@/data/school/load-group-admin-detail.server";
import type { TeacherCandidate } from "@/data/school/load-teacher-candidates.server";
import { useAdminFormMutation } from "@/lib/admin/use-admin-form-mutation";
import type { Dictionary } from "@/lib/messages/get-dictionary";

type TeacherAssignmentListProps = {
  detail: GroupAdminDetail;
  candidates: TeacherCandidate[];
  dictionaries: Record<string, Dictionary>;
  formError: string;
};

export const TeacherAssignmentList = ({
  detail,
  candidates,
  dictionaries,
  formError,
}: TeacherAssignmentListProps) => {
  const messages = useAdminMessages();
  const [assignState, assignAction, assignPending] = useActionState<MutationResult | null, FormData>(
    assignTeacherAction,
    null,
  );
  const [unassignState, unassignAction, unassignPending] = useActionState<MutationResult | null, FormData>(
    unassignTeacherAction,
    null,
  );

  useAdminFormMutation({
    state: assignState,
    dictionaries,
    successMessage: messages.group.toastTeacherAssigned,
    formErrorFallback: formError,
  });
  useAdminFormMutation({
    state: unassignState,
    dictionaries,
    successMessage: messages.group.toastTeacherUnassigned,
    formErrorFallback: formError,
  });

  const assignedIds = new Set(detail.assignments.map((row) => row.userId));
  const available = candidates.filter((row) => !assignedIds.has(row.userId));
  const pending = assignPending || unassignPending;

  return (
    <section className="space-y-4 rounded-xl border border-line bg-surface p-4 sm:p-5">
      <SectionTitle>{messages.group.teachersTitle}</SectionTitle>
      {detail.assignments.length === 0 ? (
        <ContentText tone="secondary">{messages.group.teachersEmpty}</ContentText>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {detail.assignments.map((row) => (
            <li key={row.userId} className="flex items-center justify-between gap-3 py-3">
              <ContentText>{row.displayName}</ContentText>
              <form action={unassignAction}>
                <input type="hidden" name="gradeId" value={detail.gradeId} />
                <input type="hidden" name="yearId" value={detail.yearId} />
                <input type="hidden" name="userId" value={row.userId} />
                <Button
                  type="submit"
                  variant="ghost"
                  className="h-9 px-3 text-sm"
                  disabled={pending}
                  aria-busy={pending}
                >
                  {messages.group.unassignTeacher}
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}
      {available.length > 0 ? (
        <form action={assignAction} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <input type="hidden" name="gradeId" value={detail.gradeId} />
          <input type="hidden" name="yearId" value={detail.yearId} />
          <label className="grid flex-1 gap-1 text-sm">
            <span>{messages.group.assignTeacherLabel}</span>
            <select
              name="userId"
              className="min-h-11 rounded-lg border border-input bg-paper px-3"
              required
              disabled={pending}
              defaultValue=""
            >
              <option value="" disabled>{messages.group.assignTeacherPlaceholder}</option>
              {available.map((row) => (
                <option key={row.userId} value={row.userId}>{row.displayName}</option>
              ))}
            </select>
          </label>
          <Button type="submit" disabled={pending} aria-busy={pending}>
            {assignPending ? messages.group.submitPending : messages.group.assignTeacher}
          </Button>
        </form>
      ) : (
        <ContentText tone="secondary" className="text-sm">{messages.group.noTeachersAvailable}</ContentText>
      )}
    </section>
  );
};
