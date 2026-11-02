#!/usr/bin/env node
/**
 * Measure Neon/Postgres RTT: connect, select 1, short transaction.
 * Usage: node --env-file=.env scripts/db-latency.mjs
 */
import { createRequire } from "node:module";
import { performance } from "node:perf_hooks";

const require = createRequire(import.meta.url);
const { Client } = require("pg");

function maskDatabaseUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.password) parsed.password = "***";
    if (parsed.username) parsed.username = "***";
    return parsed.toString();
  } catch {
    return "(invalid DATABASE_URL)";
  }
}

function ms(start) {
  return Math.round(performance.now() - start);
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  console.log("DATABASE_URL:", maskDatabaseUrl(connectionString));

  const client = new Client({ connectionString });

  let t0 = performance.now();
  await client.connect();
  console.log(`connect: ${ms(t0)} ms`);

  t0 = performance.now();
  await client.query("select 1 as ok");
  console.log(`select 1 (warm): ${ms(t0)} ms`);

  t0 = performance.now();
  await client.query("BEGIN");
  await client.query("select 1");
  await client.query("select 2");
  await client.query("COMMIT");
  console.log(`transaction (BEGIN + 2 selects + COMMIT): ${ms(t0)} ms`);

  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
