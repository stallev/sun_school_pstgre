import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchTelegramOidcWithSyntheticUserinfo } from "./telegram-oidc-discovery-fetch";

const DISCOVERY = "https://oauth.telegram.org/.well-known/openid-configuration";

const stubFetch = (response: Response) => {
  const fetchMock = vi.fn(async () => response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchTelegramOidcWithSyntheticUserinfo (TG-3, guide §6.2)", () => {
  it("injects a synthetic userinfo_endpoint only when discovery lacks it", async () => {
    stubFetch(Response.json({ issuer: "https://oauth.telegram.org", jwks_uri: "https://oauth.telegram.org/jwks" }));
    const response = await fetchTelegramOidcWithSyntheticUserinfo(DISCOVERY);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body.userinfo_endpoint).toBe("https://oauth.telegram.org/userinfo");
    expect(body.issuer).toBe("https://oauth.telegram.org");
    expect(body.jwks_uri).toBe("https://oauth.telegram.org/jwks");
  });

  it("keeps an existing userinfo_endpoint untouched", async () => {
    stubFetch(Response.json({ userinfo_endpoint: "https://real.example/userinfo" }));
    const response = await fetchTelegramOidcWithSyntheticUserinfo(DISCOVERY);
    expect(((await response.json()) as Record<string, unknown>).userinfo_endpoint).toBe(
      "https://real.example/userinfo",
    );
  });

  it("does not touch other URLs", async () => {
    stubFetch(Response.json({ keys: [] }));
    const response = await fetchTelegramOidcWithSyntheticUserinfo("https://oauth.telegram.org/jwks");
    expect(await response.json()).toEqual({ keys: [] });
  });

  it("returns the original response when discovery is unavailable (N path)", async () => {
    stubFetch(new Response("down", { status: 503 }));
    const response = await fetchTelegramOidcWithSyntheticUserinfo(DISCOVERY);
    expect(response.status).toBe(503);
    expect(await response.text()).toBe("down");
  });

  it("returns the original response when discovery is not JSON", async () => {
    stubFetch(new Response("<html>", { status: 200 }));
    const response = await fetchTelegramOidcWithSyntheticUserinfo(DISCOVERY);
    expect(await response.text()).toBe("<html>");
  });
});
