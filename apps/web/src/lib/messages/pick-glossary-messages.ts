import type { Dictionary } from "@/lib/messages/dictionary-types";
import { getMessage } from "@/lib/messages/get-message";

export const GLOSSARY_TERM_KEYS = [
  "regularly_attend",
  "attendance",
  "verses_per_lesson",
  "test",
  "notebook",
  "review_lesson",
  "regular_lesson",
  "planned_lesson",
  "bricks_to_issue",
  "bricks",
  "choir_singing",
  "bonus",
  "streak",
  "lesson_points",
] as const;

export type GlossaryTermKey = (typeof GLOSSARY_TERM_KEYS)[number];

export type GlossaryTerm = {
  term: string;
  hint: string;
};

export type GlossaryMessages = Record<GlossaryTermKey, GlossaryTerm>;

export type GlossaryUiMessages = GlossaryMessages & {
  termHintAriaLabel: string;
};

export const pickGlossaryMessages = (common: Dictionary): GlossaryMessages => {
  const pickTerm = (key: GlossaryTermKey): GlossaryTerm => ({
    term: getMessage(common, `glossary.${key}.term`),
    hint: getMessage(common, `glossary.${key}.hint`),
  });

  return {
    regularly_attend: pickTerm("regularly_attend"),
    attendance: pickTerm("attendance"),
    verses_per_lesson: pickTerm("verses_per_lesson"),
    test: pickTerm("test"),
    notebook: pickTerm("notebook"),
    review_lesson: pickTerm("review_lesson"),
    regular_lesson: pickTerm("regular_lesson"),
    planned_lesson: pickTerm("planned_lesson"),
    bricks_to_issue: pickTerm("bricks_to_issue"),
    bricks: pickTerm("bricks"),
    choir_singing: pickTerm("choir_singing"),
    bonus: pickTerm("bonus"),
    streak: pickTerm("streak"),
    lesson_points: pickTerm("lesson_points"),
  };
};

export const pickGlossaryUiMessages = (common: Dictionary): GlossaryUiMessages => ({
  ...pickGlossaryMessages(common),
  termHintAriaLabel: getMessage(common, "term_hint.aria_label"),
});
