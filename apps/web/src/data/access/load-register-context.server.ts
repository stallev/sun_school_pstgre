import "server-only";
import { ACCESS_REQUEST_STATUS, ACCOUNT_STATUS } from "@sunschool/domain";
import { getPrisma } from "@/lib/db.server";
import { formatDisplayName } from "@/lib/person/format-display-name";
import { readConsentTextVersionFromDb } from "./consent-text-version.server";
import { userNeedsPrivacyConsent } from "./user-needs-privacy-consent.server";

export type RegisterFormMode = "registration" | "resubmit" | "consentOnly";

export type RegisterPageContext = {
  mode: RegisterFormMode;
  consentVersion: string;
  rejectReason: string | null;
  initialNames: {
    lastName: string;
    firstName: string;
    middleName: string;
  };
};

export async function loadRegisterPageContext(userId: string): Promise<RegisterPageContext | null> {
  const db = await getPrisma();
  const [user, consentVersion, needsConsent] = await Promise.all([
    db.appUser.findUnique({
      where: { id: userId },
      select: { status: true, lastName: true, firstName: true, middleName: true },
    }),
    readConsentTextVersionFromDb(db),
    userNeedsPrivacyConsent(db, userId),
  ]);
  if (!user) return null;

  const initialNames = {
    lastName: user.lastName ?? "",
    firstName: user.firstName ?? "",
    middleName: user.middleName ?? "",
  };

  if (user.status === ACCOUNT_STATUS.REGISTRATION) {
    return { mode: "registration", consentVersion, rejectReason: null, initialNames };
  }

  if (user.status === ACCOUNT_STATUS.REJECTED) {
    const rejected = await db.accessRequest.findFirst({
      where: { userId, status: ACCESS_REQUEST_STATUS.REJECTED },
      orderBy: { createdAt: "desc" },
      select: { rejectReason: true },
    });
    return {
      mode: "resubmit",
      consentVersion,
      rejectReason: rejected?.rejectReason ?? null,
      initialNames,
    };
  }

  if (user.status === ACCOUNT_STATUS.ACTIVE && needsConsent) {
    return {
      mode: "consentOnly",
      consentVersion,
      rejectReason: null,
      initialNames,
    };
  }

  return null;
}

export async function loadRegisterDisplayName(userId: string): Promise<string> {
  const db = await getPrisma();
  const user = await db.appUser.findUnique({
    where: { id: userId },
    select: { lastName: true, firstName: true, middleName: true },
  });
  if (!user) return "";
  return formatDisplayName(user);
}
