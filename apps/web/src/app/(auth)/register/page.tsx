import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { homeRouteFor } from "@sunschool/policy-edge";
import {
  recordPrivacyConsentAction,
  resubmitRegistrationAction,
  submitRegistrationAction,
} from "@/actions/access";
import { RegisterForm } from "@/components/auth/RegisterForm.client";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { Heading } from "@/components/atoms";
import { loadRegisterPageContext } from "@/data/access/load-register-context.server";
import { requireSession } from "@/lib/auth/require-user";
import { loadSessionPolicyContext } from "@/lib/auth/load-session-policy.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { pickAuthMessages } from "@/lib/messages/auth-messages";
import { pickShellMessages } from "@/lib/messages/shell-messages";
import { getDictionary } from "@/lib/messages/get-dictionary";
import { getPrivacyContent } from "@/app/(auth)/privacy/content";

export const instant = false;

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Register",
};

const RegisterPage = async () => {
  await requireSession();
  const policy = await loadSessionPolicyContext();
  if (!policy) redirect("/login");

  const registerContext = await loadRegisterPageContext(policy.userId);
  if (!registerContext) {
    redirect(homeRouteFor(policy.status, policy.roles));
  }

  const locale = await getUiLocale();
  const [common, auth] = await Promise.all([getDictionary(locale, "common"), getDictionary(locale, "auth")]);
  const authMessages = pickAuthMessages(auth);
  const shellMessages = pickShellMessages(common);
  const privacy = getPrivacyContent(locale);
  const fullTextParagraphs = privacy.sections.flatMap((section) => [section.title, ...section.body]);

  const action =
    registerContext.mode === "consentOnly"
      ? recordPrivacyConsentAction
      : registerContext.mode === "resubmit"
        ? resubmitRegistrationAction
        : submitRegistrationAction;

  const title =
    registerContext.mode === "consentOnly"
      ? authMessages.register.titleConsent
      : registerContext.mode === "resubmit"
        ? authMessages.register.titleResubmit
        : authMessages.register.titleNew;

  return (
    <AuthScreen variant="reading">
      <div className="space-y-6">
        <header>
          <Heading>{title}</Heading>
        </header>
        <RegisterForm
          mode={registerContext.mode}
          consentVersion={registerContext.consentVersion}
          summaryBullets={privacy.summaryBullets}
          fullTextParagraphs={fullTextParagraphs}
          rejectReason={registerContext.rejectReason}
          initialNames={registerContext.initialNames}
          dictionaries={{ auth, common }}
          signOutLabel={shellMessages.signOut}
          signOutPendingLabel={shellMessages.signOutPending}
          action={action}
        />
      </div>
    </AuthScreen>
  );
};

export default RegisterPage;
