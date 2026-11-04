import "server-only";
import { formatDisplayName } from "@/lib/person/format-display-name";
import { loadAppUserPolicyRow } from "@/lib/auth/require-user";

export type ShellUserView = {
  displayName: string;
};

export const getShellUser = async (userId: string): Promise<ShellUserView> => {
  const user = await loadAppUserPolicyRow(userId);
  const displayName = user ? formatDisplayName(user) : "";
  return { displayName };
};
