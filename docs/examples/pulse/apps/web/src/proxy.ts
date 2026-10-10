import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import NextAuth from "next-auth";

import {
  getRoleHome,
  isRoleAllowedForPath,
  requiresAuth,
} from "@pulse/policy-edge";

import authConfig from "./auth.config";
import {
  bootstrapLocaleCookie,
  readRequestLocaleCookie,
  redirectWithLocaleCookie,
} from "./lib/i18n/bootstrap-locale-cookie";

const { auth } = NextAuth(authConfig);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasLocaleCookie = readRequestLocaleCookie(request) !== null;
  const session = hasLocaleCookie ? null : await auth();

  const localeOptions = {
    sessionLocale: session?.user?.locale,
  };

  if (!requiresAuth(pathname)) {
    return bootstrapLocaleCookie(request, localeOptions);
  }

  const authSession = session ?? (await auth());

  if (!authSession?.user?.role) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return redirectWithLocaleCookie(request, loginUrl, localeOptions);
  }

  if (!isRoleAllowedForPath(authSession.user.role, pathname)) {
    return redirectWithLocaleCookie(
      request,
      new URL(getRoleHome(authSession.user.role), request.url),
      localeOptions,
    );
  }

  return bootstrapLocaleCookie(request, localeOptions);
}

export const config = {
  matcher: [
    "/((?!monitoring|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$|api/).*)",
  ],
};
