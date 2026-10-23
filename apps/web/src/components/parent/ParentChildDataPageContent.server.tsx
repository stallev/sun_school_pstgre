import { connection } from "next/server";
import { notFound } from "next/navigation";
import { USER_ROLE } from "@sunschool/domain";
import { ParentChildDataBoard } from "@/components/parent/ParentChildDataBoard.client";
import { ParentChildSwitcher } from "@/components/parent/ParentChildSwitcher.client";
import { ParentMessagesProvider } from "@/components/parent/ParentMessagesProvider.client";
import { ForbiddenState } from "@/components/patterns/ForbiddenState";
import { PageHeader } from "@/components/patterns/PageHeader";
import { CustomLink } from "@/components/ui/custom-link";
import { loadParentChildDataPage } from "@/data/families/load-parent-child-data.server";
import { requireActiveUser } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { messageLocaleToAppLocale } from "@/lib/i18n/message-locale-to-app-locale";
import { pickParentMessagesFromDictionary } from "@/lib/messages/pick-parent-messages.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";

export type ParentChildDataPageProps = {
  searchParams: Promise<{ pupilId?: string }>;
};

export const ParentChildDataPageContent = async ({ searchParams }: ParentChildDataPageProps) => {
  await connection();
  const context = await requireActiveUser();
  const locale = await getUiLocale();
  const appLocale = messageLocaleToAppLocale(locale);
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

  const { pupilId: pupilIdParam } = await searchParams;
  const data = await loadParentChildDataPage(
    await getPrisma(),
    context.userId,
    pupilIdParam ?? null,
  );

  if (data.kind === "flag_off" || data.kind === "not_found") notFound();

  return (
    <ParentMessagesProvider messages={messages}>
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 md:px-6 lg:py-8">
        <PageHeader title={messages.data.pageTitle} description={messages.data.pageSubtitle} />
        <ParentChildSwitcher
          childOptions={data.children}
          pupilId={data.pupilId}
          label={messages.child.switchLabel}
          basePath="/child/data"
        />
        <ParentChildDataBoard data={data} dictionaries={dictionaries} locale={appLocale} />
      </div>
    </ParentMessagesProvider>
  );
};
