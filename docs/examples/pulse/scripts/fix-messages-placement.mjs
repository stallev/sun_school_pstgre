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

const files = walk("apps/web/src");
let fixed = 0;

for (const file of files) {
  let content = fs.readFileSync(file, "utf8");
  let changed = false;

  // Move misplaced getMessages from inside if (!parsed.success)
  while (content.includes("if (!parsed.success) {\n  const messages = await getMessages();")) {
    content = content.replace(
      "if (!parsed.success) {\n  const messages = await getMessages();",
      "if (!parsed.success) {",
    );
    changed = true;
  }

  // Add messages at start of export async function if uses messages. but missing declaration
  if (
    content.includes("messages.") &&
    content.includes("export async function") &&
    !content.match(/export async function[\s\S]*?\{\n  const messages = await getMessages\(\);/)
  ) {
    content = content.replace(
      /(export async function \w+\([\s\S]*?\) \{)\n(?!(  const messages = await getMessages\(\);))/,
      "$1\n  const messages = await getMessages();\n",
    );
    changed = true;
  }

  // Client error.tsx
  if (
    file.endsWith("error.tsx") &&
    content.includes('"use client"') &&
    content.includes("messages.") &&
    !content.includes("const messages = useMessages()")
  ) {
    content = content.replace(
      /(\) \{\n)(  return \()/,
      "$1  const messages = useMessages();\n\n$2",
    );
    changed = true;
  }

  // loading.tsx async getMessages
  if (
    file.endsWith("loading.tsx") &&
    content.includes("messages.") &&
    !content.includes("await getMessages()")
  ) {
    content = content.replace(
      /export default function (\w+)\(\) \{/,
      "export default async function $1() {\n  const messages = await getMessages();",
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content);
    fixed++;
  }
}

console.log(JSON.stringify({ fixed }, null, 2));
