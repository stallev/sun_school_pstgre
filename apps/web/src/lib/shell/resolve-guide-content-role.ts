import { USER_ROLE, type UserRole } from "@sunschool/domain";

import type { GuideContentRole } from "@/lib/guide/guide-content-types";
import { resolveViewAsRole } from "@/lib/shell/view-as-cookie";

/** Instruction text role: shell role or admin «view as» preview (teacher/admin/parent only). */
export const resolveGuideContentRole = (
  cookieValue: string | undefined,
  shellRole: UserRole,
): GuideContentRole => {
  const effectiveRole = resolveViewAsRole(cookieValue, shellRole);
  if (effectiveRole === USER_ROLE.PARENT) return "parent";
  if (effectiveRole === USER_ROLE.ADMIN) return "admin";
  return "teacher";
};
