import type { Metadata } from "next";
import { Suspense } from "react";
import { ACCOUNT_STATUS, USER_ROLE } from "@sunschool/domain";
import { AuthSignOutLink } from "@/components/auth/AuthSignOutLink.client";
import { LinkedIdentityRow } from "@/components/auth/LinkedIdentityRow";
import { ProfileDeletionPanel } from "@/components/auth/ProfileDeletionPanel.client";
import { ProfileLinkToast } from "@/components/auth/ProfileLinkToast.client";
import { ProfileNameForm } from "@/components/auth/ProfileNameForm.client";
import { ContentText } from "@/components/atoms";
import { CustomLink } from "@/components/ui/custom-link";
import { FormSection } from "@/components/patterns/FormSection";
import { PageHeader } from "@/components/patterns/PageHeader";
import { PageSection } from "@/components/ui/page-section";
import { loadOwnProfile } from "@/data/access/load-own-profile.server";
import { loadOwnDeletionRequest } from "@/data/deletions/load-own-deletion-request.server";
import { requireSession } from "@/lib/auth/require-user";
import { loadSessionPolicyContext } from "@/lib/auth/load-session-policy.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { pickAuthMessages } from "@/lib/messages/auth-messages";
import { pickShellMessages } from "@/lib/messages/shell-messages";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";
import { getPrisma } from "@/lib/db.server";

export const instant = false;

export const generateMetadata = async (): Promise<Metadata> => {
  const locale = await getUiLocale();
  const common = await getDictionary(locale, "common");
  const pageTitle = getMessage(common, "shell.titles.profile");
  return {
    robots: { index: false, follow: false },
    title: pageTitle,
  };
};

const formatProfileSubtitle = (
  profile: Awaited<ReturnType<typeof loadOwnProfile>>,
  messages: ReturnType<typeof pickAuthMessages>,
): string => {
  if (profile.roles.length > 0) {
    const labels = profile.roles.map((role) =>
      role === USER_ROLE.ADMIN ? messages.profile.roleAdmin : messages.profile.roleTeacher,
    );
    return messages.profile.rolesLabel.replace("{roles}", labels.join(", "));
  }
  const statusLabel =
    profile.status === ACCOUNT_STATUS.ACTIVE
      ? messages.profile.statusActive
      : profile.status === ACCOUNT_STATUS.REQUEST_PENDING
        ? messages.profile.statusRequestPending
        : messages.profile.statusRejected;
  return messages.profile.statusLabel.replace("{status}", statusLabel);
};

const ProfilePage = async () => {
  const { uid } = await requireSession();
  const policy = await loadSessionPolicyContext();
  const prisma = await getPrisma();
  const profile = await loadOwnProfile(prisma, uid);
  const openDeletionRequest = await loadOwnDeletionRequest(prisma, uid);

  const locale = await getUiLocale();
  const [authDict, common] = await Promise.all([getDictionary(locale, "auth"), getDictionary(locale, "common")]);
  const authMessages = pickAuthMessages(authDict);
  const shellMessages = pickShellMessages(common);
  const dictionaries = { auth: authDict, common };

  const consentDate =
    profile.consentAcceptedAt
      ? new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-GB", { dateStyle: "medium" }).format(
          new Date(profile.consentAcceptedAt),
        )
      : null;

  const consentLine =
    profile.consentVersion && consentDate
      ? authMessages.profile.consentLine
          .replace("{version}", profile.consentVersion)
          .replace("{date}", consentDate)
      : null;

  const localeLabel = locale === "ru" ? authMessages.profile.localeRu : authMessages.profile.localeEn;
  const uiLocaleLine = authMessages.profile.uiLocaleValue.replace("{locale}", localeLabel);

  const isAuthChrome =
    policy?.status === ACCOUNT_STATUS.REQUEST_PENDING || policy?.status === ACCOUNT_STATUS.REJECTED;

  const shellProfile = !isAuthChrome;

  const rolesOrStatusLine = formatProfileSubtitle(profile, authMessages);

  return (
    <main className={shellProfile ? "space-y-4" : "space-y-8"}>
      <Suspense fallback={null}>
        <ProfileLinkToast />
      </Suspense>

      {isAuthChrome ? (
        <header className="flex items-start justify-between gap-3">
          <CustomLink href="/pending">{authMessages.profile.backToPending}</CustomLink>
          <AuthSignOutLink
            signOutLabel={shellMessages.signOut}
            signOutPendingLabel={shellMessages.signOutPending}
          />
        </header>
      ) : null}

      <PageSection width={shellProfile ? "wide" : "full"} className="space-y-4">
        <PageHeader title={authMessages.profile.title} description={shellProfile ? undefined : rolesOrStatusLine} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
        <div className="h-full [&>section]:h-full">
          <FormSection title={authMessages.profile.nameSection}>
            <ProfileNameForm
              initialNames={{
                lastName: profile.lastName,
                firstName: profile.firstName,
                middleName: profile.middleName,
              }}
              dictionaries={dictionaries}
              metaLines={
                <>
                  <ContentText tone="secondary" className="text-sm">{rolesOrStatusLine}</ContentText>
                  <ContentText tone="secondary" className="text-sm">{uiLocaleLine}</ContentText>
                </>
              }
            />
          </FormSection>
        </div>

        <div className="h-full [&>section]:flex [&>section]:h-full [&>section]:flex-col">
          <FormSection title={authMessages.profile.identitiesSection} description={authMessages.profile.identitiesHint}>
            <ul className="divide-y divide-line">
              {profile.identities.map((identity) => (
                <LinkedIdentityRow key={identity.provider} identity={identity} dictionaries={dictionaries} />
              ))}
            </ul>
            {consentLine ? (
              <ContentText tone="secondary" className="text-sm">
                {consentLine}
              </ContentText>
            ) : null}
            {shellProfile ? (
              <AuthSignOutLink
                signOutLabel={shellMessages.signOut}
                signOutPendingLabel={shellMessages.signOutPending}
              />
            ) : null}
          </FormSection>
        </div>

        <div className="lg:col-span-2">
          <FormSection title={authMessages.profile.deletionSection}>
            <ProfileDeletionPanel
              openRequest={openDeletionRequest}
              locale={locale}
              dictionaries={dictionaries}
            />
          </FormSection>
        </div>
        </div>
      </PageSection>
    </main>
  );
};

export default ProfilePage;
