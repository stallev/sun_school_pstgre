import { customFetch, type NextAuthConfig } from "next-auth";
import { ACCOUNT_STATUS, type AccountStatus, type UserRole } from "@sunschool/domain";
import { fetchTelegramOidcWithSyntheticUserinfo } from "@/lib/auth/telegram-oidc-discovery-fetch";
import { mapTelegramProfile } from "@/lib/auth/telegram-profile";

/**
 * Edge-safe Auth.js config (auth_runtime_spec §3): providers, pages and the PURE jwt/session
 * callbacks, so that proxy.ts can read claims without importing the DB layer.
 * DB-touching pieces live in `auth.ts`: the Credentials provider (administrator email + password,
 * ADR-003 v1.1) and the signIn / redirect callbacks. Google and database adapters are not used.
 */
export const TELEGRAM_OIDC_ISSUER = "https://oauth.telegram.org";
/** Telegram id only (`sub` → `provider_account_id`); profile and phone scopes are not requested (ADR-003 v1.2). */
export const TELEGRAM_OIDC_SCOPE = "openid";

export default {
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 14, updateAge: 60 * 60 * 24 },
  providers: [
    {
      id: "telegram",
      name: "Telegram",
      type: "oidc",
      issuer: TELEGRAM_OIDC_ISSUER,
      clientId: process.env.AUTH_TELEGRAM_ID,
      clientSecret: process.env.AUTH_TELEGRAM_SECRET,
      authorization: { params: { scope: TELEGRAM_OIDC_SCOPE } },
      // Profile comes from the ID token only; UserInfo is never called (TG workaround §6.2).
      idToken: true,
      [customFetch]: fetchTelegramOidcWithSyntheticUserinfo,
      checks: ["pkce", "state"],
      allowDangerousEmailAccountLinking: false,
      profile: (claims) => mapTelegramProfile(claims),
    },
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    // Only uid / status / roles are kept in the token (ADR-003 §4.3): Auth.js seeds a new token with
    // the provider's name, email, picture and sub — they are dropped here. The claims themselves are
    // written by auth.ts#signIn / jwt on the first login (P01-CU4); here they are only carried.
    jwt({ token }) {
      return { uid: token.uid, status: token.status, roles: token.roles };
    },
    // Built from scratch (no spread of session.user): no name, email, image or phone reaches the client.
    session({ session, token }) {
      session.user = {
        id: typeof token.uid === "string" ? token.uid : "",
        status: (token.status as AccountStatus | undefined) ?? ACCOUNT_STATUS.REGISTRATION,
        roles: (token.roles as UserRole[] | undefined) ?? [],
        // Auth.js types `user` as AdapterUser too (email, emailVerified); we deliberately send none.
      } as typeof session.user;
      return session;
    },
  },
} satisfies NextAuthConfig;
