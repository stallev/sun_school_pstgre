import { ACADEMIC_YEAR_STATUS, type AcademicYearStatus } from "@sunschool/domain";
import type { AdminMessages } from "@/lib/messages/admin-messages";

export const formatAcademicYearStatusLabel = (
  status: AcademicYearStatus,
  messages: AdminMessages,
): string => {
  if (status === ACADEMIC_YEAR_STATUS.ACTIVE) return messages.year.statusActive;
  if (status === ACADEMIC_YEAR_STATUS.DRAFT) return messages.year.statusDraft;
  if (status === ACADEMIC_YEAR_STATUS.CLOSED) return messages.year.statusClosed;
  return status;
};
