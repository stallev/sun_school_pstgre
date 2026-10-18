import type { Dictionary, MessageLocale } from "@/lib/messages/dictionary-types";

export type PluralCategory = "one" | "few" | "many" | "other";

export type PluralForms = Partial<Record<PluralCategory, string>> & { other: string };

const PLURAL_CATEGORIES: readonly PluralCategory[] = ["one", "few", "many", "other"];

const isPluralCategory = (value: string): value is PluralCategory =>
  (PLURAL_CATEGORIES as readonly string[]).includes(value);

/** Plural category for UI copy (ADR-008 §4.4). */
export const getPluralCategory = (count: number, locale: MessageLocale): PluralCategory => {
  const category = new Intl.PluralRules(locale).select(count);
  return isPluralCategory(category) ? category : "other";
};

export const selectPluralForm = (
  forms: PluralForms,
  count: number,
  locale: MessageLocale,
): string => {
  const category = getPluralCategory(count, locale);
  return forms[category] ?? forms.other;
};

const fillTemplate = (template: string, values: Record<string, string | number>): string =>
  Object.entries(values).reduce(
    (text, [key, value]) => text.replace(new RegExp(`\\{${key}\\}`, "g"), String(value)),
    template,
  );

export const formatPlural = (
  forms: PluralForms,
  count: number,
  locale: MessageLocale,
  placeholders: Record<string, string | number> = {},
): string => fillTemplate(selectPluralForm(forms, count, locale), { count, ...placeholders });

/** Reads nested plural keys (`*.one` / `.few` / `.many` / `.other`) from a dictionary slice. */
export const getPluralForms = (dictionary: Dictionary, path: string): PluralForms => {
  let node: string | Dictionary | undefined = dictionary;
  for (const key of path.split(".")) {
    node = typeof node === "object" && node !== null ? node[key] : undefined;
  }
  if (typeof node !== "object" || node === null) {
    throw new Error(`Missing plural forms: ${path}`);
  }
  const forms = node as Record<string, string>;
  if (typeof forms.other !== "string") {
    throw new Error(`Missing plural.other: ${path}`);
  }
  return forms as PluralForms;
};
