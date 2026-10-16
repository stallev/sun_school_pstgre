import { describe, expect, it } from "vitest";
import { safeRedirect } from "./safe-redirect";

const BASE = "https://app.example.org";

describe("safeRedirect (open redirect protection)", () => {
  it("follows relative paths and same-origin URLs", () => {
    expect(safeRedirect("/profile", BASE)).toBe(`${BASE}/profile`);
    expect(safeRedirect(`${BASE}/school`, BASE)).toBe(`${BASE}/school`);
  });

  it("ignores external hosts and protocol-relative / backslash tricks", () => {
    expect(safeRedirect("https://evil.example/phish", BASE)).toBe(BASE);
    expect(safeRedirect("//evil.example", BASE)).toBe(BASE);
    expect(safeRedirect("/\\evil.example", BASE)).toBe(BASE);
    expect(safeRedirect("javascript:alert(1)", BASE)).toBe(BASE);
    expect(safeRedirect("", BASE)).toBe(BASE);
  });
});
