import "server-only";

import type { Dictionary } from "@/lib/messages/get-dictionary";
import { getMessage } from "@/lib/messages/get-dictionary";
import { getPluralForms } from "@/lib/messages/plural";
import type { TeacherSuggestionMessages } from "@/lib/messages/teacher-suggestion-messages";

export const pickTeacherSuggestionMessages = (teacher: Dictionary): TeacherSuggestionMessages => ({
  title: getMessage(teacher, "achievements.suggestion.title"),
  deferredTemplate: getMessage(teacher, "achievements.suggestion.deferred"),
  confirmButton: getMessage(teacher, "achievements.suggestion.confirm_button"),
  dialogTitle: getMessage(teacher, "achievements.suggestion.dialog_title"),
  introForms: getPluralForms(teacher, "achievements.suggestion.intro"),
  versesTitle: getMessage(teacher, "achievements.suggestion.verses_title"),
  versesEmpty: getMessage(teacher, "achievements.suggestion.verses_empty"),
  textMissing: getMessage(teacher, "achievements.suggestion.text_missing"),
  confirm: getMessage(teacher, "achievements.suggestion.confirm"),
  confirming: getMessage(teacher, "achievements.suggestion.confirming"),
  defer: getMessage(teacher, "achievements.suggestion.defer"),
  deferring: getMessage(teacher, "achievements.suggestion.deferring"),
  dismiss: getMessage(teacher, "achievements.suggestion.dismiss"),
  dismissing: getMessage(teacher, "achievements.suggestion.dismissing"),
  dismissTitle: getMessage(teacher, "achievements.suggestion.dismiss_title"),
  dismissDescription: getMessage(teacher, "achievements.suggestion.dismiss_description"),
  dismissReasonLabel: getMessage(teacher, "achievements.suggestion.dismiss_reason_label"),
  dismissReasonPlaceholder: getMessage(teacher, "achievements.suggestion.dismiss_reason_placeholder"),
  toastConfirmed: getMessage(teacher, "achievements.suggestion.toast_confirmed"),
  toastDeferred: getMessage(teacher, "achievements.suggestion.toast_deferred"),
  toastDismissed: getMessage(teacher, "achievements.suggestion.toast_dismissed"),
  countLabel: getMessage(teacher, "achievements.suggestion.count_label"),
  cancel: getMessage(teacher, "achievements.cancel"),
  closeLabel: getMessage(teacher, "achievements.close_label"),
});
