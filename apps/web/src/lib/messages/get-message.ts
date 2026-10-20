import type { Dictionary } from "@/lib/messages/dictionary-types";

/** Reads a string by dotted path (`errors.forbidden`); a missing key is a bug, not an empty string. */
export function getMessage(dictionary: Dictionary, path: string): string {
  let node: string | Dictionary | undefined = dictionary;
  for (const key of path.split(".")) {
    node = typeof node === "object" ? node[key] : undefined;
  }
  if (typeof node !== "string") throw new Error(`Missing message: ${path}`);
  return node;
}
