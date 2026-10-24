import type { Dictionary, MessageLocale } from "@/lib/messages/dictionary-types";
import { getMessage } from "@/lib/messages/get-message";

export type FormDateFieldCopy = {
  locale: MessageLocale;
  calendarAriaLabel: string;
};

export const getFormDateFieldCopy = (
  common: Dictionary,
  locale: MessageLocale,
): FormDateFieldCopy => ({
  locale,
  calendarAriaLabel: getMessage(common, "controls.open_date_calendar"),
});

