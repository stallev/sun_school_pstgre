import { readFileSync } from "node:fs";
import path from "node:path";
import { adminSeedInputSchema } from "@sunschool/domain";

export type ParentSeedCredentials = { email: string; password: string };

type Secrets = { PARENT_EMAIL?: string; PARENT_PASSWORD?: string };

export function readDevSecretsFile(repoRoot: string): Secrets {
  try {
    const parsed: unknown = JSON.parse(readFileSync(path.resolve(repoRoot, ".local/dev-secrets.json"), "utf8"));
    return typeof parsed === "object" && parsed !== null ? (parsed as Secrets) : {};
  } catch {
    return {};
  }
}

/** `PARENT_EMAIL` / `PARENT_PASSWORD` from env or `.local/dev-secrets.json` (seed_data_spec §8.4). */
export function resolveParentSeedCredentials(
  env: NodeJS.ProcessEnv,
  repoRoot: string,
): ParentSeedCredentials | null {
  const fromFile = readDevSecretsFile(repoRoot);
  const parsed = adminSeedInputSchema.safeParse({
    email: env.PARENT_EMAIL ?? fromFile.PARENT_EMAIL,
    password: env.PARENT_PASSWORD ?? fromFile.PARENT_PASSWORD,
  });
  return parsed.success ? parsed.data : null;
}

export function parentCredentialsErrorMessage(): string {
  return "Invalid or missing parent credentials: set PARENT_EMAIL and PARENT_PASSWORD (12+ chars) in env or .local/dev-secrets.json";
}
