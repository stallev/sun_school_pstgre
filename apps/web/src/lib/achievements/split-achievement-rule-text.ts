export const splitAchievementRuleText = (
  description: string | null,
): { summary: string | null; details: string | null } => {
  const trimmed = description?.trim();
  if (!trimmed) return { summary: null, details: null };

  const sentenceBreak = trimmed.search(/(?<=[.!?…])\s+/u);
  if (sentenceBreak === -1) {
    return { summary: trimmed, details: null };
  }

  const summary = trimmed.slice(0, sentenceBreak + 1).trim();
  const details = trimmed.slice(sentenceBreak + 1).trim();
  if (!details) return { summary: trimmed, details: null };
  return { summary, details: trimmed };
};
