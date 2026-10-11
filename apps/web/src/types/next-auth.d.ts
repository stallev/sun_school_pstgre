import type { AccountStatus, UserRole } from "@sunschool/domain";
import "next-auth";
import "next-auth/jwt";

/**
 * Auth.js module augmentation — lives in apps/web only (typescript-monorepo-types).
 * The session carries uid / status / roles and nothing personal (ADR-003 §4.3).
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      status: AccountStatus;
      roles: UserRole[];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    status?: AccountStatus;
    roles?: UserRole[];
  }
}
