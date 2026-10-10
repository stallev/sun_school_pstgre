import { USER_ROLE, type UserRole } from "@pulse/domain";

import type { Messages } from "@/lib/messages/types";

export type NavBadgeKey =
  | "pendingTrainers"
  | "openComplaints"
  | "pendingRefunds";

export type NavIconKey =
  | "home"
  | "search"
  | "calendar"
  | "user"
  | "dumbbell"
  | "users"
  | "dollar"
  | "shield"
  | "flag"
  | "refresh"
  | "star";

/** Serializable nav item — safe to pass from RSC layouts to client nav. */
export type NavItemConfig = {
  label: string;
  href: string;
  iconKey: NavIconKey;
  badgeKey?: NavBadgeKey;
};

export type AdminNavBadges = Partial<Record<NavBadgeKey, number>>;

function buildClientNav(messages: Messages): NavItemConfig[] {
  return [
    {
      label: messages.nav.client.home,
      href: "/client/dashboard",
      iconKey: "home",
    },
    {
      label: messages.nav.client.trainers,
      href: "/trainers",
      iconKey: "search",
    },
    {
      label: messages.nav.client.sessions,
      href: "/client/bookings",
      iconKey: "calendar",
    },
    {
      label: messages.nav.client.profile,
      href: "/client/profile",
      iconKey: "user",
    },
  ];
}

function buildTrainerNav(messages: Messages): NavItemConfig[] {
  return [
    {
      label: messages.nav.trainer.today,
      href: "/trainer/dashboard",
      iconKey: "home",
    },
    {
      label: messages.nav.trainer.schedule,
      href: "/trainer/schedule",
      iconKey: "calendar",
    },
    {
      label: messages.nav.trainer.services,
      href: "/trainer/services",
      iconKey: "dumbbell",
    },
    {
      label: messages.nav.trainer.clients,
      href: "/trainer/clients",
      iconKey: "users",
    },
    {
      label: messages.nav.trainer.income,
      href: "/trainer/income",
      iconKey: "dollar",
    },
  ];
}

function buildAdminNav(messages: Messages): NavItemConfig[] {
  return [
    {
      label: messages.nav.admin.overview,
      href: "/admin/dashboard",
      iconKey: "home",
    },
    {
      label: messages.nav.admin.trainers,
      href: "/admin/trainers",
      iconKey: "shield",
      badgeKey: "pendingTrainers",
    },
    {
      label: messages.nav.admin.complaints,
      href: "/admin/complaints",
      iconKey: "flag",
      badgeKey: "openComplaints",
    },
    {
      label: messages.nav.admin.refunds,
      href: "/admin/refunds",
      iconKey: "refresh",
      badgeKey: "pendingRefunds",
    },
    {
      label: messages.nav.admin.reviews,
      href: "/admin/reviews",
      iconKey: "star",
    },
  ];
}

export function getNavItems(role: UserRole, messages: Messages): NavItemConfig[] {
  switch (role) {
    case USER_ROLE.CLIENT:
      return buildClientNav(messages);
    case USER_ROLE.TRAINER:
      return buildTrainerNav(messages);
    case USER_ROLE.ADMIN:
      return buildAdminNav(messages);
    default:
      return [];
  }
}

export function getNavSectionTitle(role: UserRole, messages: Messages): string {
  switch (role) {
    case USER_ROLE.CLIENT:
      return messages.shell.sectionClient;
    case USER_ROLE.TRAINER:
      return messages.shell.sectionTrainer;
    case USER_ROLE.ADMIN:
      return messages.shell.sectionAdmin;
    default:
      return "";
  }
}

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/trainers") {
    return pathname === "/trainers" || pathname.startsWith("/trainers/");
  }

  if (href.endsWith("/dashboard")) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function resolveBadgeCount(
  badgeKey: NavBadgeKey | undefined,
  badges: AdminNavBadges | undefined,
): number {
  if (!badgeKey || !badges) {
    return 0;
  }

  return badges[badgeKey] ?? 0;
}
