/** Maps `/login?error=` values to `auth.login.*` dictionary keys (auth_runtime_spec §8). */
export const loginErrorMessageKey = (error: string | undefined): string | null => {
  if (!error) return null;
  switch (error) {
    case "OAuthCallback":
    case "OAuthCallbackError":
      return "login.cancelled";
    case "OAuthAccountNotLinked":
      return "login.account_conflict";
    case "CredentialsSignin":
    case "bad_credentials":
      return "login.bad_credentials";
    case "RateLimited":
    case "locked":
      return "login.locked";
    case "AccessDenied":
      return "login.denied";
    case "Configuration":
      return "login.failed";
    default:
      return "login.failed";
  }
};
