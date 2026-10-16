import "server-only";
import * as Sentry from "@sentry/nextjs";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import authConfig from "@/auth.config";
import { resolveSessionClaims } from "@/data/access/session-claims";
import { signInTelegramInTransaction } from "@/data/access/first-login";
import { linkTelegramInTransaction } from "@/data/access/link-provider";
import { verifyCredentials } from "@/data/access/verify-credentials";
import { getPrisma } from "@/lib/db.server";
import {
  clearLinkIntentCookie,
  parseLinkIntentCookie,
} from "@/lib/auth/link-intent";
import { AUTHJS_PROVIDER_ID, toLoginProvider } from "@/lib/auth/provider-map";
import { LOGIN_PROVIDER, MUTATION_ERROR_CODES } from "@sunschool/domain";
import { isCanonicalRoute } from "@sunschool/policy-edge";
import { safeRedirect } from "@/lib/auth/safe-redirect";
import { mapTelegramProfile } from "@/lib/auth/telegram-profile";

/**
 * Node-runtime Auth.js entry (auth_runtime_spec §3): `auth.config` (Telegram, pure jwt/session) +
 * the Credentials provider (administrator email + password, ADR-003 v1.1) + the DB callbacks.
 * No adapter, no Google. Second-method linking uses the signed `link-intent` cookie (§7).
 */

/** Error `code`s are mapped to dictionary keys on /login (`auth.login.bad_credentials` / `locked`). */
class BadCredentialsError extends CredentialsSignin {
  override code = "bad_credentials";
}
class LockedError extends CredentialsSignin {
  override code = "locked";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers,
    Credentials({
      id: AUTHJS_PROVIDER_ID.CREDENTIALS,
      name: "Email",
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const result = await verifyCredentials(await getPrisma(), credentials, new Date());
        if (!result.ok) throw result.reason === "locked" ? new LockedError() : new BadCredentialsError();
        return { id: result.uid };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    // Returns `false` for a refusal, without telling why (auth_runtime_spec §5.1, §8).
    async signIn({ account, profile }) {
      const provider = toLoginProvider(account?.provider);
      if (provider === null || !account?.providerAccountId) return false;

      const now = new Date();
      const linkIntent = await parseLinkIntentCookie(now);
      const linkBranch =
        linkIntent !== null &&
        provider === LOGIN_PROVIDER.TELEGRAM &&
        linkIntent.provider === LOGIN_PROVIDER.TELEGRAM;

      if (linkBranch) {
        try {
          if (account.provider === AUTHJS_PROVIDER_ID.CREDENTIALS) return false;
          const claims = mapTelegramProfile({ ...(profile ?? {}), sub: account.providerAccountId });
          const linkResult = await linkTelegramInTransaction(await getPrisma(), {
            userId: linkIntent.uid,
            providerAccountId: claims.id,
            username: claims.username,
            phone: claims.phone,
            now,
          });
          if (!linkResult.ok) {
            if (linkResult.code === MUTATION_ERROR_CODES.AUTH_LINK_CONFLICT) {
              return `/profile?link_error=${MUTATION_ERROR_CODES.AUTH_LINK_CONFLICT}`;
            }
            return false;
          }
          return "/profile?linked=1";
        } finally {
          await clearLinkIntentCookie();
        }
      }

      if (account.provider === AUTHJS_PROVIDER_ID.CREDENTIALS) return true; // checked in authorize()

      const claims = mapTelegramProfile({ ...(profile ?? {}), sub: account.providerAccountId });
      const result = await signInTelegramInTransaction(await getPrisma(), {
        providerAccountId: claims.id,
        username: claims.username,
        phone: claims.phone,
        now,
      });
      return result.kind === "ok";
    },
    // On the first call after a sign-in Auth.js passes `account`: read uid / status / roles once.
    async jwt(params) {
      const carried = await authConfig.callbacks.jwt(params);
      const { account } = params;
      const provider = toLoginProvider(account?.provider);
      if (!account || provider === null) return carried;
      const claims = await resolveSessionClaims(await getPrisma(), {
        provider,
        providerAccountId: account.providerAccountId,
      });
      return claims ? { ...carried, ...claims } : carried;
    },
    redirect({ url, baseUrl }) {
      return safeRedirect(url, baseUrl, isCanonicalRoute);
    },
  },
  logger: {
    // Auth.js swallows OIDC exceptions; report them without tokens or user data (§8).
    error(error) {
      // Wrong password / lock are expected events (§8): info / warning, not exceptions.
      if (error instanceof CredentialsSignin) {
        Sentry.captureMessage("auth.credentials_signin", {
          level: error.code === "locked" ? "warning" : "info",
          tags: { code: error.code },
        });
        return;
      }
      Sentry.captureException(error);
    },
    warn() {},
    debug() {},
  },
});
