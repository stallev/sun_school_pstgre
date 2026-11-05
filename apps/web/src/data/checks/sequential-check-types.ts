import {
  LESSON_STATUS,
  type LessonKind,
  type LessonStatus,
  type LessonVerseToRecite,
  type ScoringSnapshot,
} from "@sunschool/domain";
import type { CheckLessonMarksData } from "@/lib/achievements/check-lesson-marks-types";

export type SequentialCheckPupil = {
  pupilId: string;
  displayName: string;
  birthYear: number | null;
  addedLater: boolean;
  checkId: string | null;
  present: boolean | null;
  homeworkChecked: boolean;
  testScore: number | null;
  notebookScore: number | null;
  singing: boolean;
  comment: string;
  late: boolean;
  pointsTotal: number | null;
  updatedAt: string | null;
  verseScores: Record<string, number | null>;
};

export type SequentialCheckPageData =
  | { kind: "not_found" }
  | {
      kind: "page";
      lessonId: string;
      lessonOrdinal: number;
      lessonTitle: string;
      lessonDateIso: string;
      lessonStatus: LessonStatus;
      lessonKind: LessonKind;
      hasTest: boolean;
      canMutate: boolean;
      yearClosed: boolean;
      isAdmin: boolean;
      versesToRecite: readonly LessonVerseToRecite[];
      scoring: ScoringSnapshot;
      pupils: SequentialCheckPupil[];
      lessonMarks: CheckLessonMarksData;
    };

export const isCorrectionMode = (
  lessonStatus: LessonStatus,
  homeworkChecked: boolean,
): boolean => lessonStatus === LESSON_STATUS.CHECK_COMPLETED || homeworkChecked;
