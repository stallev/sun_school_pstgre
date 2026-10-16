"use server";

import { revalidatePath } from "next/cache";
import { LOGIN_PROVIDER, MUTATION_ERROR_CODES, type LoginProvider, type MutationResult } from "@sunschool/domain";
import { startLinkProvider } from "@/data/access/start-link-provider";
import { unlinkProvider } from "@/data/access/unlink-provider";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/db.server";

const unauthorized = (): MutationResult => ({
  ok: false,
  code: MUTATION_ERROR_CODES.UNAUTHORIZED,
  message: "common.errors.unauthorized",
});

async function requireSessionUserId(): Promise<string | null> {
  const session = await auth();
  const uid = session?.user?.id;
  return typeof uid === "string" && uid.length > 0 ? uid : null;
}

const parseProvider = (raw: unknown): LoginProvider | null => {
  if (raw === LOGIN_PROVIDER.TELEGRAM) return LOGIN_PROVIDER.TELEGRAM;
  if (raw === LOGIN_PROVIDER.CREDENTIALS) return LOGIN_PROVIDER.CREDENTIALS;
  return null;
};

export async function startLinkProviderAction(provider: string): Promise<MutationResult> {
  const userId = await requireSessionUserId();
  if (!userId) return unauthorized();
  const parsed = parseProvider(provider);
  if (!parsed) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.VALIDATION,
      message: "auth.profile.link_forbidden",
    };
  }
  return startLinkProvider(await getPrisma(), userId, parsed, new Date());
}

export async function unlinkProviderAction(provider: string): Promise<MutationResult> {
  const userId = await requireSessionUserId();
  if (!userId) return unauthorized();
  const parsed = parseProvider(provider);
  if (!parsed) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.VALIDATION,
      message: "auth.profile.unlink_forbidden",
    };
  }
  const result = await unlinkProvider(await getPrisma(), userId, parsed);
  if (result.ok) revalidatePath("/profile");
  return result;
}
