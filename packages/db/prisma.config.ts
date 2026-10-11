import path from "node:path";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// Node does not load .env by itself. The monorepo keeps one gitignored .env at the repo root;
// the CLI runs with cwd = packages/db (npm -w), so resolve the root file explicitly.
loadEnv({ path: path.resolve(process.cwd(), "../../.env") });
loadEnv();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // CLI (migrate, status) always uses the DIRECT (non-pooled) connection — ADR-001, TX-6.
    // `prisma generate` does not connect, so an empty fallback keeps CI green without secrets.
    url: process.env.DIRECT_URL ?? "",
  },
});
