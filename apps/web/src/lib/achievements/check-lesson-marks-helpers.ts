import { ACTIVE_WORK_ACHIEVEMENT_CODE } from "@/lib/achievements/catalog-display";

export const isCheckLessonActiveWorkCode = (code: string): boolean =>
  code === ACTIVE_WORK_ACHIEVEMENT_CODE;
