type FilledCheckInput = {
  presentChoice: boolean | null;
  verseScores: Record<string, number | null>;
  verseIds: readonly string[];
  hasTest: boolean;
  testScore: number | null;
  notebookScore: number | null;
  includeVersesAndTest: boolean;
};

/** Required fields on the pupil card: attendance, verses, test, notebook. Singing is always set. */
export const countFilledCheckFields = ({
  presentChoice,
  verseScores,
  verseIds,
  hasTest,
  testScore,
  notebookScore,
  includeVersesAndTest,
}: FilledCheckInput): { filled: number; total: number } => {
  let filled = presentChoice === null ? 0 : 1;
  let total = 1;
  if (includeVersesAndTest) {
    for (const verseId of verseIds) {
      total += 1;
      if ((verseScores[verseId] ?? null) !== null) filled += 1;
    }
    if (hasTest) {
      total += 1;
      if (testScore !== null) filled += 1;
    }
  }
  total += 1;
  if (notebookScore !== null) filled += 1;
  return { filled, total };
};

type ListStatusInput = {
  homeworkChecked: boolean;
  verseScores: Record<string, number | null>;
  testScore: number | null;
  notebookScore: number | null;
};

export const pupilCheckListStatus = (pupil: ListStatusInput): "checked" | "partial" | "unchecked" => {
  if (pupil.homeworkChecked) return "checked";
  const hasScore =
    Object.values(pupil.verseScores).some((score) => score !== null) ||
    pupil.testScore !== null ||
    pupil.notebookScore !== null;
  return hasScore ? "partial" : "unchecked";
};
