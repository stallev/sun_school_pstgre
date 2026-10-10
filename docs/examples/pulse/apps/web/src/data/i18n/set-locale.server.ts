import "server-only";

import { getPrisma } from "@pulse/db";
import { z } from "zod";

import { isAppLocale, type AppLocale } from "@/lib/i18n/constants";
import { writeLocaleCookie } from "@/lib/i18n/cookie";

const setLocaleSchema = z.object({
  locale: z.string().refine(isAppLocale, "Invalid locale"),
});

export async function setUserLocale(
  userId: string,
  locale: AppLocale,
): Promise<void> {
  await getPrisma().user.update({
    where: { id: userId },
    data: { locale },
  });
}

export async function persistLocale(
  locale: AppLocale,
  userId?: string | null,
): Promise<void> {
  await writeLocaleCookie(locale);

  if (userId) {
    await setUserLocale(userId, locale);
  }
}

export function parseLocaleInput(input: unknown): AppLocale | null {
  const parsed = setLocaleSchema.safeParse(input);
  return parsed.success ? parsed.data.locale : null;
}
