import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = path.resolve("src");

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) acc = walk(full, acc);
    else if (/\.(tsx?)$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

function hasMessagesUsage(content) {
  return /\bmessages\./.test(content) || /\bmessages\[/.test(content);
}

function alreadyHasMessagesDecl(content) {
  return (
    /const messages = await getMessages\(\)/.test(content) ||
    /const messages = useMessages\(\)/.test(content)
  );
}

function isClientFile(content) {
  return (
    content.includes('"use client"') ||
    content.includes("'use client'") ||
    /\.client\.tsx?$/.test(content)
  );
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  if (!hasMessagesUsage(content) || alreadyHasMessagesDecl(content)) {
    return false;
  }

  const rel = path.relative(root, filePath).replace(/\\/g, "/");
  const client = isClientFile(content);
  let changed = false;

  // Server actions: add getMessages at start of exported async functions
  if (rel.startsWith("actions/") && content.includes('"use server"')) {
    if (!content.includes('from "@/lib/messages"')) {
      content = content.replace(
        /("use server";\n\n)/,
        '$1import { getMessages } from "@/lib/messages";\n\n',
      );
    }
    content = content.replace(
      /(export async function \w+[^{]*\{)\n(?!\s*const messages = await getMessages)/g,
      "$1\n  const messages = await getMessages();\n",
    );
    changed = true;
  }

  // Data server files
  if (rel.startsWith("data/") && content.includes('"server-only"')) {
    if (!content.includes('from "@/lib/messages"')) {
      content = content.replace(
        /(import "server-only";\n\n)/,
        '$1import { getMessages } from "@/lib/messages";\n\n',
      );
    }
    content = content.replace(
      /(export async function \w+[^{]*\{)\n(?!\s*const messages = await getMessages)/g,
      "$1\n  const messages = await getMessages();\n",
    );
    changed = true;
  }

  // API routes
  if (rel.startsWith("app/api/")) {
    if (!content.includes('from "@/lib/messages"')) {
      const insertAt = content.indexOf("\n\n", content.indexOf("import"));
      if (insertAt !== -1) {
        content =
          content.slice(0, insertAt + 2) +
          'import { getMessages } from "@/lib/messages";\n\n' +
          content.slice(insertAt + 2);
      }
    }
    for (const handler of ["GET", "POST", "PUT", "PATCH", "DELETE"]) {
      content = content.replace(
        new RegExp(
          `(export async function ${handler}[^{]*\\{)\\n(?!\\s*const messages = await getMessages)`,
          "g",
        ),
        "$1\n  const messages = await getMessages();\n",
      );
    }
    changed = true;
  }

  // Client components / error.tsx
  if (client) {
    if (!content.includes("useMessages")) {
      if (content.includes('"use client"')) {
        content = content.replace(
          /("use client";\n\n)/,
          '$1import { useMessages } from "@/components/i18n/LocaleProvider.client";\n\n',
        );
      } else {
        content = `import { useMessages } from "@/components/i18n/LocaleProvider.client";\n\n${content}`;
      }
    }
    // Add useMessages inside function components
    content = content.replace(
      /(export (?:default )?function \w+[^{]*\{)\n(?!\s*const messages = useMessages)/g,
      "$1\n  const messages = useMessages();\n",
    );
    changed = true;
  }

  // Server app pages / not-found / opengraph
  if (
    !client &&
    (rel.startsWith("app/") ||
      rel.startsWith("components/") ||
      rel.startsWith("lib/admin/"))
  ) {
    const needsAsync =
      !content.includes("export async function") &&
      !content.includes("export default async function") &&
      (content.includes("export function") || content.includes("export default function"));

    if (needsAsync && hasMessagesUsage(content)) {
      content = content.replace(/export default function/g, "export default async function");
      content = content.replace(
        /export function (\w+)/g,
        "export async function $1",
      );
    }

    if (
      !content.includes('from "@/lib/messages"') &&
      !content.includes("server-only") &&
      hasMessagesUsage(content)
    ) {
      const firstImportEnd = content.indexOf("\n", content.indexOf("import"));
      if (firstImportEnd !== -1) {
        content =
          content.slice(0, firstImportEnd + 1) +
          'import { getMessages } from "@/lib/messages";\n' +
          content.slice(firstImportEnd + 1);
      }
    }

    content = content.replace(
      /(export (?:default )?async function \w+[^{]*\{)\n(?!\s*const messages = await getMessages)/g,
      "$1\n  const messages = await getMessages();\n",
    );

    // Sync server functions that aren't components
    if (
      rel.startsWith("lib/admin/") &&
      content.includes("export function") &&
      !content.includes("export async function")
    ) {
      content = content.replace(/export function/g, "export async function");
      content = content.replace(
        /(export async function \w+[^{]*\{)\n(?!\s*const messages = await getMessages)/g,
        "$1\n  const messages = await getMessages();\n",
      );
    }

    changed = true;
  }

  if (changed && content !== fs.readFileSync(filePath, "utf8")) {
    fs.writeFileSync(filePath, content);
    return true;
  }
  return false;
}

const files = walk(root);
const fixed = files.filter(fixFile);
console.log(`Fixed ${fixed.length} files`);

try {
  execSync("npx tsc --noEmit", { stdio: "inherit", cwd: path.resolve(".") });
} catch {
  // leave for manual follow-up
}
