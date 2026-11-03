export type LessonScoreEntry = {
  pupilId: string;
  homeworkChecked: boolean;
  total: number | string | null;
};

/**
 * Lesson leaders (check flow spec §5.2в, UX-03 D-16): checked pupils with the highest total above
 * zero; every pupil tied at the maximum is included. No checked pupil above zero → empty set.
 */
export const findLessonTopScorerIds = (entries: readonly LessonScoreEntry[]): ReadonlySet<string> => {
  let max = 0;
  let leaders: string[] = [];
  for (const entry of entries) {
    if (!entry.homeworkChecked || typeof entry.total !== "number" || entry.total <= 0) continue;
    if (entry.total > max) {
      max = entry.total;
      leaders = [];
    }
    if (entry.total === max) leaders.push(entry.pupilId);
  }
  return new Set(leaders);
};
