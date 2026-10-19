import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { canVisitRoutePrefix, type EdgeSession } from "@sunschool/policy-edge";
import authConfig from "@/auth.config";
import { applyRequestSecurity } from "@/lib/security/request-security";

/**
 * Request interception (Next.js 16 `proxy.ts`, Node runtime).
 * Layer 1 of auth-security: an OPTIMISTIC redirect by JWT claims only.
 * It imports `auth.config` and `policy-edge` — never `auth.ts`, `@sunschool/db` or `policy-server`
 * (PKG-02). Authoritative checks are `requireActiveUser()` in layouts, actions and DAL.
 */
const { auth } = NextAuth(authConfig);

export default auth((request) => {
  const user = request.auth?.user;
  const session: EdgeSession | null = user
    ? { userId: user.id, status: user.status, roles: user.roles }
    : null;

  const decision = canVisitRoutePrefix(session, `${request.nextUrl.pathname}${request.nextUrl.search}`);
  if (decision.kind === "redirect") {
    return applyRequestSecurity(
      request,
      NextResponse.redirect(new URL(decision.to, request.nextUrl)),
    );
  }
  return applyRequestSecurity(request, NextResponse.next());
});

export const config = {
  // Skip Next internals, static files and the Auth.js endpoints themselves.
  matcher: [
    "/((?!api/auth|monitoring|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
