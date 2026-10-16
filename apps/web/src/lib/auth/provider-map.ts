import { LOGIN_PROVIDER, type LoginProvider } from "@sunschool/domain";

/**
 * Auth.js provider id → `LOGIN_PROVIDER` (domain-literals-and-codes: the one place where framework
 * ids meet domain values). Unknown providers map to `null` and are refused by `signIn`.
 */
export const AUTHJS_PROVIDER_ID = { CREDENTIALS: "credentials", TELEGRAM: "telegram" } as const;

export const toLoginProvider = (authJsProviderId: string | undefined): LoginProvider | null => {
  switch (authJsProviderId) {
    case AUTHJS_PROVIDER_ID.CREDENTIALS:
      return LOGIN_PROVIDER.CREDENTIALS;
    case AUTHJS_PROVIDER_ID.TELEGRAM:
      return LOGIN_PROVIDER.TELEGRAM;
    default:
      return null;
  }
};
