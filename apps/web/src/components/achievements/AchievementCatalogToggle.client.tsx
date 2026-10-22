"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { setAchievementActiveAction } from "@/actions/achievements";
import { Switch } from "@/components/ui/switch";
import type { AchievementsCatalogMessages } from "@/lib/messages/pick-achievements-catalog-messages.server";
import { resolveMessageKey } from "@/lib/messages/resolve-message-key";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";
import { PRACTICE_ACHIEVEMENT_CODE } from "@/lib/achievements/catalog-display";

type AchievementCatalogToggleProps = {
  achievementId: string;
  code: string;
  nameRu: string;
  isActive: boolean;
  messages: AchievementsCatalogMessages;
  dictionaries: Record<string, Dictionary>;
};

export const AchievementCatalogToggle = ({
  achievementId,
  code,
  nameRu,
  isActive,
  messages,
  dictionaries,
}: AchievementCatalogToggleProps) => {
  const [pending, startTransition] = useTransition();
  const isPractice = code === PRACTICE_ACHIEVEMENT_CODE;
  const checked = isPractice ? false : isActive;

  const handleChange = (next: boolean) => {
    startTransition(async () => {
      const result = await setAchievementActiveAction({ achievementId, isActive: next });
      if (result.ok) {
        toast.success(messages.toastToggled, { duration: PRODUCT_TOAST_DURATION_MS });
        return;
      }
      const text = result.message
        ? resolveMessageKey(dictionaries, result.message)
        : messages.formError;
      toast.error(text, { duration: PRODUCT_TOAST_DURATION_MS });
    });
  };

  return (
    <Switch
      checked={checked}
      disabled={pending || isPractice}
      aria-busy={pending}
      aria-label={messages.toggleEnable.replace("{name}", nameRu)}
      onCheckedChange={handleChange}
    />
  );
};
