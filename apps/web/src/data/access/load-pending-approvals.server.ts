import "server-only";
import {
  ACCESS_REQUEST_STATUS,
  LOGIN_PROVIDER,
  type LoginProvider,
} from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { formatDisplayName } from "@/lib/person/format-display-name";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type PendingApprovalRow = {
  requestId: string;
  displayName: string;
  loginProviders: LoginProvider[];
  consentVersion: string;
  submittedAtIso: string;
  waitingDays: number;
};

export async function loadPendingApprovals(
  db: PrismaClient,
  now: Date,
): Promise<PendingApprovalRow[]> {
  const rows = await db.accessRequest.findMany({
    where: { status: ACCESS_REQUEST_STATUS.PENDING },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      createdAt: true,
      fullNameSnapshot: true,
      consent: { select: { textVersion: true } },
      user: {
        select: {
          lastName: true,
          firstName: true,
          middleName: true,
          identities: { select: { provider: true } },
        },
      },
    },
  });

  return rows.map((row) => {
    const displayName =
      row.fullNameSnapshot.trim().length > 0
        ? row.fullNameSnapshot
        : formatDisplayName(row.user);
    const providers = [
      ...new Set(
        row.user.identities.map((identity) => identity.provider).filter(isLoginProvider),
      ),
    ];
    const waitingDays = Math.max(0, Math.floor((now.getTime() - row.createdAt.getTime()) / MS_PER_DAY));

    return {
      requestId: row.id,
      displayName,
      loginProviders: providers,
      consentVersion: row.consent.textVersion,
      submittedAtIso: row.createdAt.toISOString(),
      waitingDays,
    };
  });
}

const isLoginProvider = (value: string): value is LoginProvider =>
  value === LOGIN_PROVIDER.CREDENTIALS || value === LOGIN_PROVIDER.TELEGRAM;
