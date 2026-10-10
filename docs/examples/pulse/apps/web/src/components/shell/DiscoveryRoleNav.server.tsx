import "server-only";

import { USER_ROLE, type UserRole } from "@pulse/domain";

import { getAdminNavBadges } from "@/data/admin/get-admin-nav-badges.server";
import { getTrainerShellContext } from "@/data/trainer/get-trainer-shell-context.server";
import { getSessionForShell } from "@/lib/auth/get-session-for-shell.server";
import { getMessages } from "@/lib/messages/server";
import {
  getNavItems,
  getNavSectionTitle,
  type AdminNavBadges,
  type NavItemConfig,
} from "@/lib/nav/nav-config";

export type DiscoveryRoleNav = {
  role: UserRole;
  navItems: NavItemConfig[];
  sectionTitle: string;
  badges?: AdminNavBadges;
  showTrainerReviewBanner: boolean;
};

export async function getDiscoveryRoleNav(): Promise<DiscoveryRoleNav | null> {
  const session = await getSessionForShell();
  const role = session?.user?.role;

  if (
    role !== USER_ROLE.CLIENT &&
    role !== USER_ROLE.TRAINER &&
    role !== USER_ROLE.ADMIN
  ) {
    return null;
  }

  const messages = await getMessages();
  const navItems = getNavItems(role, messages);
  const sectionTitle = getNavSectionTitle(role, messages);

  if (role === USER_ROLE.TRAINER) {
    const shellContext = session?.user?.id
      ? await getTrainerShellContext(session.user.id)
      : { showReviewBanner: false };

    return {
      role,
      navItems,
      sectionTitle,
      showTrainerReviewBanner: shellContext.showReviewBanner,
    };
  }

  if (role === USER_ROLE.ADMIN) {
    const badges = await getAdminNavBadges();
    return {
      role,
      navItems,
      sectionTitle,
      badges,
      showTrainerReviewBanner: false,
    };
  }

  return {
    role,
    navItems,
    sectionTitle,
    showTrainerReviewBanner: false,
  };
}
