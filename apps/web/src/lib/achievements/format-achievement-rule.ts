import type { CatalogRowDto, CatalogTierDto } from "@/lib/achievements/catalog-display";
import type { AchievementsCatalogMessages } from "@/lib/messages/pick-achievements-catalog-messages.server";
import type { MessageLocale } from "@/lib/messages/dictionary-types";
import { selectPluralForm } from "@/lib/messages/plural";
import { fillMessage } from "@/lib/messages/fill-message";

export const LESSON_POINTS_SUM_METRIC = "lesson_points_sum";

const PRACTICE_DESCRIPTION_FIX_RU =
  /в три разных дня окна/g;
const PRACTICE_DESCRIPTION_FIX_EN =
  /on three different days of the window/gi;

/** User-visible achievement description (D-13); seed text unchanged in DB. */
export const formatAchievementDescriptionForDisplay = (
  description: string | null,
  locale: MessageLocale,
): string | null => {
  if (!description?.trim()) return null;
  if (locale === "en") {
    return description.replace(
      PRACTICE_DESCRIPTION_FIX_EN,
      "on three different days within the week",
    );
  }
  return description.replace(
    PRACTICE_DESCRIPTION_FIX_RU,
    "в три разных дня в течение недели",
  );
};

const resolveConditionPluralForms = (
  row: CatalogRowDto,
  messages: AchievementsCatalogMessages,
) =>
  row.metric === LESSON_POINTS_SUM_METRIC
    ? messages.tierPointsPlural
    : messages.tierLessonsPlural;

export const formatAchievementTierLine = (
  row: CatalogRowDto,
  tier: CatalogTierDto,
  messages: AchievementsCatalogMessages,
  locale: MessageLocale,
): string => {
  const conditionForms = resolveConditionPluralForms(row, messages);
  const condition = `${tier.length} ${selectPluralForm(conditionForms, tier.length, locale)}`;
  const bricks = `+${tier.points} ${selectPluralForm(messages.tierBricksPlural, tier.points, locale)}`;
  const tierLabel = row.tiers.length > 1 ? messages.tierLabels[tier.tier - 1] : "";
  const prefix = tierLabel ? `${tierLabel}: ` : "";
  return fillMessage(messages.tierAfterCondition, {
    prefix,
    condition,
    bricks,
  });
};
