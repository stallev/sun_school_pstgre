import { AchievementsCatalogBoard } from "@/components/achievements/AchievementsCatalogBoard.client";
import type { CatalogRowDto } from "@/lib/achievements/catalog-display";
import { ACHIEVEMENT_KIND } from "@sunschool/domain";
import { getDictionary } from "@/lib/messages/get-dictionary";
import { pickAchievementsCatalogMessages } from "@/lib/messages/pick-achievements-catalog-messages.server";

const SAMPLE_REWARDS: CatalogRowDto[] = [
  {
    id: "sample-1",
    code: "verses",
    kind: ACHIEVEMENT_KIND.REWARD,
    nameRu: "Хранитель слова",
    nameEn: "Keeper",
    descriptionRu: "Все стихи урока на «2» подряд",
    descriptionEn: "Verses",
    category: "MEMORY",
    ruleType: "SERIES",
    metric: "verses_all_perfect",
    threshold: null,
    isActive: true,
    tiers: [{ tier: 1, length: 3, points: 10 }],
    activePenaltyCount: 0,
    kindLocked: true,
  },
];

const SAMPLE_PENALTIES: CatalogRowDto[] = [
  {
    id: "sample-p1",
    code: "behavior",
    kind: ACHIEVEMENT_KIND.PENALTY,
    nameRu: "Плохое поведение",
    nameEn: "Misbehaviour",
    descriptionRu: "Штраф за поведение",
    descriptionEn: "Penalty",
    category: null,
    ruleType: "MANUAL",
    metric: null,
    threshold: -3,
    isActive: true,
    tiers: [],
    activePenaltyCount: 2,
    kindLocked: true,
  },
];

export const AchievementsCatalogLab = async () => {
  const admin = await getDictionary("ru", "admin");
  const common = await getDictionary("ru", "common");
  const messages = pickAchievementsCatalogMessages(admin, common);

  return (
    <AchievementsCatalogBoard
      rewards={SAMPLE_REWARDS}
      penalties={SAMPLE_PENALTIES}
      messages={messages}
      dictionaries={{ admin, common }}
    />
  );
};
