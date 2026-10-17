import "server-only";
import { notFound, redirect } from "next/navigation";
import {
  ACCOUNT_STATUS,
  CONSENT_TYPE,
  LOGIN_PROVIDER,
  USER_ROLE,
  type AccountStatus,
  type LoginProvider,
  type UserRole,
} from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { homeRouteFor } from "@sunschool/policy-edge";
import { readConsentTextVersionFromDb } from "./consent-text-version.server";

export type OwnProfileIdentity = {
  provider: LoginProvider;
  connected: boolean;
  email: string | null;
  canUnlink: boolean;
};

export type OwnProfileView = {
  userId: string;
  lastName: string;
  firstName: string;
  middleName: string;
  status: AccountStatus;
  roles: UserRole[];
  identities: OwnProfileIdentity[];
  hasTelegram: boolean;
  consentVersion: string | null;
  consentAcceptedAt: string | null;
};

const PROFILE_STATUSES: ReadonlySet<string> = new Set([
  ACCOUNT_STATUS.ACTIVE,
  ACCOUNT_STATUS.REQUEST_PENDING,
  ACCOUNT_STATUS.REJECTED,
]);

export async function loadOwnProfile(db: PrismaClient, userId: string): Promise<OwnProfileView> {
  const user = await db.appUser.findUnique({
    where: { id: userId },
    select: {
      id: true,
      status: true,
      lastName: true,
      firstName: true,
      middleName: true,
      roles: { select: { role: true } },
      identities: {
        select: { id: true, provider: true, email: true },
      },
      consents: {
        where: { type: CONSENT_TYPE.PD_PROCESSING },
        orderBy: { acceptedAt: "desc" },
        take: 1,
        select: { textVersion: true, acceptedAt: true },
      },
    },
  });

  if (!user || user.status === ACCOUNT_STATUS.DELETED) {
    notFound();
  }
  if (!PROFILE_STATUSES.has(user.status)) {
    redirect(homeRouteFor(user.status, user.roles.map((r) => r.role)));
  }

  const roles = user.roles
    .map((row) => row.role)
    .filter((role): role is UserRole => role === USER_ROLE.ADMIN || role === USER_ROLE.TEACHER);

  const identityCount = user.identities.length;
  const telegramRow = user.identities.find((row) => row.provider === LOGIN_PROVIDER.TELEGRAM);
  const credentialsRow = user.identities.find((row) => row.provider === LOGIN_PROVIDER.CREDENTIALS);

  const buildIdentity = (
    provider: LoginProvider,
    row: { email: string | null } | undefined,
  ): OwnProfileIdentity => ({
    provider,
    connected: Boolean(row),
    email: row?.email ?? null,
    canUnlink: Boolean(row) && identityCount > 1 && provider === LOGIN_PROVIDER.TELEGRAM,
  });

  const identities: OwnProfileIdentity[] = [
    buildIdentity(LOGIN_PROVIDER.TELEGRAM, telegramRow),
    ...(credentialsRow || roles.includes(USER_ROLE.ADMIN)
      ? [buildIdentity(LOGIN_PROVIDER.CREDENTIALS, credentialsRow)]
      : []),
  ];

  const consent = user.consents[0];
  const currentVersion = await readConsentTextVersionFromDb(db);

  return {
    userId: user.id,
    lastName: user.lastName ?? "",
    firstName: user.firstName ?? "",
    middleName: user.middleName ?? "",
    status: user.status,
    roles,
    identities,
    hasTelegram: Boolean(telegramRow),
    consentVersion: consent?.textVersion ?? currentVersion,
    consentAcceptedAt: consent?.acceptedAt?.toISOString() ?? null,
  };
}
