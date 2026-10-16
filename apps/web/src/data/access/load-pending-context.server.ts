import "server-only";
import { ACCESS_REQUEST_STATUS, ACCOUNT_STATUS } from "@sunschool/domain";
import { getPrisma } from "@/lib/db.server";
import { formatDisplayName } from "@/lib/person/format-display-name";

export type PendingPageContext = {
  status: typeof ACCOUNT_STATUS.REQUEST_PENDING | typeof ACCOUNT_STATUS.REJECTED;
  displayName: string;
  submittedAt: string | null;
  consentVersion: string | null;
  rejectReason: string | null;
};

export async function loadPendingPageContext(userId: string): Promise<PendingPageContext | null> {
  const db = await getPrisma();
  const user = await db.appUser.findUnique({
    where: { id: userId },
    select: { status: true, lastName: true, firstName: true, middleName: true },
  });
  if (
    !user ||
    (user.status !== ACCOUNT_STATUS.REQUEST_PENDING && user.status !== ACCOUNT_STATUS.REJECTED)
  ) {
    return null;
  }

  const request = await db.accessRequest.findFirst({
    where: {
      userId,
      status:
        user.status === ACCOUNT_STATUS.REJECTED
          ? ACCESS_REQUEST_STATUS.REJECTED
          : ACCESS_REQUEST_STATUS.PENDING,
    },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true, consent: { select: { textVersion: true } }, rejectReason: true },
  });

  return {
    status: user.status,
    displayName: formatDisplayName(user),
    submittedAt: request?.createdAt?.toISOString() ?? null,
    consentVersion: request?.consent?.textVersion ?? null,
    rejectReason: user.status === ACCOUNT_STATUS.REJECTED ? request?.rejectReason ?? null : null,
  };
}
