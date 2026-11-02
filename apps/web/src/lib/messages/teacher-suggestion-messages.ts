import type { PluralForms } from "@/lib/messages/plural";

/** Client slice of `teacher.achievements.suggestion.*` (suggestions contract section 6.5). */
export type TeacherSuggestionMessages = {
  title: string;
  deferredTemplate: string;
  confirmButton: string;
  dialogTitle: string;
  introForms: PluralForms;
  versesTitle: string;
  versesEmpty: string;
  textMissing: string;
  confirm: string;
  confirming: string;
  defer: string;
  deferring: string;
  dismiss: string;
  dismissing: string;
  dismissTitle: string;
  dismissDescription: string;
  dismissReasonLabel: string;
  dismissReasonPlaceholder: string;
  toastConfirmed: string;
  toastDeferred: string;
  toastDismissed: string;
  countLabel: string;
  cancel: string;
  closeLabel: string;
};
