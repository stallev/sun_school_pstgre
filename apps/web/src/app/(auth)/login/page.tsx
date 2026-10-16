import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { homeRouteFor } from "@sunschool/policy-edge";
import { LoginAccessDeniedCleanup } from "@/components/auth/LoginAccessDeniedCleanup.client";
import { LoginForm } from "@/components/auth/LoginForm.client";
import { getServerEnv } from "@/lib/env.server";
import { sanitizeCallbackUrl } from "@/lib/auth/sanitize-callback-url";
import { loadSessionPolicyContext } from "@/lib/auth/load-session-policy.server";
import { loginErrorMessageKey } from "@/lib/auth/login-error-message-key";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";
import { pickShellMessages } from "@/lib/messages/shell-messages";
import { AuthScreen } from "@/components/auth/AuthScreen";

export const instant = false;

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Login",
};

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
};

const LoginPage = async ({ searchParams }: LoginPageProps) => {
  // Auth.js calls crypto.getRandomValues() inside auth(). Postpone first so prerender does not throw.
  await connection();
  const params = await searchParams;
  const callbackUrl = sanitizeCallbackUrl(params.callbackUrl);
  const errorParam = params.error;
  const isAccessDenied = errorParam === "AccessDenied";

  const sessionContext = await loadSessionPolicyContext();
  if (sessionContext && !isAccessDenied) {
    redirect(homeRouteFor(sessionContext.status, sessionContext.roles));
  }

  const locale = await getUiLocale();
  const [auth, common] = await Promise.all([getDictionary(locale, "auth"), getDictionary(locale, "common")]);
  const brandLabel = pickShellMessages(common).brand;
  const errorKey = loginErrorMessageKey(errorParam);
  const isCredentialsError = errorKey === "login.bad_credentials" || errorKey === "login.locked";
  const initialCredentialsError =
    isCredentialsError && errorKey ? getMessage(auth, errorKey) : null;
  const telegramErrorMessage =
    errorKey && !isCredentialsError ? getMessage(auth, errorKey) : null;

  const { APP_ENV } = getServerEnv();

  return (
    <AuthScreen variant="narrow">
      {isAccessDenied ? <LoginAccessDeniedCleanup /> : null}
      <LoginForm
        brandLabel={brandLabel}
        callbackUrl={callbackUrl}
        telegramErrorMessage={telegramErrorMessage}
        defaultAdminLoginOpen={isCredentialsError}
        initialCredentialsError={initialCredentialsError}
        showDevBanner={APP_ENV === "dev"}
      />
    </AuthScreen>
  );
};

export default LoginPage;
