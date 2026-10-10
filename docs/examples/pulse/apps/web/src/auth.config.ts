import type { NextAuthConfig } from "next-auth";

import type { UserRole } from "@pulse/domain";

import { DEFAULT_LOCALE, isAppLocale } from "@/lib/i18n/constants";

const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user?.role) {
        token.role = user.role as UserRole;
      }
      if (user?.id) {
        token.sub = user.id;
      }
      if (user?.locale && isAppLocale(user.locale)) {
        token.locale = user.locale;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role as UserRole;
        session.user.locale =
          typeof token.locale === "string" && isAppLocale(token.locale)
            ? token.locale
            : DEFAULT_LOCALE;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
