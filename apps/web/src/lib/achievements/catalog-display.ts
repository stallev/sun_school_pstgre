import { ACHIEVEMENT_KIND, type AchievementKind } from "@sunschool/domain";

export const REWARD_CATEGORY_ORDER = ["CONSISTENCY", "EFFORT", "MEMORY"] as const;
export type RewardCategoryKey = (typeof REWARD_CATEGORY_ORDER)[number];

export const PRACTICE_ACHIEVEMENT_CODE = "practice";
export const WORSHIP_RECITAL_ACHIEVEMENT_CODE = "worship_recital";
export const ACTIVE_WORK_ACHIEVEMENT_CODE = "active_work";
export const CHECK_LESSON_AWARD_CODES = [
  WORSHIP_RECITAL_ACHIEVEMENT_CODE,
  ACTIVE_WORK_ACHIEVEMENT_CODE,
] as const;
export type CheckLessonAwardCode = (typeof CHECK_LESSON_AWARD_CODES)[number];

export type CatalogTierDto = {
  tier: number;
  length: number;
  points: number;
};

export type CatalogRowDto = {
  id: string;
  code: string;
  kind: AchievementKind;
  nameRu: string;
  nameEn: string;
  descriptionRu: string | null;
  descriptionEn: string | null;
  category: string | null;
  ruleType: string;
  metric: string | null;
  threshold: number | null;
  isActive: boolean;
  tiers: CatalogTierDto[];
  activePenaltyCount: number;
  kindLocked: boolean;
};

export const isPenaltyRow = (row: CatalogRowDto): boolean => row.kind === ACHIEVEMENT_KIND.PENALTY;
