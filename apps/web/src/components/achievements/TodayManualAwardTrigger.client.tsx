"use client";

import { useState } from "react";
import { AwardIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ManualAwardDialog } from "@/components/achievements/ManualAwardDialog.client";
import type { ManualAwardFormData } from "@/lib/achievements/manual-award-types";
import type { TeacherAchievementsMessages } from "@/lib/messages/teacher-achievements-messages";
import type { Dictionary } from "@/lib/messages/get-dictionary";

type TodayManualAwardTriggerProps = {
  gradeId: string;
  academicYearId: string;
  formData: ManualAwardFormData;
  messages: TeacherAchievementsMessages;
  dictionaries: Record<string, Dictionary>;
  formError: string;
};

export const TodayManualAwardTrigger = ({
  gradeId,
  academicYearId,
  formData,
  messages,
  dictionaries,
  formError,
}: TodayManualAwardTriggerProps) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="mt-3 min-h-11 w-full sm:w-auto"
        onClick={() => setOpen(true)}
      >
        <AwardIcon className="size-4" aria-hidden />
        {messages.manualAwardButton}
      </Button>
      <ManualAwardDialog
        open={open}
        onOpenChange={setOpen}
        gradeId={gradeId}
        academicYearId={academicYearId}
        formData={formData}
        messages={messages}
        dictionaries={dictionaries}
        formError={formError}
      />
    </>
  );
};
