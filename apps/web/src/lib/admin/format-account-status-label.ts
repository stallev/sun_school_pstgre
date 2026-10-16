import { ACCOUNT_STATUS, type AccountStatus } from "@sunschool/domain";
import type { AdminMessages } from "@/lib/messages/admin-messages";

export const formatAccountStatusLabel = (status: AccountStatus, messages: AdminMessages): string => {
  switch (status) {
    case ACCOUNT_STATUS.ACTIVE:
      return messages.users.statusActive;
    case ACCOUNT_STATUS.REQUEST_PENDING:
      return messages.users.statusRequestPending;
    case ACCOUNT_STATUS.DISABLED:
      return messages.users.statusDisabled;
    case ACCOUNT_STATUS.REJECTED:
      return messages.users.statusRejected;
    case ACCOUNT_STATUS.REGISTRATION:
      return messages.users.statusRegistration;
    default:
      return status;
  }
};
