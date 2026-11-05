import { ACHIEVEMENT_KIND, type AchievementKind } from "@sunschool/domain";
import { emptyCounts, type SeedCounts, type SeedTx } from "./types";

/**
 * Starter catalog (seed_data_spec §6.1; source `achievements_spec.md` §9). Rewards carry tiers
 * `(tier, length N, points)`; penalties are `kind = PENALTY` rows whose `threshold` holds the
 * (negative) points. The catalog sleeps while `features.achievements = false` (ADR-005).
 * Definition fields are re-applied on every run; `isActive` and `requiresConfirmation` are set only on creation.
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
  ruleType: "SERIES" | "ACCUMULATION" | "ONCE" | "MANUAL" | "EVENT";
  metric: string | null;
  /** Penalty points (negative) for PENALTY; `null` for rewards. */
  threshold: number | null;
  isActive: boolean;
  /** Set only on creation; the migration flips `verses` for existing databases (ADR-016). */
  requiresConfirmation: boolean;
  tiers: readonly CatalogTier[];
};

export const ACHIEVEMENT_CATALOG: readonly CatalogEntry[] = [
  {
    code: "verses",
    kind: ACHIEVEMENT_KIND.REWARD,
    nameRu: "Хранитель слова",
    nameEn: "Keeper of the Word",
    descriptionRu: "Ученик рассказывает на проверке все золотые стихи урока на «2» несколько уроков подряд. Серия прерывается, если хотя бы один стих получил меньше «2»; повторные уроки без новых стихов серию не прерывают и не продлевают.",
    descriptionEn: "The pupil recites every golden verse of the lesson and scores 2 for each, several lessons in a row. The series breaks if any verse scores less than 2; review lessons without new verses neither break nor extend it.",
    category: "MEMORY",
    ruleType: "SERIES",
    metric: "verses_all_perfect",
    threshold: null,
    isActive: true,
    requiresConfirmation: true,
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
    descriptionRu: "Оценка за тетрадь на проверке 9 баллов или выше несколько уроков подряд. Урок с оценкой ниже 9 прерывает серию.",
    descriptionEn: "Notebook score of 9 or more at the check, several lessons in a row. A lesson scored below 9 breaks the series.",
    category: "EFFORT",
    ruleType: "SERIES",
    metric: "notebook_score_gte_9",
    threshold: null,
    isActive: true,
    requiresConfirmation: false,
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
    descriptionRu: "Оценка за тест на проверке 8 баллов или выше несколько уроков подряд. Урок с оценкой ниже 8 прерывает серию.",
    descriptionEn: "Test score of 8 or more at the check, several lessons in a row. A lesson scored below 8 breaks the series.",
    category: "EFFORT",
    ruleType: "SERIES",
    metric: "test_score_gte_8",
    threshold: null,
    isActive: true,
    requiresConfirmation: false,
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
    requiresConfirmation: false,
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
    descriptionRu: "Накопительно считаются уроки, по которым домашнее задание отмечено выполненным. Пропуски не обнуляют накопленное.",
    descriptionEn: "Counts lessons whose homework is marked as done, cumulatively. Missed lessons do not reset the total.",
    category: "CONSISTENCY",
    ruleType: "ACCUMULATION",
    metric: "lesson_homework_done",
    threshold: null,
    isActive: true,
    requiresConfirmation: false,
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
    descriptionRu: "Выдаётся один раз за учебный год, когда ученик впервые рассказал любой золотой стих на «2».",
    descriptionEn: "Awarded once per school year, the first time the pupil recites any golden verse and scores 2.",
    category: "MEMORY",
    ruleType: "ONCE",
    metric: "verse_perfect",
    threshold: null,
    isActive: true,
    requiresConfirmation: false,
    tiers: [{ tier: 1, length: 1, points: 2 }],
  },
  {
    code: "singing",
    kind: ACHIEVEMENT_KIND.REWARD,
    nameRu: "Голос хора",
    nameEn: "Voice of the choir",
    descriptionRu: "Накопительно считаются спевки, на которых ученик присутствовал.",
    descriptionEn: "Counts choir practices the pupil attended, cumulatively.",
    category: "CONSISTENCY",
    ruleType: "ACCUMULATION",
    metric: "choir_attended",
    threshold: null,
    isActive: true,
    requiresConfirmation: false,
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
    descriptionRu: "Выдаётся, когда баллы ученика за уроки набирают сто нарастающим итогом. Бонусы не считаются.",
    descriptionEn: "Awarded when the pupil's lesson points reach one hundred cumulatively. Bonuses do not count.",
    category: "EFFORT",
    ruleType: "ACCUMULATION",
    metric: "lesson_points_sum",
    threshold: null,
    isActive: true,
    requiresConfirmation: false,
    tiers: [{ tier: 1, length: 100, points: 10 }],
  },
  {
    code: "worship_recital",
    kind: ACHIEVEMENT_KIND.REWARD,
    nameRu: "Рассказал стихотворение на богослужении",
    nameEn: "Recited a poem at the service",
    descriptionRu: "Выдаётся учителем вручную каждый раз, когда ученик рассказал стихотворение на богослужении. Не ограничено одним разом за год.",
    descriptionEn: "Awarded manually by the teacher each time the pupil recites a poem at the church service. Not limited to once per year.",
    category: "MEMORY",
    ruleType: "EVENT",
    metric: null,
    threshold: null,
    isActive: true,
    requiresConfirmation: false,
    tiers: [{ tier: 1, length: 1, points: 6 }],
  },
  {
    code: "active_work",
    kind: ACHIEVEMENT_KIND.REWARD,
    nameRu: "Активная работа на уроке",
    nameEn: "Active work in class",
    descriptionRu: "Выдаётся учителем вручную за активную работу на уроке. Дата события совпадает с датой урока.",
    descriptionEn: "Awarded manually by the teacher for active work in class. The event date matches the lesson date.",
    category: "EFFORT",
    ruleType: "EVENT",
    metric: null,
    threshold: null,
    isActive: true,
    requiresConfirmation: false,
    tiers: [{ tier: 1, length: 1, points: 3 }],
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
    requiresConfirmation: false,
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
    requiresConfirmation: false,
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
    requiresConfirmation: false,
    tiers: [],
  },
];

export async function ensureAchievementCatalog(tx: SeedTx): Promise<SeedCounts> {
  const counts = emptyCounts();
  for (const entry of ACHIEVEMENT_CATALOG) {
    const definitionFields = {
      nameRu: entry.nameRu,
      nameEn: entry.nameEn,
      descriptionRu: entry.descriptionRu,
      descriptionEn: entry.descriptionEn,
      category: entry.category,
      kind: entry.kind,
      ruleType: entry.ruleType,
      metric: entry.metric,
    } as const;

    let achievement = await tx.achievement.findUnique({ where: { code: entry.code } });
    if (!achievement) {
      achievement = await tx.achievement.create({
        data: {
          code: entry.code,
          isActive: entry.isActive,
          threshold: entry.threshold,
          requiresConfirmation: entry.requiresConfirmation,
          ...definitionFields,
        },
      });
      counts.created += 1;
    } else {
      const same =
        achievement.nameRu === definitionFields.nameRu &&
        achievement.nameEn === definitionFields.nameEn &&
        achievement.descriptionRu === definitionFields.descriptionRu &&
        achievement.descriptionEn === definitionFields.descriptionEn &&
        achievement.category === definitionFields.category &&
        achievement.kind === definitionFields.kind &&
        achievement.ruleType === definitionFields.ruleType &&
        achievement.metric === definitionFields.metric;
      if (!same) {
        achievement = await tx.achievement.update({
          where: { id: achievement.id },
          data: definitionFields,
        });
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
      }
    }
  }
  return counts;
}
