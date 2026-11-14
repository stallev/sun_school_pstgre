import { connection } from "next/server";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { USER_ROLE } from "@sunschool/domain";

import { GuideSectionBlock } from "@/components/guide/GuideSectionBlock";
import { GuideToc } from "@/components/guide/GuideToc";
import { PageHeader } from "@/components/patterns/PageHeader";
import { PageSection } from "@/components/ui/page-section";
import { readFeaturesParentsEnabled } from "@/data/families/family-feature.server";
import { readProductFeatureFlags } from "@/data/shell/read-product-feature-flags.server";
import { requireRole } from "@/lib/auth/require-user";
import { buildGuideTocGroups } from "@/lib/guide/build-guide-toc-groups";
import { filterGuideSections } from "@/lib/guide/filter-guide-sections";
import type { GuideDictionary } from "@/lib/guide/guide-content-types";
import { getPrisma } from "@/lib/db.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";
import { resolveGuideContentRole } from "@/lib/shell/resolve-guide-content-role";
import { resolveShellRole } from "@/lib/shell/nav-resolver";
import { VIEW_AS_COOKIE_NAME } from "@/lib/shell/view-as-cookie";

export const GuidePageContent = async () => {
  await connection();
  const actor = await requireRole(USER_ROLE.ADMIN, USER_ROLE.TEACHER, USER_ROLE.PARENT);
  const locale = await getUiLocale();
  const prisma = await getPrisma();

  if (actor.roles.includes(USER_ROLE.PARENT)) {
    const parentsEnabled = await readFeaturesParentsEnabled(prisma);
    if (!parentsEnabled) notFound();
  }

  const cookieStore = await cookies();
  const contentRole = resolveGuideContentRole(
    cookieStore.get(VIEW_AS_COOKIE_NAME)?.value,
    resolveShellRole(actor.roles),
  );

  const [guideDict, commonDict, flags] = await Promise.all([
    getDictionary(locale, "guide"),
    getDictionary(locale, "common"),
    readProductFeatureFlags(prisma),
  ]);

  const guide = guideDict as unknown as GuideDictionary;
  const sections = filterGuideSections(guide.roles[contentRole].sections, {
    achievementsEnabled: flags.achievementsEnabled,
    parentsEnabled: flags.parentsEnabled,
  });

  const pageTitle = getMessage(commonDict, "shell.titles.guide");

  return (
    <PageSection width="form" className="flex flex-col gap-section">
      <PageHeader title={pageTitle} />
      <GuideToc
        heading={guide.tocHeading}
        jumpLabel={guide.tocJump}
        groups={buildGuideTocGroups(sections, guide.roles[contentRole].tocGroups)}
      />
      <div className="flex flex-col gap-section">
        {sections.map((section) => (
          <GuideSectionBlock key={section.id} section={section} />
        ))}
      </div>
    </PageSection>
  );
};
