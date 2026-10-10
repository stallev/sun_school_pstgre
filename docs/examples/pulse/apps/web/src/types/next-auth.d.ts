import type { UserRole } from "@pulse/domain";

import type { AppLocale } from "@/lib/i18n/constants";

declare module "next-auth" {
  interface User {
    role: UserRole;
    locale?: AppLocale;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      locale: AppLocale;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    locale?: AppLocale;
  }
}

export {};
