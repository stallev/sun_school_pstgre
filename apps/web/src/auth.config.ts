import { customFetch, type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { ACCOUNT_STATUS, type AccountStatus, type UserRole } from "@sunschool/domain";
import { fetchTelegramOidcWithSyntheticUserinfo } from "@/lib/auth/telegram-oidc-discovery-fetch";

/**
 * Edge-safe Auth.js config (auth_runtime_spec §3): providers, pages and the PURE jwt/session
 * callbacks, so that proxy.ts can read claims without importing the DB layer.
 * DB-touching callbacks (signIn, redirect) live in `auth.ts`.
 * Credentials and database adapters are not used (ADR-003).
 */
const TELEGRAM_OIDC_ISSUER = "https://oauth.telegram.org";

export default {
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 14, updateAge: 60 * 60 * 24 },
  providers: [
    Google({
      authorization: { params: { scope: "openid email profile" } },
    }),
    {
      id: "telegram",
      name: "Telegram",
      type: "oidc",
      issuer: TELEGRAM_OIDC_ISSUER,
      clientId: process.env.AUTH_TELEGRAM_ID,
      clientSecret: process.env.AUTH_TELEGRAM_SECRET,
      authorization: { params: { scope: "openid profile" } },
      // Profile comes from the ID token only; UserInfo is never called (TG workaround §6.2).
      idToken: true,
      [customFetch]: fetchTelegramOidcWithSyntheticUserinfo,
      checks: ["pkce", "state"],
      allowDangerousEmailAccountLinking: false,
      profile(profile) {
        return {
          id: String(profile.sub ?? profile.id),
          name: profile.name ?? undefined,
          image: profile.picture ?? undefined,
          email: null,
        };
      },
    },
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    // Claims are written by auth.ts#signIn on the first login (P01-CU4); here they are only carried.
    jwt({ token }) {
      return token;
    },
    // Only uid / status / roles reach the client (ADR-003 §4.3) — no name, email or provider fields.
    session({ session, token }) {
      session.user = {
        ...session.user,
        id: typeof token.uid === "string" ? token.uid : "",
        status: (token.status as AccountStatus | undefined) ?? ACCOUNT_STATUS.REGISTRATION,
        roles: (token.roles as UserRole[] | undefined) ?? [],
      };
      return session;
    },
  },
} satisfies NextAuthConfig;
