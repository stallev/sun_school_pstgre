import { describe, expect, it } from "vitest";
import {
  mapTelegramProfile,
  normalizeTelegramPhone,
  normalizeTelegramUsername,
} from "./telegram-profile";

describe("mapTelegramProfile (scopes openid profile phone)", () => {
  it("maps id, name, picture, username and phone", () => {
    expect(
      mapTelegramProfile({
        sub: "123456789",
        name: "Pavel Kim",
        picture: "https://t.me/i/userpic/320/x.jpg",
        preferred_username: "pkim",
        phone_number: "+79001112233",
      }),
    ).toEqual({
      id: "123456789",
      name: "Pavel Kim",
      image: "https://t.me/i/userpic/320/x.jpg",
      email: null,
      username: "pkim",
      phone: "+79001112233",
    });
  });

  it("treats a missing phone and a missing username as null (Q-05: phone is optional)", () => {
    const user = mapTelegramProfile({ sub: "1", name: "Elena" });
    expect(user.phone).toBeNull();
    expect(user.username).toBeNull();
    expect(user.id).toBe("1");
  });

  it("never exposes an email (Telegram does not send one)", () => {
    expect(mapTelegramProfile({ sub: "1", email: "x@y.z" }).email).toBeNull();
  });

  it("falls back to the numeric `id` claim when `sub` is absent", () => {
    expect(mapTelegramProfile({ id: 42 }).id).toBe("42");
  });

  it("rejects a profile without any subject instead of creating an empty identity", () => {
    expect(() => mapTelegramProfile({ name: "X" })).toThrow(/no subject/);
    expect(() => mapTelegramProfile({ sub: "  " })).toThrow(/no subject/);
  });
});

describe("normalizers", () => {
  it("strips a leading @ and blanks from the username", () => {
    expect(normalizeTelegramUsername("@pkim")).toBe("pkim");
    expect(normalizeTelegramUsername("  pkim ")).toBe("pkim");
    expect(normalizeTelegramUsername("@")).toBeNull();
    expect(normalizeTelegramUsername("")).toBeNull();
    expect(normalizeTelegramUsername(undefined)).toBeNull();
    expect(normalizeTelegramUsername(42)).toBeNull();
  });

  it("removes spaces, dashes and brackets from the phone but keeps the plus", () => {
    expect(normalizeTelegramPhone("+7 (900) 111-22-33")).toBe("+79001112233");
    expect(normalizeTelegramPhone("   ")).toBeNull();
    expect(normalizeTelegramPhone(null)).toBeNull();
  });
});
