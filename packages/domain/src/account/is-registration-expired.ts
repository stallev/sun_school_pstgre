import { ACCOUNT_STATUS, type AccountStatus } from "../constants/account-status";

/**
 * A `REGISTRATION` account that never submitted the form is purged lazily after 30 days
 * (lifecycle_models §5.1, INV-25: there is no cron). The clock is an input.
 */
export const REGISTRATION_TTL_DAYS = 30;

export const isRegistrationExpired = (
  user: { status: AccountStatus; firstLoginAt: Date | null },
  now: Date,
): boolean => {
  if (user.status !== ACCOUNT_STATUS.REGISTRATION || user.firstLoginAt === null) return false;
  return now.getTime() - user.firstLoginAt.getTime() > REGISTRATION_TTL_DAYS * 24 * 60 * 60 * 1000;
};
