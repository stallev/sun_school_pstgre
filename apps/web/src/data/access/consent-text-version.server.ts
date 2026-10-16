import "server-only";
import type { Prisma } from "@sunschool/db";

const CONSENT_TEXT_VERSION_KEY = "consent_text_version";
const FALLBACK_VERSION = "v1";

type Tx = Prisma.TransactionClient;

/** Reads `app_setting.consent_text_version` inside the caller's transaction (access_requests §4). */
export async function readConsentTextVersion(tx: Tx): Promise<string> {
  const row = await tx.appSetting.findUnique({ where: { key: CONSENT_TEXT_VERSION_KEY } });
  return parseConsentVersionValue(row?.value);
}

export const parseConsentVersionValue = (value: unknown): string => {
  if (typeof value === "string" && value.length > 0) return value;
  if (typeof value === "number") return String(value);
  return FALLBACK_VERSION;
};

/** Current consent text version outside an open transaction (read-only loaders). */
export async function readConsentTextVersionFromDb(db: { appSetting: Tx["appSetting"] }): Promise<string> {
  const row = await db.appSetting.findUnique({ where: { key: CONSENT_TEXT_VERSION_KEY } });
  return parseConsentVersionValue(row?.value);
}
