import type { Dictionary } from "@/lib/messages/dictionary-types";
import { getMessage } from "@/lib/messages/get-message";

export type HintTerm = {
  term: string;
  hint: string;
};

export const pickHintsMessages = <const K extends readonly string[]>(
  slice: Dictionary,
  keys: K,
): { [P in K[number]]: HintTerm } => {
  const picked = {} as { [P in K[number]]: HintTerm };
  for (const key of keys) {
    picked[key as K[number]] = {
      term: getMessage(slice, `hints.${key}.term`),
      hint: getMessage(slice, `hints.${key}.hint`),
    };
  }
  return picked;
};
