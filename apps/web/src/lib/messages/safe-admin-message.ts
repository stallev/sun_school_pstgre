import type { Dictionary } from "@/lib/messages/get-dictionary";
import { getMessage } from "@/lib/messages/get-message";

export const safeAdminMessage = (adminDict: Dictionary, path: string): string | null => {
  try {
    return getMessage(adminDict, path);
  } catch {
    return null;
  }
};
