import "server-only";
import {
  ACCESS_REQUEST_STATUS,
  DELETION_REQUEST_STATUS,
  USER_ROLE,
} from "@sunschool/domain";
import type { NavBadgeSlotId } from "@/components/shell/nav-config";
import { NAV_BADGE_SLOT } from "@/components/shell/nav-config";
import { resolveShellRole } from "@/lib/shell/nav-resolver";
import type { PolicySessionContext } from "@sunschool/policy-server";
import { getPrisma } from "@/lib/db.server";

export type NavBadgeCounts = Partial<Record<NavBadgeSlotId, number>>;

export async function getNavBadgeCounts(context: PolicySessionContext): Promise<NavBadgeCounts> {
  if (resolveShellRole(context.roles) !== USER_ROLE.ADMIN) {
    return {};
  }

  const db = await getPrisma();
  const [pendingRequests, openDeletions] = await Promise.all([
    db.accessRequest.count({ where: { status: ACCESS_REQUEST_STATUS.PENDING } }),
    db.deletionRequest.count({
      where: {
        status: { in: [DELETION_REQUEST_STATUS.NEW, DELETION_REQUEST_STATUS.IN_PROGRESS] },
      },
    }),
  ]);

  const peopleGroup = pendingRequests + openDeletions;
  const counts: NavBadgeCounts = {};
  if (pendingRequests > 0) counts[NAV_BADGE_SLOT.APPROVALS] = pendingRequests;
  if (peopleGroup > 0) counts[NAV_BADGE_SLOT.PEOPLE_GROUP] = peopleGroup;
  return counts;
}
