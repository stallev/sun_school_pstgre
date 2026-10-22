"use client";

import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AchievementsCatalogMessages } from "@/lib/messages/pick-achievements-catalog-messages.server";

type AchievementsPageHeaderActionsProps = {
  messages: AchievementsCatalogMessages;
  onAddReward: () => void;
};

export const AchievementsPageHeaderActions = ({
  messages,
  onAddReward,
}: AchievementsPageHeaderActionsProps) => (
  <Button type="button" className="min-h-11" onClick={onAddReward}>
    <PlusIcon className="size-4" aria-hidden />
    {messages.addReward}
  </Button>
);
