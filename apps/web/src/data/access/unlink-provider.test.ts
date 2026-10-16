import { describe, expect, it, vi } from "vitest";
import { LOGIN_PROVIDER, MUTATION_ERROR_CODES } from "@sunschool/domain";

vi.mock("@sunschool/db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@sunschool/db")>();
  return { ...actual, writeAudit: vi.fn() };
});

import { unlinkProvider } from "./unlink-provider";

const USER_ID = "11111111-1111-1111-1111-111111111111";

describe("unlinkProvider", () => {
  it("refuses to unlink credentials", async () => {
    const db = { $transaction: vi.fn() };
    const result = await unlinkProvider(db as never, USER_ID, LOGIN_PROVIDER.CREDENTIALS);
    expect(result).toMatchObject({
      ok: false,
      code: MUTATION_ERROR_CODES.VALIDATION,
      message: "auth.profile.unlink_forbidden",
    });
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("returns AUTH_LAST_IDENTITY when only one method remains", async () => {
    const db = {
      $transaction: async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({
          $queryRaw: vi.fn(),
          loginIdentity: {
            findMany: async () => [{ id: "id-1", provider: LOGIN_PROVIDER.TELEGRAM }],
          },
        }),
    };
    const result = await unlinkProvider(db as never, USER_ID, LOGIN_PROVIDER.TELEGRAM);
    expect(result).toMatchObject({
      ok: false,
      code: MUTATION_ERROR_CODES.AUTH_LAST_IDENTITY,
    });
  });

  it("deletes Telegram when another identity exists", async () => {
    const deleted: string[] = [];
    const db = {
      $transaction: async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({
          $queryRaw: vi.fn(),
          loginIdentity: {
            findMany: async () => [
              { id: "tg", provider: LOGIN_PROVIDER.TELEGRAM },
              { id: "cred", provider: LOGIN_PROVIDER.CREDENTIALS },
            ],
            delete: async ({ where }: { where: { id: string } }) => {
              deleted.push(where.id);
            },
          },
        }),
    };
    const result = await unlinkProvider(db as never, USER_ID, LOGIN_PROVIDER.TELEGRAM);
    expect(result).toEqual({ ok: true });
    expect(deleted).toEqual(["tg"]);
  });
});
