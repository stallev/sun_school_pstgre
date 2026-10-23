import type { Dictionary } from "@/lib/messages/get-dictionary";
import { getMessage } from "@/lib/messages/get-dictionary";
import type { ShellScreenTitleKey, ShellScreenTitles } from "@/lib/shell/shell-screen-title";

const SHELL_SCREEN_TITLE_KEYS: ShellScreenTitleKey[] = [
  "today",
  "lessons",
  "lesson",
  "lessonTable",
  "lessonForm",
  "check",
  "analytics",
  "pupil",
  "group",
  "bricks",
  "rating",
  "calendar",
  "verses",
  "school",
  "users",
  "approvals",
  "people",
  "deletions",
  "groups",
  "groupEdit",
  "year",
  "audit",
  "achievements",
  "settings",
  "profile",
  "userProfile",
];

/** Client-safe shell copy slice (serializable strings only). */
export type ShellMessages = {
  skipToContent: string;
  brand: string;
  menu: string;
  openMenu: string;
  close: string;
  mainNav: string;
  profile: string;
  signOut: string;
  signOutPending: string;
  userMenu: string;
  displayNameFallback: string;
  forbiddenHome: string;
  badgeInQueue: string;
  devViewAs: string;
  devRoleAdmin: string;
  devRoleTeacher: string;
  roleNameAdmin: string;
  roleNameTeacher: string;
  screenTitles: ShellScreenTitles;
};

export const pickShellMessages = (common: Dictionary): ShellMessages => ({
  skipToContent: getMessage(common, "shell.skip_to_content"),
  brand: getMessage(common, "shell.brand"),
  menu: getMessage(common, "shell.menu"),
  openMenu: getMessage(common, "shell.open_menu"),
  close: getMessage(common, "shell.close"),
  mainNav: getMessage(common, "shell.main_nav"),
  profile: getMessage(common, "shell.profile"),
  signOut: getMessage(common, "shell.sign_out"),
  signOutPending: getMessage(common, "shell.sign_out_pending"),
  userMenu: getMessage(common, "shell.user_menu"),
  displayNameFallback: getMessage(common, "shell.display_name_fallback"),
  forbiddenHome: getMessage(common, "shell.forbidden_home"),
  badgeInQueue: getMessage(common, "shell.badge_in_queue"),
  devViewAs: getMessage(common, "shell.dev_view_as"),
  devRoleAdmin: getMessage(common, "shell.dev_role_admin"),
  devRoleTeacher: getMessage(common, "shell.dev_role_teacher"),
  roleNameAdmin: getMessage(common, "shell.role_names.admin"),
  roleNameTeacher: getMessage(common, "shell.role_names.teacher"),
  screenTitles: SHELL_SCREEN_TITLE_KEYS.reduce<ShellScreenTitles>((titles, key) => {
    titles[key] = getMessage(common, `shell.titles.${key}`);
    return titles;
  }, {} as ShellScreenTitles),
});
