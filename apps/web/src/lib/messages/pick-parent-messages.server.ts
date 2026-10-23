import "server-only";

import type { Dictionary } from "@/lib/messages/get-dictionary";
import { pickParentMessages, type ParentMessages } from "@/lib/messages/parent-messages";

export type { ParentMessages };

export const pickParentMessagesFromDictionary = (parentDict: Dictionary): ParentMessages =>
  pickParentMessages(parentDict);
