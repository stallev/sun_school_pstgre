import type { Dictionary } from "@/lib/messages/dictionary-types";
import { getMessage } from "@/lib/messages/get-message";

export const GLOSSARY_TERM_KEYS = [
  "regularly_attend",
  "attendance",
  "verses_per_lesson",
  "test",
  "notebook",
  "review_lesson",
  "bricks",
  "choir_singing",
  "bonus",
  "streak",
] as const;

export type GlossaryTermKey = (typeof GLOSSARY_TERM_KEYS)[number];

export type GlossaryTerm = {
  term: string;
  hint: string;
};

export type GlossaryMessages = Record<GlossaryTermKey, GlossaryTerm>;

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
    bricks: pickTerm("bricks"),
    choir_singing: pickTerm("choir_singing"),
    bonus: pickTerm("bonus"),
    streak: pickTerm("streak"),
  };
};
