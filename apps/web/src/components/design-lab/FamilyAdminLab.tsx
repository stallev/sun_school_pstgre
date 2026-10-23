import { FamilyListRow } from "@/components/family/FamilyListRow";
import { ADULT_RELATION } from "@sunschool/domain";
import { getDictionary } from "@/lib/messages/get-dictionary";
import { pickFamilyAdminMessages } from "@/lib/messages/pick-family-admin-messages.server";
import { PageHeader } from "@/components/patterns/PageHeader";

export const FamilyAdminLab = async () => {
  const admin = await getDictionary("ru", "admin");
  const common = await getDictionary("ru", "common");
  const messages = pickFamilyAdminMessages(admin, common);

  const sample = {
    familyId: "00000000-0000-4000-8000-000000000001",
    name: "Мироновы",
    adults: [
      {
        displayName: "Миронова Анна",
        relation: ADULT_RELATION.MOTHER,
        hasAccount: true,
      },
    ],
    children: [
      {
        displayName: "Миронов Пётр",
        groupName: "Старшая",
        lacksConsent: false,
      },
    ],
  };

  return (
    <div className="space-y-4">
      <PageHeader title={messages.pageTitle} description={messages.pageSubtitle} />
      <ul className="overflow-hidden rounded-xl border border-line bg-card divide-y divide-line">
        <FamilyListRow row={sample} messages={messages} />
      </ul>
    </div>
  );
};
