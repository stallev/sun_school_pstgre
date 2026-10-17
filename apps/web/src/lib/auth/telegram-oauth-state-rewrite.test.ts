import { decode, encode } from "@auth/core/jwt";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AUTHJS_PROVIDER_ID } from "./provider-map";
import { rewriteTelegramOAuthAuthorizeState } from "./telegram-oauth-state-rewrite";

const SECRET = "unit-test-secret-unit-test-secret";
const STATE_COOKIE = "authjs.state";
const LONG_STATE = "s".repeat(440);
const AUTHORIZE = `https://oauth.telegram.org/auth?client_id=1&scope=openid&state=${LONG_STATE}`;

const sealedLongStateCookie = async () => {
  const value = await encode({ secret: SECRET, salt: STATE_COOKIE, token: { value: LONG_STATE }, maxAge: 900 });
  return `${STATE_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax`;
};

const redirectResponse = async (extraCookies: string[] = []) => {
  const headers = new Headers({ location: AUTHORIZE });
  for (const cookie of [await sealedLongStateCookie(), ...extraCookies]) headers.append("set-cookie", cookie);
  return new Response(null, { status: 302, headers });
};

let savedSecret: string | undefined;
beforeEach(() => {
  savedSecret = process.env.AUTH_SECRET;
  process.env.AUTH_SECRET = SECRET;
});
afterEach(() => {
  if (savedSecret === undefined) delete process.env.AUTH_SECRET;
  else process.env.AUTH_SECRET = savedSecret;
});

describe("rewriteTelegramOAuthAuthorizeState (TG-2, TG-5)", () => {
  it("shortens state to ≤ 256 and re-seals the authjs.state cookie with the same value", async () => {
    const rewritten = await rewriteTelegramOAuthAuthorizeState(await redirectResponse());
    const location = new URL(rewritten.headers.get("location") ?? "");
    const state = location.searchParams.get("state") ?? "";
    expect(state.length).toBeGreaterThan(0);
    expect(state.length).toBeLessThanOrEqual(256);

    const cookie = rewritten.headers.getSetCookie().find((c) => c.startsWith(`${STATE_COOKIE}=`)) ?? "";
    const sealed = cookie.slice(STATE_COOKIE.length + 1).split(";")[0] ?? "";
    const decoded = await decode({ secret: SECRET, salt: STATE_COOKIE, token: sealed });
    expect(decoded?.value).toBe(state); // CSRF check keeps working: cookie and query state match
    expect(decoded?.provider).toBe(AUTHJS_PROVIDER_ID.TELEGRAM);
    expect(cookie).toContain("HttpOnly");
  });

  it("keeps the other cookies and the other query parameters", async () => {
    const rewritten = await rewriteTelegramOAuthAuthorizeState(
      await redirectResponse(["authjs.pkce.code_verifier=abc; Path=/; HttpOnly"]),
    );
    expect(rewritten.headers.getSetCookie().some((c) => c.startsWith("authjs.pkce.code_verifier=abc"))).toBe(true);
    const location = new URL(rewritten.headers.get("location") ?? "");
    expect(location.searchParams.get("client_id")).toBe("1");
    expect(location.searchParams.get("scope")).toBe("openid");
  });

  it("leaves a short state and non-Telegram redirects alone", async () => {
    const short = new Response(null, {
      status: 302,
      headers: { location: "https://oauth.telegram.org/auth?state=abc" },
    });
    expect(await rewriteTelegramOAuthAuthorizeState(short)).toBe(short);
    const other = new Response(null, { status: 302, headers: { location: "https://example.com/?state=" + LONG_STATE } });
    expect(await rewriteTelegramOAuthAuthorizeState(other)).toBe(other);
  });

  it("fails instead of leaking the long state when the state cookie is missing (TG-5)", async () => {
    const noCookie = new Response(null, { status: 302, headers: { location: AUTHORIZE } });
    await expect(rewriteTelegramOAuthAuthorizeState(noCookie)).rejects.toThrow(/state cookie missing/);
  });

  it("fails without AUTH_SECRET", async () => {
    delete process.env.AUTH_SECRET;
    delete process.env.NEXTAUTH_SECRET;
    await expect(rewriteTelegramOAuthAuthorizeState(await redirectResponse())).rejects.toThrow(/AUTH_SECRET/);
  });

  it("rewrites the JSON redirect form used by client signIn", async () => {
    const headers = new Headers({ "content-type": "application/json" });
    headers.append("set-cookie", await sealedLongStateCookie());
    const response = new Response(JSON.stringify({ url: AUTHORIZE }), { status: 200, headers });
    const rewritten = await rewriteTelegramOAuthAuthorizeState(response);
    const body = (await rewritten.json()) as { url: string };
    expect(new URL(body.url).searchParams.get("state")?.length).toBeLessThanOrEqual(256);
  });
});
