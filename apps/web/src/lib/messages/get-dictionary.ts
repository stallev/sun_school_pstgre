import "server-only";

import * as Sentry from "@sentry/nextjs";

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
    parent: () => import("./ru/parent.json"),
  },
  en: {
    common: () => import("./en/common.json"),
    auth: () => import("./en/auth.json"),
    teacher: () => import("./en/teacher.json"),
    admin: () => import("./en/admin.json"),
    analytics: () => import("./en/analytics.json"),
    parent: () => import("./en/parent.json"),
  },
};

export async function getDictionary(
  locale: MessageLocale,
  namespace: MessageNamespace,
): Promise<Dictionary> {
  try {
    const dictionary = await loaders[locale][namespace]();
    return dictionary.default;
  } catch (error) {
    Sentry.captureException(error);
    if (locale === "ru") throw error;
    const fallback = await loaders.ru[namespace]();
    return fallback.default;
  }
}

export { getMessage } from "@/lib/messages/get-message";
