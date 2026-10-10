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

function isClientFile(content, filePath) {
  return (
    content.includes('"use client"') ||
    content.includes("'use client'") ||
    /\.client\.(tsx?)$/.test(filePath)
  );
}

function usesMessages(content) {
  return /\bmessages\./.test(content);
}

function hasMessagesDecl(content) {
  return (
    /const messages = await getMessages\(\)/.test(content) ||
    /const messages = useMessages\(\)/.test(content) ||
    /function \w+\([^)]*messages:\s*Messages/.test(content) ||
    /function \w+\(\s*messages:\s*Messages/.test(content)
  );
}

function ensureImport(content, isClient) {
  if (isClient) {
    if (!content.includes("useMessages")) {
      if (content.includes('"use client"')) {
        return content.replace(
          /("use client";\r?\n\r?\n)/,
          '$1import { useMessages } from "@/components/i18n/LocaleProvider.client";\n\n',
        );
      }
      return `import { useMessages } from "@/components/i18n/LocaleProvider.client";\n\n${content}`;
    }
  } else if (
    !content.includes('from "@/lib/messages"') &&
    !content.includes("messages: Messages")
  ) {
    const idx = content.indexOf("\n", content.indexOf("import"));
    if (idx !== -1) {
      return (
        content.slice(0, idx + 1) +
        'import { getMessages } from "@/lib/messages";\n' +
        content.slice(idx + 1)
      );
    }
  }
  return content;
}

function insertDeclInFunctions(content, decl) {
  return content.replace(
    /((?:export\s+(?:default\s+)?(?:async\s+)?function\s+\w+[^{]*\{))\r?\n(?!\s*const messages = )/g,
    `$1\n${decl}`,
  );
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  if (!usesMessages(content) || hasMessagesDecl(content)) {
    return false;
  }

  const client = isClientFile(content, filePath);
  content = ensureImport(content, client);
  const decl = client
    ? "  const messages = useMessages();\n"
    : "  const messages = await getMessages();\n";

  const next = insertDeclInFunctions(content, decl);
  if (next !== content) {
    fs.writeFileSync(filePath, next);
    return true;
  }
  return false;
}

const fixed = walk(root).filter(fixFile);
console.log(`Inserted messages decl in ${fixed.length} files`);
fixed.forEach((f) => console.log(`  ${path.relative(root, f)}`));
