import "server-only";
import type { Prisma } from "@sunschool/db";

type Tx = Prisma.TransactionClient;

const CHILD_DATA_CONSENT_TEXT_VERSION_KEY = "child_data_consent_text_version";
const CHILD_DATA_CONSENT_TEXT_VERSION_DEFAULT = "v1";

/** Canonical child-data consent text version (`school_year` §4 — must exist in `app_setting`). */
export async function readChildConsentTextVersion(tx: Tx): Promise<string> {
  const row = await tx.appSetting.findUnique({
    where: { key: CHILD_DATA_CONSENT_TEXT_VERSION_KEY },
    select: { value: true },
  });
  if (row?.value && typeof row.value === "string") return row.value;
  return CHILD_DATA_CONSENT_TEXT_VERSION_DEFAULT;
}
