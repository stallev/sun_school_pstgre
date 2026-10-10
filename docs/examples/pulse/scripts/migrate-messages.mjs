import { execSync } from "node:child_process";
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

const skipPatterns = [
  "lib/messages/",
  "LocaleProvider.client.tsx",
  "migrate-messages.mjs",
];

const files = walk("apps/web/src")
  .map((f) => f.replace(/\\/g, "/"))
  .filter((file) => !skipPatterns.some((p) => file.includes(p)))
  .filter((file) => fs.readFileSync(file, "utf8").includes("MESSAGES"));

let clientCount = 0;
let serverCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, "utf8");
  if (!content.includes("MESSAGES")) continue;

  const isClient =
    file.includes(".client.") ||
    content.includes('"use client"') ||
    content.includes("'use client'");

  if (isClient) {
    content = content.replace(
      /import \{ MESSAGES(?:, type Messages)? \} from "@\/lib\/messages";?\n?/g,
      'import { useMessages } from "@/components/i18n/LocaleProvider.client";\n',
    );

    if (content.includes("MESSAGES.") && !content.includes("useMessages()")) {
      const fnMatch = content.match(
        /export function (\w+)\(([\s\S]*?)\) \{/,
      );
      if (fnMatch) {
        content = content.replace(
          /export function (\w+)\(([\s\S]*?)\) \{/,
          "export function $1($2) {\n  const messages = useMessages();",
        );
      }
    }

    content = content.replace(/MESSAGES\./g, "messages.");
    clientCount++;
  } else {
    content = content.replace(
      /import \{ MESSAGES(?:, type Messages)? \} from "@\/lib\/messages";?\n?/g,
      'import { getMessages } from "@/lib/messages";\n',
    );
    serverCount++;
  }

  fs.writeFileSync(file, content);
}

console.log(
  JSON.stringify({ total: files.length, clientCount, serverCount }, null, 2),
);
