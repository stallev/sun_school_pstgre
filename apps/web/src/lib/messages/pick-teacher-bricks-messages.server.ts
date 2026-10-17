import "server-only";

import type { Dictionary } from "@/lib/messages/get-dictionary";
import { getMessage } from "@/lib/messages/get-dictionary";
import type { TeacherBricksMessages } from "@/lib/messages/teacher-bricks-messages";

const fill = (template: string, values: Record<string, string | number>): string =>
  Object.entries(values).reduce(
    (text, [key, value]) => text.replace(`{${key}}`, String(value)),
    template,
  );

export const pickTeacherBricksMessages = (teacher: Dictionary): TeacherBricksMessages => ({
  pageTitle: getMessage(teacher, "bricks.page_title"),
  pageSubtitle: (group, year) => fill(getMessage(teacher, "bricks.page_subtitle"), { group, year }),
  gradeFilterLabel: getMessage(teacher, "bricks.grade_filter"),
  gradeFilterApply: getMessage(teacher, "bricks.grade_apply"),
  columnPupil: getMessage(teacher, "bricks.column_pupil"),
  columnEarned: getMessage(teacher, "bricks.column_earned"),
  columnIssued: getMessage(teacher, "bricks.column_issued"),
  columnBalance: getMessage(teacher, "bricks.column_balance"),
  columnActions: getMessage(teacher, "bricks.column_actions"),
  needsAttention: getMessage(teacher, "bricks.needs_attention"),
  actionIssue: getMessage(teacher, "bricks.action_issue"),
  actionCompensate: getMessage(teacher, "bricks.action_compensate"),
  emptyPupilsTitle: getMessage(teacher, "bricks.empty_pupils_title"),
  emptyPupilsDescription: getMessage(teacher, "bricks.empty_pupils_description"),
  emptyEarnedTitle: getMessage(teacher, "bricks.empty_earned_title"),
  emptyEarnedDescription: getMessage(teacher, "bricks.empty_earned_description"),
  ledgerTitle: (name) => fill(getMessage(teacher, "bricks.ledger_title"), { name }),
  ledgerEmpty: getMessage(teacher, "bricks.ledger_empty"),
  ledgerSelectPupil: getMessage(teacher, "bricks.ledger_select_pupil"),
  ledgerColumnDate: getMessage(teacher, "bricks.ledger_column_date"),
  ledgerColumnQty: getMessage(teacher, "bricks.ledger_column_qty"),
  ledgerColumnBy: getMessage(teacher, "bricks.ledger_column_by"),
  ledgerColumnNote: getMessage(teacher, "bricks.ledger_column_note"),
  ledgerCompensation: getMessage(teacher, "bricks.ledger_compensation"),
  issueDialogTitle: (name) => fill(getMessage(teacher, "bricks.issue_dialog_title"), { name }),
  compensateDialogTitle: (name) => fill(getMessage(teacher, "bricks.compensate_dialog_title"), { name }),
  quantityLabel: getMessage(teacher, "bricks.quantity_label"),
  dateLabel: getMessage(teacher, "bricks.date_label"),
  noteLabel: getMessage(teacher, "bricks.note_label"),
  noteOptional: getMessage(teacher, "bricks.note_optional"),
  submitIssue: getMessage(teacher, "bricks.submit_issue"),
  submitCompensate: getMessage(teacher, "bricks.submit_compensate"),
  cancel: getMessage(teacher, "bricks.cancel"),
  saving: getMessage(teacher, "bricks.saving"),
  toastIssued: getMessage(teacher, "bricks.toast_issued"),
  toastCompensated: getMessage(teacher, "bricks.toast_compensated"),
  balanceHint: (balance) => fill(getMessage(teacher, "bricks.balance_hint"), { balance }),
  closeLabel: getMessage(teacher, "bricks.close"),
});
