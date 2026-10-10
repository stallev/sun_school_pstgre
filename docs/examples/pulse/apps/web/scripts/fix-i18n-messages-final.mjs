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

function shouldSkipLib(file, content) {
  if (!file.includes(`${path.sep}lib${path.sep}`)) return false;
  return /messages:\s*Messages/.test(content);
}

function needsFix(content, file) {
  if (shouldSkipLib(file, content)) return false;
  if (!/\bmessages\./.test(content)) return false;
  if (/const messages = await getMessages\(\)/.test(content)) return false;
  if (/const messages = useMessages\(\)/.test(content)) return false;
  return true;
}

function findFunctionBodyBrace(content, fromIndex) {
  const parenStart = content.indexOf("(", fromIndex);
  if (parenStart === -1) return -1;

  let depth = 0;
  for (let i = parenStart; i < content.length; i++) {
    const ch = content[i];
    if (ch === "(") depth++;
    else if (ch === ")") {
      depth--;
      if (depth === 0) {
        const rest = content.slice(i + 1);
        const bodyMatch = rest.match(/^\s*(?::[\s\S]*?)?\s*\{/);
        if (bodyMatch) {
          return i + 1 + bodyMatch[0].length - 1;
        }
        return -1;
      }
    }
  }
  return -1;
}

function insertMessagesInExportedFunctions(content, decl) {
  const fnRegex = /export (?:default )?(?:async )?function \w+/g;
  let match;
  let offset = 0;
  let result = content;

  while ((match = fnRegex.exec(content)) !== null) {
    const fnStart = match.index + offset;
    const searchContent = result.slice(fnStart);
    const localBrace = findFunctionBodyBrace(searchContent, 0);
    if (localBrace === -1) continue;

    const insertPos = fnStart + localBrace + 1;
    const afterBrace = result.slice(insertPos, insertPos + 60);
    if (/^\s*const messages = (await getMessages\(\)|useMessages\(\))/.test(afterBrace)) {
      continue;
    }

    result =
      result.slice(0, insertPos) +
      `\n${decl}` +
      result.slice(insertPos);
    offset += decl.length + 1;
    fnRegex.lastIndex = match.index + decl.length + 1;
  }

  return result;
}

function ensureImport(content, client) {
  if (client) {
    if (!content.includes("useMessages")) {
      content = content.replace(
        /("use client";\r?\n\r?\n)/,
        '$1import { useMessages } from "@/components/i18n/LocaleProvider.client";\n\n',
      );
    }
  } else if (!content.includes('from "@/lib/messages"')) {
    const m = content.match(/^import .+;\r?\n/m);
    if (m) {
      const idx = content.indexOf(m[0]) + m[0].length;
      content =
        content.slice(0, idx) +
        'import { getMessages } from "@/lib/messages";\n' +
        content.slice(idx);
    }
  }
  return content;
}

function makeAsync(content) {
  return content
    .replace(/^export function /gm, "export async function ")
    .replace(/^export default function /gm, "export default async function ");
}

let count = 0;
for (const file of walk(root)) {
  let content = fs.readFileSync(file, "utf8");
  if (!needsFix(content, file)) continue;

  const client = isClient(content, file);
  const original = content;
  content = ensureImport(content, client);
  if (!client) content = makeAsync(content);

  const decl = client
    ? "  const messages = useMessages();"
    : "  const messages = await getMessages();";

  content = insertMessagesInExportedFunctions(content, decl);

  if (content !== original) {
    fs.writeFileSync(file, content);
    count++;
    console.log(path.relative(root, file));
  }
}

console.log(`Fixed ${count} files`);
