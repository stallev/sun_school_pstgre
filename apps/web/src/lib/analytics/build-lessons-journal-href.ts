/** R-24: journal link with filter for missing check rows (analytics data quality). */
export const buildLessonsJournalHref = (gradeId: string): string => {
  const params = new URLSearchParams({ gradeId, journalGap: "1" });
  return `/lessons?${params.toString()}`;
};
