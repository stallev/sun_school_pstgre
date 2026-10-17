/** Client-safe dictionary shapes and locale constants (no server-only loaders). */

export const MESSAGE_LOCALES = ["ru", "en"] as const;
export type MessageLocale = (typeof MESSAGE_LOCALES)[number];

export const MESSAGE_NAMESPACES = ["common", "auth", "teacher", "admin", "analytics"] as const;
export type MessageNamespace = (typeof MESSAGE_NAMESPACES)[number];

export type Dictionary = { [key: string]: string | Dictionary };
