import { USER_ROLE } from "@sunschool/domain";
import { PageHeader } from "@/components/patterns/PageHeader";
import { ContentText } from "@/components/atoms/ContentText";
import { runAdminLazyPurge } from "@/data/access/admin-lazy-purge.server";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";

const ApprovalsPage = async () => {
  await requireRole(USER_ROLE.ADMIN);
  await runAdminLazyPurge(await getPrisma(), new Date());

  const locale = await getUiLocale();
  const common = await getDictionary(locale, "common");

  return (
    <div className="space-y-6">
      <PageHeader title={getMessage(common, "shell.nav.approvals")} />
      <ContentText tone="secondary">Scaffold — approval list lands in P01-CU10.</ContentText>
    </div>
  );
};

export default ApprovalsPage;
