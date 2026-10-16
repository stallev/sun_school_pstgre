import { describe, expect, it } from "vitest";
import { ACCOUNT_STATUS, USER_ROLE, type AccountStatus, type UserRole } from "@sunschool/domain";
import { canVisitRoutePrefix, type EdgeSession } from "./route-access";

const S = ACCOUNT_STATUS;
const session = (status: AccountStatus, roles: UserRole[] = []): EdgeSession => ({ userId: "u1", status, roles });
const ALLOW = { kind: "allow" } as const;
const to = (path: string) => ({ kind: "redirect", to: path }) as const;

/** One representative path per column of the authorization_matrix §6 table. */
const PATHS = {
  login: "/login",
  privacy: "/privacy",
  register: "/register",
  pending: "/pending",
  profile: "/profile",
  otherApp: "/calendar",
} as const;

type Row = Record<keyof typeof PATHS, ReturnType<typeof to> | typeof ALLOW>;

describe("canVisitRoutePrefix — status × route table (authorization_matrix §6)", () => {
  const table: Array<[string, EdgeSession | null, Row]> = [
    ["no session", null, { login: ALLOW, privacy: ALLOW, register: to("/login"), pending: to("/login"), profile: to("/login"), otherApp: to("/login") }],
    ["REGISTRATION", session(S.REGISTRATION), { login: to("/register"), privacy: ALLOW, register: ALLOW, pending: to("/register"), profile: to("/register"), otherApp: to("/register") }],
    ["REQUEST_PENDING", session(S.REQUEST_PENDING), { login: to("/pending"), privacy: ALLOW, register: to("/pending"), pending: ALLOW, profile: ALLOW, otherApp: to("/pending") }],
    ["REJECTED", session(S.REJECTED), { login: to("/pending"), privacy: ALLOW, register: to("/pending"), pending: ALLOW, profile: ALLOW, otherApp: to("/pending") }],
    ["ACTIVE teacher", session(S.ACTIVE, [USER_ROLE.TEACHER]), { login: to("/today"), privacy: ALLOW, register: ALLOW, pending: to("/today"), profile: ALLOW, otherApp: ALLOW }],
    ["ACTIVE admin", session(S.ACTIVE, [USER_ROLE.ADMIN]), { login: to("/school"), privacy: ALLOW, register: ALLOW, pending: to("/school"), profile: ALLOW, otherApp: ALLOW }],
    ["ACTIVE admin+teacher", session(S.ACTIVE, [USER_ROLE.TEACHER, USER_ROLE.ADMIN]), { login: to("/school"), privacy: ALLOW, register: ALLOW, pending: to("/school"), profile: ALLOW, otherApp: ALLOW }],
    ["DISABLED", session(S.DISABLED), { login: ALLOW, privacy: ALLOW, register: to("/login"), pending: to("/login"), profile: to("/login"), otherApp: to("/login") }],
    ["DELETED", session(S.DELETED), { login: ALLOW, privacy: ALLOW, register: to("/login"), pending: to("/login"), profile: to("/login"), otherApp: to("/login") }],
  ];

  for (const [label, current, expected] of table) {
    describe(label, () => {
      for (const [column, path] of Object.entries(PATHS) as Array<[keyof typeof PATHS, string]>) {
        it(`${path} → ${JSON.stringify(expected[column])}`, () => {
          expect(canVisitRoutePrefix(current, path)).toEqual(expected[column]);
        });
      }
    });
  }
});

describe("canVisitRoutePrefix — details", () => {
  const teacher = session(S.ACTIVE, [USER_ROLE.TEACHER]);

  it("does NOT redirect a wrong role: AZ-D3 is a 403 on the server", () => {
    expect(canVisitRoutePrefix(teacher, "/users")).toEqual(ALLOW);
    expect(canVisitRoutePrefix(teacher, "/approvals")).toEqual(ALLOW);
    expect(canVisitRoutePrefix(session(S.ACTIVE, [USER_ROLE.ADMIN]), "/today")).toEqual(ALLOW);
  });

  it("handles nested paths, query strings and trailing slashes", () => {
    expect(canVisitRoutePrefix(null, "/users/123?tab=log")).toEqual(to("/login"));
    expect(canVisitRoutePrefix(null, "/login/")).toEqual(ALLOW);
    expect(canVisitRoutePrefix(session(S.REGISTRATION), "/privacy#consent")).toEqual(ALLOW);
    expect(canVisitRoutePrefix(session(S.REQUEST_PENDING), "/lessons/abc/check")).toEqual(to("/pending"));
  });

  it("a path that only starts like a route is not that route", () => {
    expect(canVisitRoutePrefix(session(S.REGISTRATION), "/register-now")).toEqual(to("/register"));
    expect(canVisitRoutePrefix(null, "/loginx")).toEqual(to("/login"));
  });

  it("lets /design-system and /api/* through for everyone (own guards)", () => {
    for (const current of [null, session(S.REGISTRATION), session(S.DISABLED), teacher]) {
      expect(canVisitRoutePrefix(current, "/design-system")).toEqual(ALLOW);
      expect(canVisitRoutePrefix(current, "/api/anything")).toEqual(ALLOW);
    }
  });

  it("sends an ACTIVE user from / to the home route; unknown paths fall through to the 404 page", () => {
    expect(canVisitRoutePrefix(teacher, "/")).toEqual(to("/today"));
    expect(canVisitRoutePrefix(teacher, "/no-such-page")).toEqual(ALLOW);
    expect(canVisitRoutePrefix(null, "/")).toEqual(to("/login"));
  });

  it("keeps /login?error=… open for every status: no redirect loop with a stale JWT", () => {
    for (const current of [null, session(S.REGISTRATION), session(S.REQUEST_PENDING), teacher, session(S.DISABLED)]) {
      expect(canVisitRoutePrefix(current, "/login?error=AccessDenied")).toEqual(ALLOW);
    }
    // ...but a bare /login still bounces an ACTIVE user home
    expect(canVisitRoutePrefix(teacher, "/login")).toEqual(to("/today"));
    expect(canVisitRoutePrefix(teacher, "/login?next=/x")).toEqual(to("/today"));
  });

  it("denies an unknown status (N path)", () => {
    const weird = { userId: "u", status: "SUSPENDED" as AccountStatus, roles: [] } satisfies EdgeSession;
    expect(canVisitRoutePrefix(weird, "/today")).toEqual(to("/login"));
    expect(canVisitRoutePrefix(weird, "/register")).toEqual(to("/login"));
    expect(canVisitRoutePrefix(weird, "/privacy")).toEqual(ALLOW);
  });
});
