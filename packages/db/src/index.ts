export { createPrismaClient } from "./client";
export type { PrismaClient } from "./client";
export { Prisma } from "./generated/prisma/client";
export {
  assertDbEnvironment,
  decideEnvGuard,
  DB_ENVIRONMENT_SETTING_KEY,
  EnvGuardError,
  ENV_GUARD_REFUSAL,
} from "./env-guard";
export type { DbEnvironment, EnvGuardDecision } from "./env-guard";
export { writeAudit } from "./audit/write-audit";
export type { AuditEntry } from "./audit/write-audit";
export { reassignAuditActorsForUserMerge } from "./audit/reassign-audit-actors-for-merge";
export { getDummyPasswordHash, hashPassword, verifyPassword } from "./auth/password";
export {
  DELETION_PRIVILEGED_CONTEXT_REQUIRED,
  DELETION_PRIVILEGED_GUC,
  DELETION_PRIVILEGED_SQL_FUNCTIONS,
} from "./deletion/constants";
export { deleteBrickLedgerForPupilPrivileged } from "./deletion/delete-brick-ledger-for-pupil";
export {
  setDeletionPrivilegedContext,
  withDeletionPrivilegedContext,
} from "./deletion/privileged-context";
export { scrubAuditLogForPupilPrivileged } from "./deletion/scrub-audit-log-for-pupil";
export { scrubAuditLogForUserPrivileged } from "./deletion/scrub-audit-log-for-user";
export {
  createYearSnapshots,
  createYearSnapshotsOnClose,
  type CreateYearSnapshotsResult,
  type YearSnapshotCacheTargets,
} from "./analytics/create-year-snapshots";
export { ensureYearSnapshots } from "./analytics/ensure-year-snapshots";
export {
  computeGroupYearSnapshotMetrics,
  computePupilYearSnapshotMetrics,
  metricsToGroupSnapshotRow,
  metricsToPupilSnapshotRow,
  type PupilYearSnapshotMetrics,
} from "./analytics/compute-year-snapshots";
