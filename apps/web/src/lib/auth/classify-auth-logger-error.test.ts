import { AuthError } from "@auth/core/errors";
import { describe, expect, it } from "vitest";
import { classifyAuthLoggerError } from "./classify-auth-logger-error";

class TypedAuthError extends AuthError {
  static type: string;
}

const typed = (type: string, code?: string): Error => {
  const error = new TypedAuthError("sign-in failed");
  Object.defineProperty(error, "type", { value: type });
  if (code) Object.assign(error, { code });
  return error;
};

describe("classifyAuthLoggerError", () => {
  it("reports a cancelled Telegram consent as info, not an exception", () => {
    expect(classifyAuthLoggerError(typed("OAuthCallbackError"))).toEqual({
      kind: "message",
      level: "info",
      message: "auth.sign_in",
      code: "OAuthCallbackError",
    });
  });

  it("reports AccessDenied as info and a link conflict as a warning", () => {
    expect(classifyAuthLoggerError(typed("AccessDenied"))).toMatchObject({
      kind: "message",
      level: "info",
    });
    expect(classifyAuthLoggerError(typed("OAuthAccountNotLinked"))).toMatchObject({
      kind: "message",
      level: "warning",
      code: "OAuthAccountNotLinked",
    });
  });

  it("keeps a wrong password at info and a lock at warning", () => {
    expect(classifyAuthLoggerError(typed("CredentialsSignin", "bad_credentials"))).toMatchObject({
      kind: "message",
      level: "info",
    });
    expect(classifyAuthLoggerError(typed("CredentialsSignin", "locked"))).toMatchObject({
      kind: "message",
      level: "warning",
    });
  });

  it("keeps a discovery failure as an exception", () => {
    expect(classifyAuthLoggerError(typed("CallbackRouteError"))).toEqual({ kind: "exception" });
    expect(classifyAuthLoggerError(new TypeError("userinfo endpoint"))).toEqual({ kind: "exception" });
  });
});
