export type SuggestionCheckVerses = {
  checkId: string;
  verses: readonly { reference: string; text: string | null }[];
};

export type SuggestionVerseItem = { reference: string; text: string | null };

/**
 * Pure list of golden-verse texts for a suggestion (contract §3 «Тексты серии»):
 * follows the evidence order, skips checks without data, dedupes by reference.
 */
export function buildSuggestionVerseList(
  evidenceCheckIds: readonly string[],
  checks: readonly SuggestionCheckVerses[],
): SuggestionVerseItem[] {
  const byCheck = new Map(checks.map((check) => [check.checkId, check.verses]));
  const seen = new Set<string>();
  const items: SuggestionVerseItem[] = [];
  for (const checkId of evidenceCheckIds) {
    for (const verse of byCheck.get(checkId) ?? []) {
      if (seen.has(verse.reference)) continue;
      seen.add(verse.reference);
      items.push({ reference: verse.reference, text: verse.text });
    }
  }
  return items;
}
