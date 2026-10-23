import { connection } from "next/server";
import { notFound } from "next/navigation";
import { USER_ROLE } from "@sunschool/domain";
import { AchievementsCatalogBoard } from "@/components/achievements/AchievementsCatalogBoard.client";
import { ForbiddenState } from "@/components/patterns/ForbiddenState";
import { CustomLink } from "@/components/ui/custom-link";
import { readFeaturesAchievementsEnabled } from "@/data/achievements/achievement-feature.server";
import { loadAchievementsCatalogPage } from "@/data/achievements/load-achievements-catalog-page.server";
import { requireActiveUser } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { pickAchievementsCatalogMessages } from "@/lib/messages/pick-achievements-catalog-messages.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";

export const AchievementsPageContent = async () => {
  await connection();
  const context = await requireActiveUser();
  const locale = await getUiLocale();
  const [adminDict, commonDict] = await Promise.all([
    getDictionary(locale, "admin"),
    getDictionary(locale, "common"),
  ]);
  const messages = pickAchievementsCatalogMessages(adminDict, commonDict);
  const dictionaries = { admin: adminDict, common: commonDict };

  if (!context.roles.includes(USER_ROLE.ADMIN)) {
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
  const flagOn = await prisma.$transaction((tx) => readFeaturesAchievementsEnabled(tx));
  if (!flagOn) notFound();

  const catalog = await loadAchievementsCatalogPage(prisma);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 lg:py-8">
      <AchievementsCatalogBoard
        rewards={catalog.rewards}
        penalties={catalog.penalties}
        messages={messages}
        dictionaries={dictionaries}
      />
    </div>
  );
};
