import { LESSON_STATUS, type LessonStatus } from "@sunschool/domain";

export type LessonCheckProgress = {
  checkedCount: number;
  totalPupils: number;
  status: LessonStatus;
};

export const formatLessonCheckProgressLabel = (
  progress: LessonCheckProgress,
  messages: {
    checkNotStarted: string;
    checkPartial: (checked: number, total: number) => string;
    checkCompleted: string;
  },
): string => {
  if (progress.status === LESSON_STATUS.CHECK_COMPLETED) {
    return messages.checkCompleted;
  }
  if (progress.checkedCount === 0) {
    return messages.checkNotStarted;
  }
  if (progress.totalPupils > 0 && progress.checkedCount >= progress.totalPupils) {
    return messages.checkCompleted;
  }
  return messages.checkPartial(progress.checkedCount, progress.totalPupils);
};
