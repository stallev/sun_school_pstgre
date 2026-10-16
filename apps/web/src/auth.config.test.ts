import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import authConfig, { TELEGRAM_OIDC_ISSUER, TELEGRAM_OIDC_SCOPE } from "./auth.config";

type TelegramProvider = {
  id: string;
  type: string;
  issuer: string;
  idToken: boolean;
  checks: string[];
  allowDangerousEmailAccountLinking: boolean;
  authorization: { params: { scope: string } };
  profile: (claims: Record<string, unknown>) => { email: null; username: string | null; phone: string | null };
};

const providers = authConfig.providers as unknown as TelegramProvider[];

describe("auth.config (edge-safe, ADR-003 v1.1)", () => {
  it("has the Telegram provider only: no Google, no Credentials (that one lives in auth.ts)", () => {
    expect(providers.map((p) => p.id)).toEqual(["telegram"]);
  });

  it("configures Telegram as OIDC with PKCE + state and the phone scope", () => {
    const [telegram] = providers;
    expect(telegram?.type).toBe("oidc");
    expect(telegram?.issuer).toBe(TELEGRAM_OIDC_ISSUER);
    expect(telegram?.idToken).toBe(true);
    expect(telegram?.checks).toEqual(["pkce", "state"]);
    expect(telegram?.allowDangerousEmailAccountLinking).toBe(false);
    expect(telegram?.authorization.params.scope).toBe("openid profile phone");
    expect(TELEGRAM_OIDC_SCOPE).toBe("openid profile phone");
  });

  it("maps the profile with username and phone, never an email", () => {
    const user = providers[0]?.profile({ sub: "9", preferred_username: "pkim", phone_number: "+79001112233" });
    expect(user).toMatchObject({ email: null, username: "pkim", phone: "+79001112233" });
  });

  it("uses a JWT session without an adapter", () => {
    expect(authConfig.session.strategy).toBe("jwt");
    expect("adapter" in authConfig).toBe(false);
  });

  it("session callback exposes only uid, status and roles (INV-23, ADR-003 §4.3)", async () => {
    const session = authConfig.callbacks.session({
      session: { user: { name: "X", email: "x@y.z", image: "i" }, expires: "" },
      token: { uid: "u1", status: "ACTIVE", roles: ["ADMIN"] },
    } as never) as unknown as { user: Record<string, unknown> };
    expect(session.user.id).toBe("u1");
    expect(session.user.roles).toEqual(["ADMIN"]);
    expect(session.user.status).toBe("ACTIVE");
    expect(Object.keys(session.user).sort()).toEqual(["id", "roles", "status"]);
  });

  it("jwt callback drops the provider's name, email, picture and sub (ADR-003 §4.3)", () => {
    const token = authConfig.callbacks.jwt({
      token: { name: "Pavel Kim", email: "x@y.z", picture: "https://t.me/i/x.jpg", sub: "123", uid: "u1", status: "ACTIVE", roles: ["ADMIN"] },
    } as never) as unknown as Record<string, unknown>;
    expect(token).toEqual({ uid: "u1", status: "ACTIVE", roles: ["ADMIN"] });
    expect(token).not.toHaveProperty("name");
    expect(token).not.toHaveProperty("picture");
    expect(token).not.toHaveProperty("sub");
  });

  it("keeps the Google provider and its env vars out of the source tree", () => {
    const root = resolve(import.meta.dirname, "..");
    for (const file of ["src/auth.config.ts", "src/lib/env.server.ts", "src/app/login/page.tsx", "src/auth.ts"]) {
      expect(readFileSync(resolve(root, file), "utf8"), file).not.toMatch(/providers\/google|AUTH_GOOGLE|id:\s*"google"/i);
    }
  });
});
