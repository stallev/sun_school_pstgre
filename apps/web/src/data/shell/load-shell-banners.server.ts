import "server-only";
import { ACADEMIC_YEAR_STATUS, USER_ROLE } from "@sunschool/domain";
import { getDefaultOrganizationId } from "@/data/access/get-organization-id.server";
import { resolveShellRole } from "@/lib/shell/nav-resolver";
import type { PolicySessionContext } from "@sunschool/policy-server";
import { getPrisma } from "@/lib/db.server";

const APP_SETTING_SCHOOL_TIMEZONE_KEY = "school_timezone";

export type ShellBannerView = {
  tone: "warning" | "info";
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
};

export type ShellBannerCopy = {
  noActiveYearTitle: string;
  noActiveYearDescriptionAdmin: string;
  noActiveYearDescriptionTeacher: string;
  createYearAction: string;
  timezoneUnsetTitle: string;
  timezoneUnsetDescription: string;
  chooseTimezoneAction: string;
};

export async function loadShellBanners(
  context: PolicySessionContext,
  copy: ShellBannerCopy,
): Promise<ShellBannerView[]> {
  const role = resolveShellRole(context.roles);
  const db = await getPrisma();
  const organizationId = await getDefaultOrganizationId(db);
  const banners: ShellBannerView[] = [];

  const activeYear = await db.academicYear.findFirst({
    where: { organizationId, status: ACADEMIC_YEAR_STATUS.ACTIVE },
    select: { id: true },
  });

  if (!activeYear) {
    banners.push({
      tone: "warning",
      title: copy.noActiveYearTitle,
      description:
        role === USER_ROLE.ADMIN
          ? copy.noActiveYearDescriptionAdmin
          : copy.noActiveYearDescriptionTeacher,
      ...(role === USER_ROLE.ADMIN
        ? { actionHref: "/year", actionLabel: copy.createYearAction }
        : {}),
    });
  }

  if (role === USER_ROLE.ADMIN) {
    const timezoneRow = await db.appSetting.findUnique({
      where: { key: APP_SETTING_SCHOOL_TIMEZONE_KEY },
      select: { value: true },
    });
    const hasTimezone =
      typeof timezoneRow?.value === "string" && timezoneRow.value.trim() !== "";
    if (!hasTimezone) {
      banners.push({
        tone: "warning",
        title: copy.timezoneUnsetTitle,
        description: copy.timezoneUnsetDescription,
        actionHref: "/settings",
        actionLabel: copy.chooseTimezoneAction,
      });
    }
  }

  return banners;
}
