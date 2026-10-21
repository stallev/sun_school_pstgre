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
import { CustomLink } from "@/components/ui/custom-link";
import { PageHeader } from "@/components/patterns/PageHeader";
import { loadPendingPageContext } from "@/data/access/load-pending-context.server";
import { requireSession } from "@/lib/auth/require-user";
import { loadSessionPolicyContext } from "@/lib/auth/load-session-policy.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { pickAuthMessages } from "@/lib/messages/auth-messages";
import { pickShellMessages } from "@/lib/messages/shell-messages";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";
import { AlertTriangleIcon } from "lucide-react";

export const instant = false;

export const generateMetadata = async (): Promise<Metadata> => {
  const locale = await getUiLocale();
  const auth = await getDictionary(locale, "auth");
  return {
    robots: { index: false, follow: false },
    title: getMessage(auth, "pending.title_pending"),
  };
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

  const headerDescription =
    pending.status === ACCOUNT_STATUS.REJECTED
      ? pending.displayName
      : submittedLabel
        ? `${pending.displayName} · ${submittedLabel}`
        : pending.displayName;

  return (
    <AuthScreen variant="reading">
      <div className="space-y-6">
        <Suspense fallback={null}>
          <PendingSubmittedToast message={authMessages.register.toastSubmitted} />
        </Suspense>
        <PageHeader
          title={title}
          description={headerDescription}
          actions={
            <AuthSignOutLink
              signOutLabel={shellMessages.signOut}
              signOutPendingLabel={shellMessages.signOutPending}
            />
          }
        />

        {pending.status === ACCOUNT_STATUS.REJECTED ? (
          <section className="max-w-2xl rounded-xl border border-line bg-surface p-4 sm:p-5">
            {pending.rejectReason ? (
              <p className="flex items-start gap-2 text-sm text-ink">
                <AlertTriangleIcon className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden />
                <span>{pending.rejectReason}</span>
              </p>
            ) : null}
            <div className="mt-5 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:flex-wrap">
              <CustomLink href="/register" className="text-center sm:text-left">
                {authMessages.pending.fixAndResubmit}
              </CustomLink>
              <CustomLink href="/profile" className="text-center sm:text-left">
                {authMessages.pending.profile}
              </CustomLink>
            </div>
          </section>
        ) : (
          <>
            <PendingStatusSteps
              stepSignIn={authMessages.pending.stepSignIn}
              stepConsent={authMessages.pending.stepConsent}
              stepConsentVersion={pending.consentVersion}
              stepReview={authMessages.pending.stepReview}
              stepAfterApprove={authMessages.pending.stepAfterApprove}
            />
            <div className="flex max-w-2xl flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:flex-wrap">
              <PendingRefreshButton />
              <CustomLink href="/profile" className="text-center sm:text-left">
                {authMessages.pending.profile}
              </CustomLink>
            </div>
          </>
        )}
      </div>
    </AuthScreen>
  );
};

export default PendingPage;
