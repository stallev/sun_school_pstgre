"use client";

import { useActionState } from "react";
import { Loader2Icon, Undo2Icon } from "lucide-react";
import type { MutationResult } from "@sunschool/domain";
import { recalculateAchievementsAction } from "@/actions/achievements";
import type { RecalculateAchievementsSuccess } from "@/data/achievements/recalculate-achievements";
import { ContentText } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import type { AchievementsCatalogMessages } from "@/lib/messages/pick-achievements-catalog-messages.server";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import { useAdminFormMutation } from "@/lib/admin/use-admin-form-mutation";

type AchievementsRecalcBarProps = {
  messages: AchievementsCatalogMessages;
  dictionaries: Record<string, Dictionary>;
};

export const AchievementsRecalcBar = ({ messages, dictionaries }: AchievementsRecalcBarProps) => {
  const [state, formAction, pending] = useActionState<
    MutationResult<RecalculateAchievementsSuccess> | null,
    FormData
  >(recalculateAchievementsAction, null);

  useAdminFormMutation({
    state,
    dictionaries,
    successMessage: messages.toastRecalculated,
    formErrorFallback: messages.formError,
  });

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
      <ContentText tone="secondary" className="max-w-[70ch] text-sm">
        {messages.recalcHint}
      </ContentText>
      <form action={formAction} className="shrink-0">
        <Button type="submit" variant="outline" disabled={pending} aria-busy={pending} className="min-h-11">
          {pending ? (
            <Loader2Icon className="size-4 animate-spin" aria-hidden />
          ) : (
            <Undo2Icon className="size-4" aria-hidden />
          )}
          {pending ? messages.submitPending : messages.recalcButton}
        </Button>
      </form>
    </div>
  );
};
