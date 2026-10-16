import "server-only";
import { USER_ROLE, type UserRole } from "@sunschool/domain";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";
import type { MessageLocale } from "@/lib/messages/get-dictionary";
import { resolveNavItems, resolveShellRole, type ResolvedNavItem } from "@/lib/shell/nav-resolver";
import type { PolicySessionContext } from "@sunschool/policy-server";

export type ShellNavPayload = {
  shellRole: UserRole;
  navItems: ResolvedNavItem[];
  previewNavItems?: ResolvedNavItem[];
  showDevSwitcher: boolean;
};

export const buildShellNav = async (
  context: PolicySessionContext,
  locale: MessageLocale,
  options: { appEnv: "dev" | "prod" },
): Promise<ShellNavPayload> => {
  const common = await getDictionary(locale, "common");
  const getLabel = (messageKey: string) => getMessage(common, messageKey);

  const shellRole = resolveShellRole(context.roles);
  const navItems = resolveNavItems(shellRole, getLabel);

  const isAdmin = context.roles.includes(USER_ROLE.ADMIN);
  const showDevSwitcher = options.appEnv === "dev" && isAdmin;
  const previewNavItems =
    showDevSwitcher ? resolveNavItems(USER_ROLE.TEACHER, getLabel) : undefined;

  return { shellRole, navItems, previewNavItems, showDevSwitcher };
};
