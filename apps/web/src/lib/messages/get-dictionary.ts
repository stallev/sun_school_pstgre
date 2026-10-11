import "server-only";

/**
 * Dictionary loader — canon: ADR-008 §4.3. One language per application (no locale in the URL),
 * dictionaries are split into namespaces by route group: the client gets only the subset of keys
 * it needs (rule ui-messages-bundle-splitting). Teacher never receives the admin namespace.
 */
export const MESSAGE_LOCALES = ["ru", "en"] as const;
export type MessageLocale = (typeof MESSAGE_LOCALES)[number];

export const MESSAGE_NAMESPACES = ["common", "auth", "teacher", "admin", "analytics"] as const;
export type MessageNamespace = (typeof MESSAGE_NAMESPACES)[number];

export type Dictionary = { [key: string]: string | Dictionary };

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
