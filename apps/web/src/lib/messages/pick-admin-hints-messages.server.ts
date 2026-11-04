import "server-only";

import type { Dictionary } from "@/lib/messages/get-dictionary";
import { pickHintsMessages } from "@/lib/messages/pick-hints-messages";
import { ADMIN_HINT_KEYS, type AdminHintKey } from "@/lib/messages/admin-hints-types";

export type AdminHintsMessages = ReturnType<typeof pickAdminHintsMessages>;

export const pickAdminHintsMessages = (admin: Dictionary) =>
  pickHintsMessages(admin, ADMIN_HINT_KEYS);

export const pickAdminHintsSubset = <const K extends readonly AdminHintKey[]>(
  admin: Dictionary,
  keys: K,
) => pickHintsMessages(admin, keys);
