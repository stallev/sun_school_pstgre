import type { TeacherAchievementsMessages } from "@/lib/messages/teacher-achievements-messages";

export const formatTierLabel = (tier: number, messages: TeacherAchievementsMessages): string => {
  if (tier === 1) return messages.tierBronze;
  if (tier === 2) return messages.tierSilver;
  if (tier === 3) return messages.tierGold;
  return String(tier);
};
