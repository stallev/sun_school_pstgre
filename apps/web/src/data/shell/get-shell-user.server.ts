import "server-only";
import { cache } from "react";
import { formatDisplayName } from "@/lib/person/format-display-name";
import { getPrisma } from "@/lib/db.server";

export type ShellUserView = {
  displayName: string;
};

const loadShellUser = cache(async (userId: string): Promise<ShellUserView> => {
  const db = await getPrisma();
  const user = await db.appUser.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true, middleName: true },
  });
  const displayName = user ? formatDisplayName(user) : "";
  return { displayName };
});

export const getShellUser = (userId: string): Promise<ShellUserView> => loadShellUser(userId);
