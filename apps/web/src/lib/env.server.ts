import "server-only";
import { z } from "zod";

/**
 * Server environment — canon: docs/implementation/mvp/guides/local_dev_setup.md §6.
 * Parsed lazily so that `next build` and tooling do not need secrets.
 * No NEXT_PUBLIC_* here: nothing secret may be public.
 */
const serverEnvSchema = z.object({
  APP_ENV: z.enum(["dev", "prod"]),
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(16),
  AUTH_TELEGRAM_ID: z.string().optional(),
  AUTH_TELEGRAM_SECRET: z.string().optional(),
  FIRST_ADMIN_EMAIL: z.string().email().optional(),
  SENTRY_DSN: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

const POOLER_HOST_MARKER = "-pooler";

export function assertPooledDatabaseUrl(appEnv: ServerEnv["APP_ENV"], databaseUrl: string): void {
  if (process.env.ALLOW_DIRECT_DATABASE_URL === "1") return;

  let hostname: string;
  try {
    hostname = new URL(databaseUrl).hostname;
  } catch {
    return;
  }

  if (hostname.includes(POOLER_HOST_MARKER)) return;

  const hint =
    "DATABASE_URL must use the Neon pooled host (hostname contains -pooler). " +
    "For Prisma migrate/seed against DIRECT_URL, set ALLOW_DIRECT_DATABASE_URL=1 locally only.";

  if (appEnv === "dev") {
    console.warn(hint);
    return;
  }

  throw new Error(hint);
}

/** True when the process can open the database. Preview builds often have no secrets. */
export function hasServerEnv(): boolean {
  return serverEnvSchema.safeParse(process.env).success;
}

export function getServerEnv(): ServerEnv {
  if (!cached) {
    const parsed = serverEnvSchema.safeParse(process.env);
    if (!parsed.success) {
      const names = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
      throw new Error(`Invalid server environment: ${names}`);
    }
    assertPooledDatabaseUrl(parsed.data.APP_ENV, parsed.data.DATABASE_URL);
    cached = parsed.data;
  }
  return cached;
}
