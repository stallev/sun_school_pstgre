import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ACCOUNT_STATUS } from "@sunschool/domain";
import { homeRouteFor } from "@sunschool/policy-edge";
import { AuthSignOutLink } from "@/components/auth/AuthSignOutLink.client";
import { PendingRefreshButton } from "@/components/auth/PendingRefreshButton.client";
import { PendingSubmittedToast } from "@/components/auth/PendingSubmittedToast.client";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { PendingStatusSteps } from "@/components/auth/PendingStatusSteps";
import { ContentText, Heading } from "@/components/atoms";
import { CustomLink } from "@/components/ui/custom-link";
import { Banner } from "@/components/patterns/Banner";
import { loadPendingPageContext } from "@/data/access/load-pending-context.server";
import { requireSession } from "@/lib/auth/require-user";
import { loadSessionPolicyContext } from "@/lib/auth/load-session-policy.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { pickAuthMessages } from "@/lib/messages/auth-messages";
import { pickShellMessages } from "@/lib/messages/shell-messages";
import { getDictionary } from "@/lib/messages/get-dictionary";

export const instant = false;

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Pending",
};

const PendingPage = async () => {
  await requireSession();
  const policy = await loadSessionPolicyContext();
  if (!policy) redirect("/login");

  const pending = await loadPendingPageContext(policy.userId);
  if (!pending) {
    redirect(homeRouteFor(policy.status, policy.roles));
  }

  const locale = await getUiLocale();
  const [common, auth] = await Promise.all([getDictionary(locale, "common"), getDictionary(locale, "auth")]);
  const authMessages = pickAuthMessages(auth);
  const shellMessages = pickShellMessages(common);

  const title =
    pending.status === ACCOUNT_STATUS.REJECTED
      ? authMessages.pending.titleRejected
      : authMessages.pending.titlePending;

  const submittedLabel = pending.submittedAt
    ? new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(pending.submittedAt))
    : null;

  return (
    <AuthScreen variant="reading">
      <div className="space-y-6">
        <Suspense fallback={null}>
          <PendingSubmittedToast message={authMessages.register.toastSubmitted} />
        </Suspense>
        <header className="flex items-start justify-between gap-3">
          <Heading>{title}</Heading>
          <AuthSignOutLink
            signOutLabel={shellMessages.signOut}
            signOutPendingLabel={shellMessages.signOutPending}
          />
        </header>

        <ContentText>{pending.displayName}</ContentText>
        {submittedLabel ? (
          <ContentText tone="muted" className="text-muted-foreground">{submittedLabel}</ContentText>
        ) : null}

        {pending.rejectReason ? (
          <Banner tone="error" title={authMessages.pending.titleRejected}>
            <ContentText>{pending.rejectReason}</ContentText>
          </Banner>
        ) : null}

        <PendingStatusSteps
          stepSignIn={authMessages.pending.stepSignIn}
          stepConsent={authMessages.pending.stepConsent}
          stepConsentVersion={pending.consentVersion}
          stepReview={authMessages.pending.stepReview}
          stepAfterApprove={authMessages.pending.stepAfterApprove}
        />

        <div className="flex flex-col gap-3">
          <PendingRefreshButton />
          {pending.status === ACCOUNT_STATUS.REJECTED ? (
            <CustomLink href="/register" className="text-center">
              {authMessages.pending.fixAndResubmit}
            </CustomLink>
          ) : null}
          <CustomLink href="/profile" className="text-center">
            {authMessages.pending.profile}
          </CustomLink>
        </div>
      </div>
    </AuthScreen>
  );
};

export default PendingPage;
