import { ACCOUNT_STATUS, type AccountStatus } from "../constants/account-status";

/**
 * Account status transitions — lifecycle_models.md §5.1. Use-cases check this BEFORE writing and
 * fail with ACCESS_STATUS_INVALID; the DB does not enforce the machine.
 * `→ DELETED` from the live statuses belongs to the deletion procedure (P06).
 */
const TRANSITIONS: Readonly<Record<AccountStatus, readonly AccountStatus[]>> = {
  [ACCOUNT_STATUS.REGISTRATION]: [ACCOUNT_STATUS.REQUEST_PENDING, ACCOUNT_STATUS.DELETED],
  [ACCOUNT_STATUS.REQUEST_PENDING]: [
    ACCOUNT_STATUS.ACTIVE,
    ACCOUNT_STATUS.REJECTED,
    ACCOUNT_STATUS.DELETED,
  ],
  [ACCOUNT_STATUS.REJECTED]: [ACCOUNT_STATUS.REQUEST_PENDING, ACCOUNT_STATUS.DELETED],
  [ACCOUNT_STATUS.ACTIVE]: [ACCOUNT_STATUS.DISABLED, ACCOUNT_STATUS.DELETED],
  [ACCOUNT_STATUS.DISABLED]: [ACCOUNT_STATUS.ACTIVE, ACCOUNT_STATUS.DELETED],
  [ACCOUNT_STATUS.DELETED]: [],
};

export const canTransitionAccount = (from: AccountStatus, to: AccountStatus): boolean =>
  TRANSITIONS[from].includes(to);
