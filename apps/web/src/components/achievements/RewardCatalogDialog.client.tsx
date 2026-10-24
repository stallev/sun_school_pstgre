"use client";

import { useActionState } from "react";
import type { MutationResult } from "@sunschool/domain";
import { upsertRewardAchievementAction } from "@/actions/achievements";
import { ContentText } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/form-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { CatalogRowDto } from "@/lib/achievements/catalog-display";
import type { AchievementsCatalogMessages } from "@/lib/messages/pick-achievements-catalog-messages.server";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import { useAdminFormMutation } from "@/lib/admin/use-admin-form-mutation";
import { FORM_SUBMIT_BUTTON_CLASS } from "@/lib/ui/form-submit-button-class";

type RewardCatalogDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: CatalogRowDto | null;
  messages: AchievementsCatalogMessages;
  dictionaries: Record<string, Dictionary>;
};

export const RewardCatalogDialog = ({
  open,
  onOpenChange,
  row,
  messages,
  dictionaries,
}: RewardCatalogDialogProps) => {
  const [state, formAction, pending] = useActionState<
    MutationResult<{ achievementId: string }> | null,
    FormData
  >(upsertRewardAchievementAction, null);

  useAdminFormMutation({
    state,
    dictionaries,
    successMessage: messages.toastSaved,
    formErrorFallback: messages.formError,
    onSuccess: () => onOpenChange(false),
  });

  const title = row ? messages.rewardDialogEdit : messages.rewardDialogCreate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{messages.rewardDialogHint}</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="mt-5 space-y-4" aria-busy={pending}>
          {row ? <input type="hidden" name="achievementId" value={row.id} /> : null}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span>{messages.fieldName}</span>
              <Input name="nameRu" required defaultValue={row?.nameRu ?? ""} disabled={pending} />
            </label>
            <label className="grid gap-1 text-sm">
              <span>{messages.fieldNameEn}</span>
              <Input name="nameEn" required defaultValue={row?.nameEn ?? ""} disabled={pending} />
            </label>
          </div>
          <label className="grid gap-1 text-sm">
            <span>{messages.fieldCategory}</span>
            <FormSelect
              name="category"
              defaultValue={row?.category ?? "EFFORT"}
              disabled={pending}
              options={[
                { value: "CONSISTENCY", label: messages.sectionByCategory.CONSISTENCY ?? "CONSISTENCY" },
                { value: "EFFORT", label: messages.sectionByCategory.EFFORT ?? "EFFORT" },
                { value: "MEMORY", label: messages.sectionByCategory.MEMORY ?? "MEMORY" },
              ]}
            />
          </label>
          {!row?.kindLocked ? (
            <>
              <input type="hidden" name="ruleType" value={row?.ruleType ?? "SERIES"} />
              <input type="hidden" name="metric" value={row?.metric ?? "verses_all_perfect"} />
            </>
          ) : (
            <>
              <input type="hidden" name="ruleType" value={row.ruleType} />
              <input type="hidden" name="metric" value={row.metric ?? ""} />
            </>
          )}
          <input type="hidden" name="descriptionRu" value={row?.descriptionRu ?? row?.nameRu ?? ""} />
          <input type="hidden" name="descriptionEn" value={row?.descriptionEn ?? row?.nameEn ?? ""} />
          <div>
            <p className="text-sm font-medium">{messages.fieldTiers}</p>
            <div className="mt-2 space-y-2">
              {[1, 2, 3].map((tier) => {
                const existing = row?.tiers.find((t) => t.tier === tier);
                return (
                  <div key={tier} className="grid grid-cols-[6rem_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2">
                    <span className="text-sm">{messages.tierLabels[tier - 1]}</span>
                    <Input
                      name={`tier_${tier}_length`}
                      inputMode="numeric"
                      className="tabular-nums"
                      defaultValue={existing ? String(existing.length) : ""}
                      disabled={pending}
                    />
                    <Input
                      name={`tier_${tier}_points`}
                      inputMode="numeric"
                      placeholder={messages.fieldTierPointsPlaceholder}
                      className="tabular-nums"
                      defaultValue={existing ? String(existing.points) : ""}
                      disabled={pending}
                    />
                  </div>
                );
              })}
            </div>
            <ContentText tone="muted" className="mt-1.5 text-sm">
              {messages.fieldTiersHint}
            </ContentText>
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
              {messages.cancelLabel}
            </Button>
            <Button type="submit" disabled={pending} aria-busy={pending} className={FORM_SUBMIT_BUTTON_CLASS}>
              {pending ? messages.submitPending : row ? messages.saveSubmit : messages.createSubmit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
