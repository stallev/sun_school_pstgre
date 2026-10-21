"use client";

import { USER_ROLE } from "@sunschool/domain";
import { ShellMessagesProvider } from "@/components/shell/shell-messages-provider.client";
import { ShellNavigation } from "@/components/shell/shell-navigation.client";
import { UserMenu } from "@/components/shell/user-menu";
import type { ResolvedNavItem } from "@/lib/shell/nav-resolver";
import type { ShellMessages } from "@/lib/messages/shell-messages";
import type { ShellScreenTitles } from "@/lib/shell/shell-screen-title";
import { MatrixCell } from "./MatrixCell";

const LAB_SCREEN_TITLES: ShellScreenTitles = {
  today: "Today",
  lessons: "Lessons",
  lesson: "Lesson",
  lessonTable: "Lesson table",
  lessonForm: "Lesson form",
  check: "Homework check",
  analytics: "Analytics",
  pupil: "Pupil",
  group: "Group",
  bricks: "Bricks",
  rating: "Rating",
  calendar: "Calendar",
  verses: "Verses",
  school: "School",
  users: "Users",
  approvals: "Approvals",
  people: "People",
  deletions: "Deletions",
  groups: "Groups",
  groupEdit: "Edit group",
  year: "School year",
  audit: "Audit log",
  settings: "Settings",
  profile: "Profile",
  userProfile: "User profile",
};

const LAB_SHELL_MESSAGES: ShellMessages = {
  skipToContent: "Skip to content",
  brand: "Sunday School",
  menu: "Menu",
  openMenu: "Open menu",
  close: "Close",
  mainNav: "Main navigation",
  profile: "Profile",
  signOut: "Sign out",
  signOutPending: "Signing out…",
  userMenu: "Account menu",
  displayNameFallback: "User",
  forbiddenHome: "Go to home",
  badgeInQueue: "{count} in queue",
  devViewAs: "View as",
  devRoleAdmin: "Administrator",
  devRoleTeacher: "Teacher",
  roleNameAdmin: "Administrator",
  roleNameTeacher: "Teacher",
  screenTitles: LAB_SCREEN_TITLES,
};

const SAMPLE_NAV: ResolvedNavItem[] = [
  { key: "today", label: "Today", href: "/today" },
  {
    key: "lessons",
    label: "Lessons",
    children: [
      { key: "lessons-all", label: "All lessons", href: "/lessons" },
      { key: "check", label: "Homework check", href: "/check" },
    ],
  },
];

export const ShellMatrix = () => (
  <ShellMessagesProvider messages={LAB_SHELL_MESSAGES}>
    <div className="grid gap-3">
      <MatrixCell label="TopNav + NavDrawer (teacher sample)">
        <div className="rounded-xl border border-line bg-surface p-2">
          <ShellNavigation
            shellRole={USER_ROLE.TEACHER}
            navItems={SAMPLE_NAV}
            badgeCounts={{ approvals: 3, peopleGroup: 5 }}
            showDevSwitcher={false}
            displayName="Anna Teacher"
          />
        </div>
      </MatrixCell>
      <MatrixCell label="UserMenu">
        <UserMenu displayName="Anna Teacher" />
      </MatrixCell>
    </div>
  </ShellMessagesProvider>
);
