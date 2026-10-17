import "server-only";

import type { Dictionary, MessageLocale, MessageNamespace } from "@/lib/messages/dictionary-types";

export type { Dictionary, MessageLocale, MessageNamespace } from "@/lib/messages/dictionary-types";
export { MESSAGE_LOCALES, MESSAGE_NAMESPACES } from "@/lib/messages/dictionary-types";

/**
 * Dictionary loader — canon: ADR-008 §4.3. One language per application (no locale in the URL),
 * dictionaries are split into namespaces by route group: the client gets only the subset of keys
 * it needs (rule ui-messages-bundle-splitting). Teacher never receives the admin namespace.
 */

const loaders: Record<MessageLocale, Record<MessageNamespace, () => Promise<{ default: Dictionary }>>> = {
  ru: {
    common: () => import("./ru/common.json"),
    auth: () => import("./ru/auth.json"),
    teacher: () => import("./ru/teacher.json"),
    admin: () => import("./ru/admin.json"),
    analytics: () => import("./ru/analytics.json"),
  },
  en: {
    common: () => import("./en/common.json"),
    auth: () => import("./en/auth.json"),
    teacher: () => import("./en/teacher.json"),
    admin: () => import("./en/admin.json"),
    analytics: () => import("./en/analytics.json"),
  },
};

export async function getDictionary(
  locale: MessageLocale,
  namespace: MessageNamespace,
): Promise<Dictionary> {
  const dictionary = await loaders[locale][namespace]();
  return dictionary.default;
}

/** Reads a string by dotted path (`errors.forbidden`); a missing key is a bug, not an empty string. */
export function getMessage(dictionary: Dictionary, path: string): string {
  let node: string | Dictionary | undefined = dictionary;
  for (const key of path.split(".")) {
    node = typeof node === "object" ? node[key] : undefined;
  }
  if (typeof node !== "string") throw new Error(`Missing message: ${path}`);
  return node;
}
