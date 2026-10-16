import "server-only";
import { CONSENT_TYPE } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { readConsentTextVersionFromDb } from "./consent-text-version.server";

/** True when the user has no `privacy_consent` row for the current `consent_text_version` (РГ-5). */
export async function userNeedsPrivacyConsent(db: PrismaClient, userId: string): Promise<boolean> {
  const currentVersion = await readConsentTextVersionFromDb(db);
  const existing = await db.privacyConsent.findFirst({
    where: { userId, type: CONSENT_TYPE.PD_PROCESSING, textVersion: currentVersion },
    select: { id: true },
  });
  return existing === null;
}
