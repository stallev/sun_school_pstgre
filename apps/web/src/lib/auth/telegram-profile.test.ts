import { describe, expect, it } from "vitest";
import { mapTelegramProfile } from "./telegram-profile";

describe("mapTelegramProfile (scope openid)", () => {
  it("maps only the Telegram subject id", () => {
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
      email: null,
    });
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
