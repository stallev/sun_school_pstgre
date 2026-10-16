import type { Metadata } from "next";
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

export const instant = false;

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Login",
};

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
};

const LoginPage = async ({ searchParams }: LoginPageProps) => {
  const params = await searchParams;
  const callbackUrl = sanitizeCallbackUrl(params.callbackUrl);
  const errorParam = params.error;
  const isAccessDenied = errorParam === "AccessDenied";

  const sessionContext = await loadSessionPolicyContext();
  if (sessionContext && !isAccessDenied) {
    redirect(homeRouteFor(sessionContext.status, sessionContext.roles));
  }

  const locale = await getUiLocale();
  const auth = await getDictionary(locale, "auth");
  const errorKey = loginErrorMessageKey(errorParam);
  const errorMessage = errorKey ? getMessage(auth, errorKey) : null;

  const { APP_ENV } = getServerEnv();

  return (
    <main>
      {isAccessDenied ? <LoginAccessDeniedCleanup /> : null}
      <LoginForm
        callbackUrl={callbackUrl}
        errorMessage={errorMessage}
        showDevBanner={APP_ENV === "dev"}
      />
    </main>
  );
};

export default LoginPage;
