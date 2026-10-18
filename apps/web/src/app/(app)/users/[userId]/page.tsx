import { ACCOUNT_STATUS, USER_ROLE } from "@sunschool/domain";
import { ContentText } from "@/components/atoms";
import { AdminMessagesProvider } from "@/components/admin/admin-messages-provider.client";
import { DisableAccessConfirm } from "@/components/admin/DisableAccessConfirm.client";
import { EnableAccessConfirm } from "@/components/admin/EnableAccessConfirm.client";
import { MergeUsersDialog } from "@/components/admin/MergeUsersDialog.client";
import { UpdateUserNameForm } from "@/components/admin/UpdateUserNameForm.client";
import { UserProfileRoles } from "@/components/admin/UserProfileRoles.client";
import { UserEntityHistoryList } from "@/components/admin/EntityHistoryList";
import { FormSection } from "@/components/patterns/FormSection";
import { PageHeader } from "@/components/patterns/PageHeader";
import { runAdminLazyPurge } from "@/data/access/admin-lazy-purge.server";
import { loadUserProfile } from "@/data/access/load-user-profile.server";
import { formatAccountStatusLabel } from "@/lib/admin/format-account-status-label";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { pickAdminMessages } from "@/lib/messages/pick-admin-messages.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";

type UserProfilePageProps = {
  params: Promise<{ userId: string }>;
};

const UserProfilePage = async ({ params }: UserProfilePageProps) => {
  await requireRole(USER_ROLE.ADMIN);
  const { userId } = await params;
  const prisma = await getPrisma();
  await runAdminLazyPurge(prisma, new Date());

  const locale = await getUiLocale();
  const [adminDict, commonDict] = await Promise.all([
    getDictionary(locale, "admin"),
    getDictionary(locale, "common"),
  ]);
  const adminMessages = pickAdminMessages(adminDict);
  const profile = await loadUserProfile(prisma, userId);

  const dictionaries = { admin: adminDict, common: commonDict };
  const formError = getMessage(commonDict, "errors.form");
  const closeLabel = adminMessages.form.cancel;

  return (
    <AdminMessagesProvider messages={adminMessages}>
      <div className="space-y-8">
        <PageHeader title={profile.displayName} description={adminMessages.page.profileTitle} />
        <FormSection title={adminMessages.users.profileStatus}>
          <ContentText>{formatAccountStatusLabel(profile.status, adminMessages)}</ContentText>
        </FormSection>
        <FormSection title={adminMessages.users.profileLoginMethods}>
          <ul className="space-y-2">
            {profile.identities.map((identity) => (
              <li key={`${identity.provider}-${identity.label}`}>
                <ContentText>{identity.label}</ContentText>
              </li>
            ))}
          </ul>
        </FormSection>
        <FormSection title={adminMessages.users.profileRoles}>
          <UserProfileRoles
            userId={profile.userId}
            initialRoles={profile.roles}
            initialGradeIds={profile.teacherGradeIds}
            grades={profile.activeGrades}
            dictionaries={dictionaries}
            formError={formError}
          />
        </FormSection>
        <FormSection title={adminMessages.users.updateName}>
          <UpdateUserNameForm
            userId={profile.userId}
            initialNames={{
              lastName: profile.lastName,
              firstName: profile.firstName,
              middleName: profile.middleName,
            }}
            dictionaries={dictionaries}
            formError={formError}
          />
        </FormSection>
        <FormSection title={adminMessages.users.profileAuditLink}>
          <UserEntityHistoryList userId={profile.userId} />
        </FormSection>
        <section className="flex flex-wrap gap-2">
          {profile.status === ACCOUNT_STATUS.ACTIVE ? (
            <DisableAccessConfirm
              userId={profile.userId}
              dictionaries={dictionaries}
              formError={formError}
              cancelLabel={closeLabel}
            />
          ) : null}
          {profile.status === ACCOUNT_STATUS.DISABLED ? (
            <EnableAccessConfirm
              userId={profile.userId}
              dictionaries={dictionaries}
              formError={formError}
              cancelLabel={closeLabel}
            />
          ) : null}
          <MergeUsersDialog
            keepUserId={profile.userId}
            dictionaries={dictionaries}
            formError={formError}
            closeLabel={closeLabel}
          />
        </section>
      </div>
    </AdminMessagesProvider>
  );
};

export default UserProfilePage;
