import { ACCOUNT_STATUS, type AccountStatus } from "@sunschool/domain";

export type AccountStatusTone = "neutral" | "ok" | "warn" | "danger" | "info";

/** Visual tone aligned with prototype `ST_META` (vFamily §5.1). */
export const getAccountStatusStMetaTone = (status: AccountStatus): AccountStatusTone => {
  switch (status) {
    case ACCOUNT_STATUS.ACTIVE:
      return "ok";
    case ACCOUNT_STATUS.REQUEST_PENDING:
      return "warn";
    case ACCOUNT_STATUS.REJECTED:
      return "danger";
    case ACCOUNT_STATUS.REGISTRATION:
    case ACCOUNT_STATUS.DISABLED:
    case ACCOUNT_STATUS.DELETED:
    default:
      return "neutral";
  }
};
