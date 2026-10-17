/** ADR-008 §4.1 — UI dictionary locales (`app_setting.ui_locale`). */
export const UI_MESSAGE_LOCALES = ["ru", "en"] as const;
export type UiMessageLocale = (typeof UI_MESSAGE_LOCALES)[number];

export const isValidUiMessageLocale = (value: string): value is UiMessageLocale =>
  (UI_MESSAGE_LOCALES as readonly string[]).includes(value);
