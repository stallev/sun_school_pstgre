import { ACHIEVEMENT_KIND, type AchievementKind } from "@sunschool/domain";
import { emptyCounts, type SeedCounts, type SeedTx } from "./types";

/**
 * Starter catalog (seed_data_spec §6.1; source `achievements_spec.md` §9). Rewards carry tiers
 * `(tier, length N, points)`; penalties are `kind = PENALTY` rows whose `threshold` holds the
 * (negative) points. The catalog sleeps while `features.achievements = false` (ADR-005).
 * Definition fields are re-applied on every run; `isActive` is set only on creation.
 */
export type CatalogTier = { tier: 1 | 2 | 3; length: number; points: number };

export type CatalogEntry = {
  code: string;
  kind: AchievementKind;
  nameRu: string;
  nameEn: string;
  descriptionRu: string;
  descriptionEn: string;
  category: "MEMORY" | "EFFORT" | "CONSISTENCY" | null;
  ruleType: "SERIES" | "ACCUMULATION" | "ONCE" | "MANUAL";
  metric: string | null;
  /** Penalty points (negative) for PENALTY; `null` for rewards. */
  threshold: number | null;
  isActive: boolean;
  tiers: readonly CatalogTier[];
};

export const ACHIEVEMENT_CATALOG: readonly CatalogEntry[] = [
  {
    code: "verses",
    kind: ACHIEVEMENT_KIND.REWARD,
    nameRu: "Хранитель слова",
    nameEn: "Keeper of the Word",
    descriptionRu: "Все стихи, рассказанные на уроке, на «2» несколько уроков подряд",
    descriptionEn: "Every verse recited in class scored 2, several lessons in a row",
    category: "MEMORY",
    ruleType: "SERIES",
    metric: "verses_all_perfect",
    threshold: null,
    isActive: true,
    tiers: [
      { tier: 1, length: 3, points: 10 },
      { tier: 2, length: 5, points: 15 },
      { tier: 3, length: 7, points: 25 },
    ],
  },
  {
    code: "notebook",
    kind: ACHIEVEMENT_KIND.REWARD,
    nameRu: "Аккуратная тетрадь",
    nameEn: "Neat notebook",
    descriptionRu: "Тетрадь от 9 баллов несколько уроков подряд",
    descriptionEn: "Notebook scored 9 or more, several lessons in a row",
    category: "EFFORT",
    ruleType: "SERIES",
    metric: "notebook_score_gte_9",
    threshold: null,
    isActive: true,
    tiers: [
      { tier: 1, length: 3, points: 5 },
      { tier: 2, length: 5, points: 10 },
      { tier: 3, length: 10, points: 20 },
    ],
  },
  {
    code: "test",
    kind: ACHIEVEMENT_KIND.REWARD,
    nameRu: "Внимательный читатель",
    nameEn: "Attentive reader",
    descriptionRu: "Тест от 8 баллов несколько уроков подряд",
    descriptionEn: "Test scored 8 or more, several lessons in a row",
    category: "EFFORT",
    ruleType: "SERIES",
    metric: "test_score_gte_8",
    threshold: null,
    isActive: true,
    tiers: [
      { tier: 1, length: 3, points: 5 },
      { tier: 2, length: 5, points: 10 },
      { tier: 3, length: 10, points: 20 },
    ],
  },
  {
    code: "practice",
    kind: ACHIEVEMENT_KIND.REWARD,
    nameRu: "Три дня со стихом",
    nameEn: "Three days with a verse",
    descriptionRu: "Стих урока рассказан голосом в три разных дня окна",
    descriptionEn: "The lesson verse recited by voice on three different days of the window",
    category: "CONSISTENCY",
    ruleType: "ACCUMULATION",
    metric: "verse_voice_three_days",
    threshold: null,
    isActive: false,
    tiers: [
      { tier: 1, length: 1, points: 3 },
      { tier: 2, length: 5, points: 10 },
      { tier: 3, length: 15, points: 20 },
    ],
  },
  {
    code: "lessons",
    kind: ACHIEVEMENT_KIND.REWARD,
    nameRu: "Верный ученик",
    nameEn: "Faithful pupil",
    descriptionRu: "Уроки с выполненным домашним заданием",
    descriptionEn: "Lessons with completed homework",
    category: "CONSISTENCY",
    ruleType: "ACCUMULATION",
    metric: "lesson_homework_done",
    threshold: null,
    isActive: true,
    tiers: [
      { tier: 1, length: 5, points: 5 },
      { tier: 2, length: 15, points: 10 },
      { tier: 3, length: 30, points: 20 },
    ],
  },
  {
    code: "first",
    kind: ACHIEVEMENT_KIND.REWARD,
    nameRu: "Первый идеальный стих",
    nameEn: "First perfect verse",
    descriptionRu: "Хотя бы один стих на «2»",
    descriptionEn: "At least one verse scored 2",
    category: "MEMORY",
    ruleType: "ONCE",
    metric: "verse_perfect",
    threshold: null,
    isActive: true,
    tiers: [{ tier: 1, length: 1, points: 2 }],
  },
  {
    code: "singing",
    kind: ACHIEVEMENT_KIND.REWARD,
    nameRu: "Голос хора",
    nameEn: "Voice of the choir",
    descriptionRu: "Присутствие на спевках",
    descriptionEn: "Attendance at choir practice",
    category: "CONSISTENCY",
    ruleType: "ACCUMULATION",
    metric: "choir_attended",
    threshold: null,
    isActive: true,
    tiers: [
      { tier: 1, length: 5, points: 5 },
      { tier: 2, length: 15, points: 10 },
    ],
  },
  {
    code: "hundred",
    kind: ACHIEVEMENT_KIND.REWARD,
    nameRu: "Сто кирпичиков",
    nameEn: "One hundred bricks",
    descriptionRu: "Сто баллов за уроки нарастающим итогом (бонусы не считаются)",
    descriptionEn: "One hundred lesson points cumulatively (bonuses do not count)",
    category: "EFFORT",
    ruleType: "ACCUMULATION",
    metric: "lesson_points_sum",
    threshold: null,
    isActive: true,
    tiers: [{ tier: 1, length: 100, points: 10 }],
  },
  {
    code: "behavior",
    kind: ACHIEVEMENT_KIND.PENALTY,
    nameRu: "Плохое поведение на уроке",
    nameEn: "Misbehaviour in class",
    descriptionRu: "Штраф за плохое поведение на уроке",
    descriptionEn: "Penalty for misbehaviour in class",
    category: null,
    ruleType: "MANUAL",
    metric: null,
    threshold: -3,
    isActive: true,
    tiers: [],
  },
  {
    code: "disrupt",
    kind: ACHIEVEMENT_KIND.PENALTY,
    nameRu: "Мешал проведению урока",
    nameEn: "Disrupted the lesson",
    descriptionRu: "Штраф за помехи проведению урока",
    descriptionEn: "Penalty for disrupting the lesson",
    category: null,
    ruleType: "MANUAL",
    metric: null,
    threshold: -2,
    isActive: true,
    tiers: [],
  },
  {
    code: "disrespect",
    kind: ACHIEVEMENT_KIND.PENALTY,
    nameRu: "Неуважение к учителю или детям",
    nameEn: "Disrespect",
    descriptionRu: "Штраф за неуважение к учителю или детям",
    descriptionEn: "Penalty for disrespect towards the teacher or children",
    category: null,
    ruleType: "MANUAL",
    metric: null,
    threshold: -5,
    isActive: true,
    tiers: [],
  },
];

export async function ensureAchievementCatalog(tx: SeedTx): Promise<SeedCounts> {
  const counts = emptyCounts();
  for (const entry of ACHIEVEMENT_CATALOG) {
    const definition = {
      nameRu: entry.nameRu,
      nameEn: entry.nameEn,
      descriptionRu: entry.descriptionRu,
      descriptionEn: entry.descriptionEn,
      category: entry.category,
      kind: entry.kind,
      ruleType: entry.ruleType,
      metric: entry.metric,
      threshold: entry.threshold,
    } as const;

    let achievement = await tx.achievement.findUnique({ where: { code: entry.code } });
    if (!achievement) {
      achievement = await tx.achievement.create({
        data: { code: entry.code, isActive: entry.isActive, ...definition },
      });
      counts.created += 1;
    } else {
      const same =
        achievement.nameRu === definition.nameRu &&
        achievement.nameEn === definition.nameEn &&
        achievement.descriptionRu === definition.descriptionRu &&
        achievement.descriptionEn === definition.descriptionEn &&
        achievement.category === definition.category &&
        achievement.kind === definition.kind &&
        achievement.ruleType === definition.ruleType &&
        achievement.metric === definition.metric &&
        achievement.threshold === definition.threshold;
      if (!same) {
        achievement = await tx.achievement.update({ where: { id: achievement.id }, data: definition });
        counts.updated += 1;
      }
    }

    for (const tier of entry.tiers) {
      const existing = await tx.achievementTier.findUnique({
        where: { achievementId_tier: { achievementId: achievement.id, tier: tier.tier } },
      });
      if (!existing) {
        await tx.achievementTier.create({
          data: { achievementId: achievement.id, tier: tier.tier, length: tier.length, points: tier.points },
        });
        counts.created += 1;
      } else if (existing.length !== tier.length || existing.points !== tier.points) {
        await tx.achievementTier.update({
          where: { id: existing.id },
          data: { length: tier.length, points: tier.points },
        });
        counts.updated += 1;
      }
    }
  }
  return counts;
}
