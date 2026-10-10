import fs from "node:fs";
import path from "node:path";

const root = path.resolve("src");

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) acc = walk(full, acc);
    else if (/\.(tsx?)$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

function isClient(content, file) {
  return (
    content.includes('"use client"') ||
    content.includes("'use client'") ||
    /\.client\.(tsx?)$/.test(file)
  );
}

function hasDecl(content) {
  return (
    /const messages = await getMessages\(\)/.test(content) ||
    /const messages = useMessages\(\)/.test(content) ||
    /\(\s*messages:\s*Messages/.test(content) ||
    /,\s*messages:\s*Messages/.test(content)
  );
}

function usesMessages(content) {
  return /\bmessages\./.test(content) || /\bmessages\[/.test(content);
}

function ensureImport(content, client) {
  if (client) {
    if (!content.includes("useMessages")) {
      content = content.replace(
        /("use client";\r?\n\r?\n)/,
        '$1import { useMessages } from "@/components/i18n/LocaleProvider.client";\n\n',
      );
    }
  } else if (
    !content.includes('from "@/lib/messages"') &&
    !/messages:\s*Messages/.test(content)
  ) {
    const firstImport = content.match(/^import .+;\r?\n/m);
    if (firstImport) {
      const idx = content.indexOf(firstImport[0]) + firstImport[0].length;
      content =
        content.slice(0, idx) +
        'import { getMessages } from "@/lib/messages";\n' +
        content.slice(idx);
    }
  }
  return content;
}

function insertInBodies(content, decl) {
  // Only insert after `) {` closing function params, not inside types
  return content.replace(
    /(\)\s*(?::\s*[^{]+)?\s*\{)\r?\n(?!\s*const messages = )/g,
    (match) => {
      // skip if this is inside a type/interface (heuristic: preceded by `input:` block without export async function on same line)
      return `${match}\n${decl}`;
    },
  );
}

function fixExports(content, client) {
  if (!client && usesMessages(content)) {
    content = content.replace(
      /^export function (\w+)/gm,
      "export async function $1",
    );
    content = content.replace(
      /^export default function/gm,
      "export default async function",
    );
  }
  return content;
}

let count = 0;
for (const file of walk(root)) {
  let content = fs.readFileSync(file, "utf8");
  if (!usesMessages(content) || hasDecl(content)) continue;

  const rel = path.relative(root, file);
  const client = isClient(content, file);
  const original = content;

  content = ensureImport(content, client);
  content = fixExports(content, client);
  const decl = client
    ? "  const messages = useMessages();\n"
    : "  const messages = await getMessages();\n";

  // Target exported functions/components only
  content = content.replace(
    /(export (?:default )?(?:async )?function [^{]+\{)\r?\n(?!\s*const messages = )/g,
    `$1\n${decl}`,
  );

  if (content !== original) {
    fs.writeFileSync(file, content);
    count++;
    console.log(rel);
  }
}

console.log(`Updated ${count} files`);
