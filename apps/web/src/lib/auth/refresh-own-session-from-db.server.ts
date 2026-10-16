import "server-only";
import { unstable_update } from "@/auth";

/** Fires Auth.js `jwt` with `trigger: "update"`; claims are re-read from the DB in `auth.ts`. */
export async function refreshOwnSessionFromDb(): Promise<void> {
  await unstable_update({});
}
