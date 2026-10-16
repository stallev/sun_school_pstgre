import { describe, expect, it } from "vitest";
import { isCanonicalRoute } from "@sunschool/policy-edge";
import { safeRedirect } from "./safe-redirect";

const BASE = "https://app.example.org";
const redirect = (url: string) => safeRedirect(url, BASE, isCanonicalRoute);

describe("safeRedirect (open redirect protection + canonical routes)", () => {
  it("follows canonical relative paths and same-origin URLs", () => {
    expect(redirect("/profile")).toBe(`${BASE}/profile`);
    expect(redirect("/users/42?tab=log")).toBe(`${BASE}/users/42?tab=log`);
    expect(redirect(`${BASE}/school`)).toBe(`${BASE}/school`);
  });

  it("falls back to the base URL for unknown paths", () => {
    expect(redirect("/no-such-page")).toBe(BASE);
    expect(redirect(`${BASE}/achievements`)).toBe(BASE);
  });

  it("ignores external hosts and protocol-relative / backslash tricks", () => {
    expect(redirect("https://evil.example/profile")).toBe(BASE);
    expect(redirect("//evil.example")).toBe(BASE);
    expect(redirect(String.raw`/\evil.example`)).toBe(BASE);
    expect(redirect("javascript:alert(1)")).toBe(BASE);
    expect(redirect("")).toBe(BASE);
  });
});
