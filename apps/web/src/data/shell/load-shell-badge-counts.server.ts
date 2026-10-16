import "server-only";
import * as Sentry from "@sentry/nextjs";
import { getNavBadgeCounts } from "@/data/shell/get-nav-badge-counts.server";
import type { PolicySessionContext } from "@sunschool/policy-server";

export const loadShellBadgeCounts = async (context: PolicySessionContext) => {
  try {
    return await getNavBadgeCounts(context);
  } catch (error) {
    Sentry.captureException(error);
    return {};
  }
};
