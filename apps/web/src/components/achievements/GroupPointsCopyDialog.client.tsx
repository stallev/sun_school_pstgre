"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { copyGroupAchievementPointsAction } from "@/actions/achievements";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/patterns/ConfirmDialog";
import { FormSelect } from "@/components/ui/form-select";
import type { GroupPointsMessages } from "@/lib/messages/group-points-messages";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import { resolveMessageKey } from "@/lib/messages/resolve-message-key";
import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";

type GroupPointsCopyDialogProps = {
  gradeId: string;
  academicYearId: string;
  sourceGrades: { id: string; name: string }[];
  messages: GroupPointsMessages;
  dictionaries: Record<string, Dictionary>;
  disabled?: boolean;
};

export const GroupPointsCopyDialog = ({
  gradeId,
  academicYearId,
  sourceGrades,
  messages,
  dictionaries,
  disabled = false,
}: GroupPointsCopyDialogProps) => {
  const [pending, startTransition] = useTransition();
  const [sourceGradeId, setSourceGradeId] = useState(sourceGrades[0]?.id ?? "");

  const handleConfirm = () => {
    if (!sourceGradeId) return;
    startTransition(async () => {
      const result = await copyGroupAchievementPointsAction({
        gradeId,
        academicYearId,
        sourceGradeId,
      });
      if (result.ok) {
        toast.success(messages.toastSaved, { duration: PRODUCT_TOAST_DURATION_MS });
        return;
      }
      const text = result.message
        ? resolveMessageKey(dictionaries, result.message)
        : messages.formError;
      toast.error(text, { duration: PRODUCT_TOAST_DURATION_MS });
    });
  };

  if (sourceGrades.length === 0) return null;

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="min-w-[12rem] flex-1">
        <FormSelect
          value={sourceGradeId}
          onValueChange={setSourceGradeId}
          disabled={disabled || pending}
          options={sourceGrades.map((grade) => ({ value: grade.id, label: grade.name }))}
          placeholder={messages.copyFromGroup}
          aria-label={messages.copyFromGroup}
        />
      </div>
      <ConfirmDialog
        trigger={
          <Button type="button" variant="outline" disabled={disabled || pending || !sourceGradeId}>
            {messages.copyFromGroup}
          </Button>
        }
        title={messages.copyDialogTitle}
        description={messages.copyDialogDescription}
        confirmLabel={messages.copyConfirm}
        cancelLabel={messages.cancel}
        onConfirm={handleConfirm}
        pending={pending}
      />
    </div>
  );
};
