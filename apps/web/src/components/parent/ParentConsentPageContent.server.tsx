import { connection } from "next/server";
import { notFound } from "next/navigation";
import { USER_ROLE } from "@sunschool/domain";
import { ParentConsentForm } from "@/components/parent/ParentConsentForm.client";
import { ParentMessagesProvider } from "@/components/parent/ParentMessagesProvider.client";
import { ForbiddenState } from "@/components/patterns/ForbiddenState";
import { PageHeader } from "@/components/patterns/PageHeader";
import { CustomLink } from "@/components/ui/custom-link";
import {
  assertParentPupilAccess,
  loadParentChildOptions,
  resolveParentSelectedPupilId,
} from "@/data/families/parent-child-access.server";
import { readFeaturesParentsEnabled } from "@/data/families/family-feature.server";
import { readChildConsentTextVersion } from "@/data/school/child-consent-text-version.server";
import { getDefaultOrganizationId } from "@/data/access/get-organization-id.server";
import { requireActiveUser } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { pickParentMessagesFromDictionary } from "@/lib/messages/pick-parent-messages.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";
import { isMutationErr } from "@/data/access/access-admin-guards.server";

export type ParentConsentPageProps = {
  searchParams: Promise<{ pupilId?: string }>;
};

export const ParentConsentPageContent = async ({ searchParams }: ParentConsentPageProps) => {
  await connection();
  const context = await requireActiveUser();
  const locale = await getUiLocale();
  const [parentDict, commonDict] = await Promise.all([
    getDictionary(locale, "parent"),
    getDictionary(locale, "common"),
  ]);
  const messages = pickParentMessagesFromDictionary(parentDict);
  const dictionaries = { parent: parentDict, common: commonDict };

  if (!context.roles.includes(USER_ROLE.PARENT)) {
    return (
      <ForbiddenState
        title={getMessage(commonDict, "errors.forbidden_title")}
        description={getMessage(commonDict, "errors.forbidden")}
        action={
          <CustomLink href="/today">{getMessage(commonDict, "shell.forbidden_home")}</CustomLink>
        }
      />
    );
  }

  const prisma = await getPrisma();
  const flagOn = await prisma.$transaction((tx) => readFeaturesParentsEnabled(tx));
  if (!flagOn) notFound();

  const { pupilId: pupilIdParam } = await searchParams;
  const organizationId = await getDefaultOrganizationId(prisma);
  const children = await prisma.$transaction((tx) =>
    loadParentChildOptions(tx, context.userId, organizationId),
  );
  if (children.length === 0) notFound();

  const pupilId = resolveParentSelectedPupilId(children, pupilIdParam ?? null, children[0]!.pupilId);
  if (!pupilId) notFound();
  const pupilOption = children.find((row) => row.pupilId === pupilId);
  if (!pupilOption) notFound();

  const access = await prisma.$transaction((tx) =>
    assertParentPupilAccess(tx, context.userId, pupilId),
  );
  if (isMutationErr(access)) notFound();

  const textVersion = await prisma.$transaction((tx) => readChildConsentTextVersion(tx));

  return (
    <ParentMessagesProvider messages={messages}>
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 md:px-6 lg:py-8">
        <PageHeader title={messages.consent.pageTitle} />
        <ParentConsentForm
          pupilId={pupilId}
          pupilName={pupilOption.displayName}
          textVersion={textVersion}
          fullTextPlaceholder={messages.consent.fullTextPlaceholder}
          dictionaries={dictionaries}
        />
      </div>
    </ParentMessagesProvider>
  );
};
