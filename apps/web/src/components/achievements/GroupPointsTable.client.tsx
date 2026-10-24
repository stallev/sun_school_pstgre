"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MUTATION_ERROR_CODES } from "@sunschool/domain";
import { setGroupAchievementPointsAction } from "@/actions/achievements";
import { GroupPointsCopyDialog } from "@/components/achievements/GroupPointsCopyDialog.client";
import { GroupPointsTableGrid } from "@/components/achievements/GroupPointsTableGrid.client";
import { useGroupPointsEditorDrafts } from "@/components/achievements/use-group-points-editor-drafts";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/form-select";
import { Label } from "@/components/ui/label";
import type { GroupPointsEditorData } from "@/data/achievements/load-group-points-page.server";
import { collectGroupPointsSaveItems } from "@/lib/achievements/group-points-drafts";
import type { GroupPointsMessages } from "@/lib/messages/group-points-messages";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import { resolveMessageKey } from "@/lib/messages/resolve-message-key";
import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";

type GroupPointsTableProps = {
  editor: GroupPointsEditorData;
  pagePath: string;
  messages: GroupPointsMessages;
  dictionaries: Record<string, Dictionary>;
};

export const GroupPointsTable = ({
  editor,
  pagePath,
  messages,
  dictionaries,
}: GroupPointsTableProps) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { drafts, setDrafts, fieldErrors, setFieldErrors, hasChanges } =
    useGroupPointsEditorDrafts(editor);

  const handleSave = () => {
    startTransition(async () => {
      const { items, fieldErrors: nextErrors } = collectGroupPointsSaveItems(
        editor.rows,
        drafts,
        messages.formError,
      );

      if (Object.keys(nextErrors).length > 0) {
        setFieldErrors(nextErrors);
        return;
      }
      if (items.length === 0) return;

      setFieldErrors({});
      const result = await setGroupAchievementPointsAction({
        gradeId: editor.gradeId,
        academicYearId: editor.academicYearId,
        items,
      });

      if (result.ok) {
        toast.success(messages.toastSaved, { duration: PRODUCT_TOAST_DURATION_MS });
        return;
      }

      const text = result.message
        ? resolveMessageKey(dictionaries, result.message)
        : messages.formError;
      if (result.code === MUTATION_ERROR_CODES.ACHIEVEMENT_GROUP_POINTS_INVALID) {
        setFieldErrors({ form: text });
      }
      toast.error(text, { duration: PRODUCT_TOAST_DURATION_MS });
    });
  };

  return (
    <div className="space-y-4">
      {editor.yearOptions.length > 1 ? (
        <div className="max-w-xs">
          <Label className="mb-1.5 block text-sm text-ink-2">{messages.yearLabel}</Label>
          <FormSelect
            value={editor.academicYearId}
            onValueChange={(yearId) => router.push(`${pagePath}?year=${yearId}`)}
            options={editor.yearOptions.map((year) => ({ value: year.id, label: year.name }))}
            aria-label={messages.yearLabel}
            disabled={pending}
          />
        </div>
      ) : null}

      <GroupPointsTableGrid
        rows={editor.rows}
        drafts={drafts}
        fieldErrors={fieldErrors}
        canEdit={editor.canMutate}
        messages={messages}
        onDraftChange={(rowKey, value) =>
          setDrafts((prev) => ({ ...prev, [rowKey]: value }))
        }
        onReset={(rowKey) => setDrafts((prev) => ({ ...prev, [rowKey]: "" }))}
      />

      {editor.canMutate ? (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <GroupPointsCopyDialog
            gradeId={editor.gradeId}
            academicYearId={editor.academicYearId}
            sourceGrades={editor.copySourceGrades}
            messages={messages}
            dictionaries={dictionaries}
            disabled={pending}
          />
          <Button
            type="button"
            onClick={handleSave}
            disabled={pending || !hasChanges}
            aria-busy={pending}
          >
            {pending ? messages.saving : messages.save}
          </Button>
        </div>
      ) : null}
    </div>
  );
};
