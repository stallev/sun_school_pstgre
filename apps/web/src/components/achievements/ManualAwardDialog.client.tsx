"use client";

import { Dialog } from "@/components/ui/dialog";
import { ManualAwardDialogForm } from "@/components/achievements/ManualAwardDialogForm.client";
import type { ManualAwardFormData } from "@/lib/achievements/manual-award-types";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import type { TeacherAchievementsMessages } from "@/lib/messages/teacher-achievements-messages";

type ManualAwardDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gradeId: string;
  academicYearId: string;
  formData: ManualAwardFormData;
  fixedPupilId?: string;
  messages: TeacherAchievementsMessages;
  dictionaries: Record<string, Dictionary>;
  formError: string;
};

export const ManualAwardDialog = ({
  open,
  onOpenChange,
  gradeId,
  academicYearId,
  formData,
  fixedPupilId,
  messages,
  dictionaries,
  formError,
}: ManualAwardDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    {open ? (
      <ManualAwardDialogForm
        gradeId={gradeId}
        academicYearId={academicYearId}
        formData={formData}
        fixedPupilId={fixedPupilId}
        messages={messages}
        dictionaries={dictionaries}
        formError={formError}
        onClose={() => onOpenChange(false)}
      />
    ) : null}
  </Dialog>
);
