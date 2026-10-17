import { describe, expect, it, vi } from "vitest";
import { MUTATION_ERROR_CODES } from "@sunschool/domain";

vi.mock("@sunschool/db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@sunschool/db")>();
  return { ...actual, writeAudit: vi.fn() };
});

import { linkTelegram } from "./link-provider";

const NOW = new Date("2026-10-16T12:00:00.000Z");
const USER_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_ID = "22222222-2222-2222-2222-222222222222";

describe("linkTelegram", () => {
  it("creates a new identity and writes audit when the Telegram id is free", async () => {
    const writes: unknown[] = [];
    const tx = {
      appUser: {
        findUnique: async () => ({ id: USER_ID, status: "ACTIVE" }),
      },
      loginIdentity: {
        findUnique: async () => null,
        create: async (args: unknown) => {
          writes.push(args);
        },
      },
    };
    const result = await linkTelegram(tx as never, {
      userId: USER_ID,
      providerAccountId: "tg-1",
      now: NOW,
    });
    expect(result).toEqual({ ok: true });
    expect(writes).toHaveLength(1);
  });

  it("is idempotent when the identity already belongs to the user", async () => {
    const tx = {
      appUser: {
        findUnique: async () => ({ id: USER_ID, status: "ACTIVE" }),
      },
      loginIdentity: {
        findUnique: async () => ({
          id: "id-1",
          userId: USER_ID,
        }),
        update: vi.fn(),
      },
    };
    const result = await linkTelegram(tx as never, {
      userId: USER_ID,
      providerAccountId: "tg-1",
      now: NOW,
    });
    expect(result).toEqual({ ok: true });
    expect(tx.loginIdentity.update).not.toHaveBeenCalled();
  });

  it("returns AUTH_LINK_CONFLICT when Telegram belongs to another user", async () => {
    const tx = {
      appUser: {
        findUnique: async () => ({ id: USER_ID, status: "ACTIVE" }),
      },
      loginIdentity: {
        findUnique: async () => ({
          id: "id-1",
          userId: OTHER_ID,
        }),
      },
    };
    const result = await linkTelegram(tx as never, {
      userId: USER_ID,
      providerAccountId: "tg-1",
      now: NOW,
    });
    expect(result).toMatchObject({
      ok: false,
      code: MUTATION_ERROR_CODES.AUTH_LINK_CONFLICT,
    });
  });
});
