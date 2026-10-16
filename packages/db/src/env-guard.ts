/**
 * Environment guard (INV-24, seed_data_spec §5): `app_setting.db_environment` is written once by
 * `seed:reference` from `APP_ENV` and never overwritten. Every seed command and the application
 * start compare `APP_ENV` with it; a mismatch aborts BEFORE anything is written, so a wrongly
 * copied connection string cannot touch the other environment.
 */
export const DB_ENVIRONMENTS = ["dev", "prod"] as const;
export type DbEnvironment = (typeof DB_ENVIRONMENTS)[number];

export const DB_ENVIRONMENT_SETTING_KEY = "db_environment";

export const ENV_GUARD_REFUSAL = {
  APP_ENV_MISSING: "APP_ENV_MISSING",
  APP_ENV_INVALID: "APP_ENV_INVALID",
  MARKER_MISSING: "MARKER_MISSING",
  MARKER_INVALID: "MARKER_INVALID",
  MARKER_MISMATCH: "MARKER_MISMATCH",
} as const;
export type EnvGuardRefusal = (typeof ENV_GUARD_REFUSAL)[keyof typeof ENV_GUARD_REFUSAL];

export type EnvGuardDecision =
  | { kind: "ok"; environment: DbEnvironment }
  | { kind: "write_marker"; environment: DbEnvironment }
  | { kind: "refuse"; reason: EnvGuardRefusal };

const isDbEnvironment = (value: unknown): value is DbEnvironment =>
  typeof value === "string" && (DB_ENVIRONMENTS as readonly string[]).includes(value);

/**
 * Pure decision. `allowMarkerWrite` is true only for `seed:reference` (the step that records the
 * marker); the application start and the other commands refuse a database without a marker.
 */
export function decideEnvGuard(
  appEnv: string | undefined,
  marker: unknown,
  options: { allowMarkerWrite: boolean },
): EnvGuardDecision {
  if (appEnv === undefined || appEnv === "") {
    return { kind: "refuse", reason: ENV_GUARD_REFUSAL.APP_ENV_MISSING };
  }
  if (!isDbEnvironment(appEnv)) {
    return { kind: "refuse", reason: ENV_GUARD_REFUSAL.APP_ENV_INVALID };
  }
  if (marker === null || marker === undefined) {
    return options.allowMarkerWrite
      ? { kind: "write_marker", environment: appEnv }
      : { kind: "refuse", reason: ENV_GUARD_REFUSAL.MARKER_MISSING };
  }
  if (!isDbEnvironment(marker)) {
    return { kind: "refuse", reason: ENV_GUARD_REFUSAL.MARKER_INVALID };
  }
  if (marker !== appEnv) {
    return { kind: "refuse", reason: ENV_GUARD_REFUSAL.MARKER_MISMATCH };
  }
  return { kind: "ok", environment: appEnv };
}

export class EnvGuardError extends Error {
  readonly reason: EnvGuardRefusal;

  constructor(reason: EnvGuardRefusal) {
    super(`Database environment guard refused: ${reason}`);
    this.name = "EnvGuardError";
    this.reason = reason;
  }
}

/** The smallest Prisma surface the guard needs (works with a client and a transaction client). */
export type EnvGuardReader = {
  appSetting: {
    findUnique(args: { where: { key: string } }): Promise<{ value: unknown } | null>;
  };
};

export async function readDbEnvironmentMarker(db: EnvGuardReader): Promise<unknown> {
  const row = await db.appSetting.findUnique({ where: { key: DB_ENVIRONMENT_SETTING_KEY } });
  return row?.value ?? null;
}

/** Reads the marker and throws `EnvGuardError` unless the decision is `ok` / `write_marker`. */
export async function assertDbEnvironment(
  db: EnvGuardReader,
  appEnv: string | undefined,
  options: { allowMarkerWrite: boolean },
): Promise<EnvGuardDecision & { kind: "ok" | "write_marker" }> {
  // Validate APP_ENV before any query: an unknown environment never touches the database.
  const early = decideEnvGuard(appEnv, "dev", options);
  if (early.kind === "refuse" && early.reason !== ENV_GUARD_REFUSAL.MARKER_MISMATCH) {
    throw new EnvGuardError(early.reason);
  }
  const decision = decideEnvGuard(appEnv, await readDbEnvironmentMarker(db), options);
  if (decision.kind === "refuse") {
    throw new EnvGuardError(decision.reason);
  }
  return decision;
}
