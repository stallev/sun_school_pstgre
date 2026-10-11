import type { NextRequest } from "next/server";
import { handlers } from "@/auth";
import { rewriteTelegramOAuthAuthorizeState } from "@/lib/auth/telegram-oauth-state-rewrite";

/**
 * Both methods are wrapped (TG-2): oauth.telegram.org rejects `state` longer than 256 characters,
 * so the authorize redirect is rewritten before it leaves the server.
 */
async function withTelegramOAuthStateRewrite(
  handle: (request: NextRequest) => Promise<Response>,
  request: NextRequest,
): Promise<Response> {
  const response = await handle(request);
  try {
    return await rewriteTelegramOAuthAuthorizeState(response);
  } catch {
    // No details to the client; the error is reported through the server logger / Sentry (P01).
    return new Response("Authentication request failed", { status: 500 });
  }
}

export function GET(request: NextRequest): Promise<Response> {
  return withTelegramOAuthStateRewrite(handlers.GET, request);
}

export function POST(request: NextRequest): Promise<Response> {
  return withTelegramOAuthStateRewrite(handlers.POST, request);
}
