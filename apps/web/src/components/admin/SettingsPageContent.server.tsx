import { connection } from "next/server";
import { USER_ROLE } from "@sunschool/domain";
import { SettingsLanguageForm } from "@/components/admin/SettingsLanguageForm";
import { TimezonePicker } from "@/components/admin/TimezonePicker";
import { AdminMessagesProvider } from "@/components/admin/admin-messages-provider.client";
import { PageHeader } from "@/components/patterns/PageHeader";
import { PageSection } from "@/components/ui/page-section";
import { ContentText } from "@/components/atoms/ContentText";
import { requireRole } from "@/lib/auth/require-user";
import { getSchoolTimezoneUncached } from "@/lib/i18n/get-school-timezone.server";
import { getUiLocale, getUiLocaleUncached } from "@/lib/i18n/get-ui-locale.server";
import { listIanaTimeZoneOptions } from "@/lib/i18n/iana-timezone-options.server";
import { pickAdminMessages } from "@/lib/messages/pick-admin-messages.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";

export const SettingsPageContent = async () => {
  await connection();
  await requireRole(USER_ROLE.ADMIN);
  const locale = await getUiLocale();
  const [adminDict, commonDict, currentLocale, currentTimeZone, timeZoneOptions] = await Promise.all([
    getDictionary(locale, "admin"),
    getDictionary(locale, "common"),
    getUiLocaleUncached(),
    getSchoolTimezoneUncached(),
    Promise.resolve(listIanaTimeZoneOptions()),
  ]);
  const adminMessages = pickAdminMessages(adminDict);
  const dictionaries = { admin: adminDict, common: commonDict };
  const formError = getMessage(commonDict, "errors.form");

  return (
    <AdminMessagesProvider messages={adminMessages}>
      <PageSection width="wide" className="min-w-0 space-y-6 overflow-x-hidden">
        <PageHeader
          title={adminMessages.page.settingsTitle}
          description={adminMessages.settings.pageSubtitle}
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-start">
          <SettingsLanguageForm
            currentLocale={currentLocale}
            dictionaries={dictionaries}
            formError={formError}
          />
          <TimezonePicker
            currentTimeZone={currentTimeZone}
            timeZoneOptions={timeZoneOptions}
            dictionaries={dictionaries}
            formError={formError}
          />
        </div>
        <ContentText tone="muted" className="text-sm">
          {adminMessages.settings.footerNote}
        </ContentText>
      </PageSection>
    </AdminMessagesProvider>
  );
};

