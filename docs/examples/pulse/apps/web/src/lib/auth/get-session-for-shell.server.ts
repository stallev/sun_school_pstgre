import "server-only";

import { cache } from "react";
import { connection } from "next/server";

import { auth } from "@/auth";

/** One session read per request for TopBar, discovery nav gates, and role shells. */
export const getSessionForShell = cache(async () => {
  await connection();
  return auth();
});
