import { describe, expect, it } from "vitest";
import { getDummyPasswordHash, hashPassword, verifyPassword } from "./password";

describe("password hashing (scrypt, Q-06)", () => {
  it("round-trips and uses the agreed format and parameters", async () => {
    const hash = await hashPassword("correct horse battery");
    const [prefix, n, r, p, salt, key] = hash.split("$");
    expect([prefix, n, r, p]).toEqual(["scrypt", "32768", "8", "1"]);
    expect(Buffer.from(salt ?? "", "base64")).toHaveLength(16);
    expect(Buffer.from(key ?? "", "base64")).toHaveLength(64);
    expect(await verifyPassword("correct horse battery", hash)).toBe(true);
  });

  it("rejects a wrong password", async () => {
    const hash = await hashPassword("right-password-123");
    expect(await verifyPassword("wrong-password-123", hash)).toBe(false);
  });

  it("uses a fresh salt per hash and never contains the password", async () => {
    const a = await hashPassword("same-password-123");
    const b = await hashPassword("same-password-123");
    expect(a).not.toBe(b);
    expect(a).not.toContain("same-password-123");
  });

  it("treats malformed or hostile stored values as a mismatch", async () => {
    for (const stored of ["", "plain", "scrypt$1$2", "bcrypt$x$y$z$a$b", "scrypt$3$8$1$AA==$AA==", `scrypt$${2 ** 25}$8$1$AA==$AA==`]) {
      expect(await verifyPassword("x", stored), stored).toBe(false);
    }
  });

  it("provides a valid dummy hash for constant-time unknown-email checks", async () => {
    const dummy = await getDummyPasswordHash();
    expect(await getDummyPasswordHash()).toBe(dummy);
    expect(await verifyPassword("anything", dummy)).toBe(false);
  });
});
