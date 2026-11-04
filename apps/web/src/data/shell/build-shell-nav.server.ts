import "server-only";
import { USER_ROLE, type UserRole } from "@sunschool/domain";
import { readFeaturesAchievementsEnabled } from "@/data/achievements/achievement-feature.server";
import { readFeaturesParentsEnabled } from "@/data/families/family-feature.server";
import { getPrisma } from "@/lib/db.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";
import type { MessageLocale } from "@/lib/messages/get-dictionary";
import {
  applyPreviewNavAccess,
  countReachableNavLeaves,
} from "@/lib/shell/filter-nav-by-route-access";
import {
  isResolvedNavGroup,
  resolveNavItems,
  resolveShellRole,
  type ResolvedNavItem,
} from "@/lib/shell/nav-resolver";
import type { PolicySessionContext } from "@sunschool/policy-server";

const stripFeatureNavItems = (
  items: ResolvedNavItem[],
  keys: readonly string[],
): ResolvedNavItem[] =>
  items.map((entry) => {
    if (!isResolvedNavGroup(entry)) return entry;
    return {
      ...entry,
      children: entry.children.filter((child) => !keys.includes(child.key)),
    };
  });

export type ShellNavPayload = {
  shellRole: UserRole;
  viewAsRole: UserRole;
  navItems: ResolvedNavItem[];
  previewNavItems?: ResolvedNavItem[];
  previewNavEmptyHint?: string;
  showDevSwitcher: boolean;
};

export const buildShellNav = async (
  context: PolicySessionContext,
  locale: MessageLocale,
  options: { appEnv: "dev" | "prod"; viewAsRole: UserRole },
): Promise<ShellNavPayload> => {
  const common = await getDictionary(locale, "common");
  const getLabel = (messageKey: string) => getMessage(common, messageKey);

  const shellRole = resolveShellRole(context.roles);
  const prisma = await getPrisma();
  const [achievementsEnabled, parentsEnabled] = await Promise.all([
    readFeaturesAchievementsEnabled(prisma),
    readFeaturesParentsEnabled(prisma),
  ]);
  const stripKeys: string[] = [];
  if (!achievementsEnabled) stripKeys.push("achievements");
  if (!parentsEnabled) stripKeys.push("family", "child", "child-data");
  let navItems = resolveNavItems(shellRole, getLabel);
  if (stripKeys.length > 0) navItems = stripFeatureNavItems(navItems, stripKeys);
  if (!parentsEnabled && shellRole === USER_ROLE.PARENT) navItems = [];

  const isAdmin = context.roles.includes(USER_ROLE.ADMIN);
  const showDevSwitcher = options.appEnv === "dev" && isAdmin;
  const viewAsRole = options.viewAsRole;

  let previewNavItems: ResolvedNavItem[] | undefined;
  let previewNavEmptyHint: string | undefined;
  if (viewAsRole !== shellRole) {
    const previewRole = viewAsRole === USER_ROLE.TEACHER ? USER_ROLE.TEACHER : USER_ROLE.ADMIN;
    let previewItems = resolveNavItems(previewRole, getLabel);
    if (stripKeys.length > 0) previewItems = stripFeatureNavItems(previewItems, stripKeys);
    previewItems = applyPreviewNavAccess(previewItems, context.roles);
    previewNavItems = previewItems;
    if (countReachableNavLeaves(previewItems) === 0 && previewRole === USER_ROLE.TEACHER) {
      previewNavEmptyHint = getMessage(common, "shell.preview_nav_empty_teacher");
    }
  } else if (showDevSwitcher) {
    let teacherPreview = resolveNavItems(USER_ROLE.TEACHER, getLabel);
    if (stripKeys.length > 0) teacherPreview = stripFeatureNavItems(teacherPreview, stripKeys);
    previewNavItems = applyPreviewNavAccess(teacherPreview, context.roles);
  }

  return {
    shellRole,
    viewAsRole,
    navItems,
    previewNavItems,
    previewNavEmptyHint,
    showDevSwitcher,
  };
};
