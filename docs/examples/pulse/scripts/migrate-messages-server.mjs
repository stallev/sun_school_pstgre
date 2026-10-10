import fs from "node:fs";
import path from "node:path";

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (/\.(ts|tsx)$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

const skipPatterns = ["lib/messages/", "migrate-messages"];

const files = walk("apps/web/src")
  .map((f) => f.replace(/\\/g, "/"))
  .filter((file) => !skipPatterns.some((p) => file.includes(p)))
  .filter((file) => {
    const c = fs.readFileSync(file, "utf8");
    return c.includes('from "@/lib/messages"') && (c.includes("MESSAGES.") || c.includes("getMessages"));
  });

let updated = 0;

for (const file of files) {
  let content = fs.readFileSync(file, "utf8");
  const isClient =
    file.includes(".client.") ||
    content.includes('"use client"') ||
    content.includes("'use client'");

  if (isClient) continue;
  if (!content.includes("MESSAGES.")) continue;

  content = content.replace(/MESSAGES\./g, "messages.");

  if (!content.includes("const messages = await getMessages()")) {
    // async function
    if (/export async function \w+/.test(content)) {
      content = content.replace(
        /(export async function \w+\([\s\S]*?\) \{)/,
        "$1\n  const messages = await getMessages();",
      );
    } else if (/export default async function/.test(content)) {
      content = content.replace(
        /(export default async function[\s\S]*?\{)/,
        "$1\n  const messages = await getMessages();",
      );
    } else if (/export function generateMetadata/.test(content)) {
      content = content.replace(
        /(export (?:async )?function generateMetadata[\s\S]*?\{)/,
        "export async function generateMetadata(): Promise<import(\"next\").Metadata> {\n  const messages = await getMessages();",
      );
      content = content.replace(
        /export async function generateMetadata\(\): Promise<import\("next"\)\.Metadata> \{\n  const messages = await getMessages\(\);\n  const messages = await getMessages\(\);/,
        "export async function generateMetadata(): Promise<import(\"next\").Metadata> {\n  const messages = await getMessages();",
      );
    } else if (/^export function \w+/m.test(content) && content.includes("MESSAGES")) {
      // sync export function - make async
      content = content.replace(
        /export function (\w+)\(([\s\S]*?)\) \{/,
        "export async function $1($2) {\n  const messages = await getMessages();",
      );
    } else if (/export const \w+ = async/.test(content)) {
      content = content.replace(
        /(export const \w+ = async \([\s\S]*?\) => \{)/,
        "$1\n  const messages = await getMessages();",
      );
    } else if (/export async function build\w+/.test(content)) {
      content = content.replace(
        /(export async function build\w+\([\s\S]*?\) \{)/,
        "$1\n  const messages = await getMessages();",
      );
    } else if (/export function build\w+/.test(content)) {
      content = content.replace(
        /export function (build\w+)\(([\s\S]*?)\)/,
        "export async function $1($2)",
      );
      content = content.replace(
        /(export async function build\w+\([\s\S]*?\) \{)/,
        "$1\n  const messages = await getMessages();",
      );
    }
  }

  fs.writeFileSync(file, content);
  updated++;
}

console.log(JSON.stringify({ scanned: files.length, updated }, null, 2));
