/**
 * Maps an Auth.js `logger.error` argument to a Sentry report (auth_runtime_spec §8).
 * Expected sign-in outcomes are messages with a level. Anything else, including a missing
 * `userinfo_endpoint` wrapped as `CallbackRouteError`, stays an exception.
 * The Auth.js `type` strings are the library's own error names.
 */
export type AuthLoggerReport =
  | { kind: "message"; level: "info" | "warning"; message: string; code: string }
  | { kind: "exception" };

const SIGN_IN_MESSAGE = "auth.sign_in";
const CREDENTIALS_MESSAGE = "auth.credentials_signin";

const readAuthErrorType = (error: Error): string | null => {
  if (!("type" in error) || typeof error.type !== "string" || error.type.length === 0) return null;
  return error.type;
};

const readAuthErrorCode = (error: Error, fallback: string): string => {
  if ("code" in error && typeof error.code === "string" && error.code.length > 0) return error.code;
  return fallback;
};

export const classifyAuthLoggerError = (error: Error): AuthLoggerReport => {
  const type = readAuthErrorType(error);
  if (type === "CredentialsSignin") {
    const code = readAuthErrorCode(error, type);
    return {
      kind: "message",
      level: code === "locked" ? "warning" : "info",
      message: CREDENTIALS_MESSAGE,
      code,
    };
  }
  if (type === "OAuthCallback" || type === "OAuthCallbackError" || type === "AccessDenied") {
    return { kind: "message", level: "info", message: SIGN_IN_MESSAGE, code: type };
  }
  if (type === "OAuthAccountNotLinked") {
    return { kind: "message", level: "warning", message: SIGN_IN_MESSAGE, code: type };
  }
  return { kind: "exception" };
};
