"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setGroupAchievementModeAction } from "@/actions/teacher-achievements";
import { SectionTitle } from "@/components/atoms/SectionTitle";
import { ContentText } from "@/components/atoms/ContentText";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { AchievementModeOffDialog } from "@/components/achievements/AchievementModeOffDialog.client";
import type { TeacherAchievementsMessages } from "@/lib/messages/teacher-achievements-messages";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import { resolveMessageKey } from "@/lib/messages/resolve-message-key";
import { fillMessage } from "@/lib/messages/fill-message";
import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";

type GroupAchievementModeCardProps = {
  gradeId: string;
  academicYearId: string;
  achievementsEnabled: boolean;
  offPeriodLabel: string | null;
  canMutate: boolean;
  messages: TeacherAchievementsMessages;
  dictionaries: Record<string, Dictionary>;
  formError: string;
};

export const GroupAchievementModeCard = ({
  gradeId,
  academicYearId,
  achievementsEnabled,
  offPeriodLabel,
  canMutate,
  messages,
  dictionaries,
  formError,
}: GroupAchievementModeCardProps) => {
  const [pending, startTransition] = useTransition();
  const [offOpen, setOffOpen] = useState(false);

  const applyMode = (enabled: boolean) => {
    startTransition(async () => {
      const result = await setGroupAchievementModeAction({
        gradeId,
        academicYearId,
        enabled,
      });
      if (result.ok) {
        toast.success(enabled ? messages.toastModeOn : messages.toastModeOff, {
          duration: PRODUCT_TOAST_DURATION_MS,
        });
        setOffOpen(false);
        return;
      }
      const text = result.message
        ? resolveMessageKey(dictionaries, result.message)
        : formError;
      toast.error(text, { duration: PRODUCT_TOAST_DURATION_MS });
    });
  };

  const handleToggle = (next: boolean) => {
    if (!canMutate || pending) return;
    if (!next) {
      setOffOpen(true);
      return;
    }
    applyMode(true);
  };

  const description = achievementsEnabled
    ? messages.modeOnDescription
    : fillMessage(messages.modeOffDescriptionTemplate, {
        from: offPeriodLabel ?? "…",
      });

  return (
    <>
      <Card className="mb-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="min-w-0">
          <SectionTitle>{messages.modeCardTitle}</SectionTitle>
          <ContentText className="mt-1 max-w-[70ch] text-sm text-ink-2">{description}</ContentText>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <ContentText className={`text-sm ${achievementsEnabled ? "text-ink-2" : "text-muted"}`}>
            {achievementsEnabled ? messages.modeOnLabel : messages.modeOffLabel}
          </ContentText>
          <Switch
            checked={achievementsEnabled}
            disabled={!canMutate || pending}
            aria-busy={pending}
            aria-label={messages.modeToggleAria}
            onCheckedChange={handleToggle}
          />
        </div>
      </Card>
      <AchievementModeOffDialog
        open={offOpen}
        onOpenChange={setOffOpen}
        pending={pending}
        onConfirm={() => applyMode(false)}
        messages={messages}
      />
    </>
  );
};
