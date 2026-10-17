import type { Dictionary } from "@/lib/messages/dictionary-types";

/** Resolves `auth.login.denied` or `common.errors.not_found` without importing server-only loaders. */
export const resolveMessageKey = (dictionaries: Record<string, Dictionary>, messageKey: string): string => {
  const segments = messageKey.split(".");
  const namespace = segments[0];
  const rest = segments.slice(1);
  if (!namespace) return messageKey;
  const dictionary = dictionaries[namespace];
  if (!dictionary || rest.length === 0) return messageKey;
  let node: string | Dictionary | undefined = dictionary;
  for (const key of rest) {
    node = typeof node === "object" ? node[key] : undefined;
  }
  return typeof node === "string" ? node : messageKey;
};
