/** Display typography: ASCII double hyphen → em dash (ADR-020, typography guideline). */
export const normalizeVerseText = (text: string): string =>
  text.replace(/--/g, "—");
