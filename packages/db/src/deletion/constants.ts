/** PostgreSQL custom setting — must be `1` inside a transaction before privileged deletion SQL runs. */
export const DELETION_PRIVILEGED_GUC = "sunschool.deletion_privileged";

export const DELETION_PRIVILEGED_SQL_FUNCTIONS = {
  DELETE_BRICK_LEDGER_FOR_PUPIL: "sunschool_privileged_delete_brick_ledger_for_pupil",
  SCRUB_AUDIT_LOG_FOR_PUPIL: "sunschool_privileged_scrub_audit_log_for_pupil",
} as const;

export const DELETION_PRIVILEGED_CONTEXT_REQUIRED = "deletion privileged context required";
