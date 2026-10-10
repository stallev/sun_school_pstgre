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

const messagesType = "Awaited<ReturnType<typeof getMessages>>";

function fixActionFile(content) {
  let changed = false;

  // Fix helper functions: function mapX(code: string) -> add messages param
  content = content.replace(
    /function (map[A-Za-z0-9_]+)\((code: string)\): string \{/g,
    (match, name, param) => {
      changed = true;
      return `function ${name}(${param}, messages: ${messagesType}): string {`;
    },
  );

  // Fix mapXError calls
  content = content.replace(/map([A-Za-z0-9_]+)\(([^,)]+)\)/g, (match, name, arg) => {
    if (match.includes(", messages")) return match;
    changed = true;
    return `map${name}(${arg}, messages)`;
  });

  // Move misplaced const messages out of if blocks
  content = content.replace(
    /if \(!parsed\.success\) \{\n\s*const messages = await getMessages\(\);\n/g,
    () => {
      changed = true;
      return "if (!parsed.success) {\n";
    },
  );

  // Ensure exported async functions start with const messages
  content = content.replace(
    /(export async function \w+\([\s\S]*?\) \{)(\n)(?!  const messages = await getMessages\(\);)/,
    (match, head, nl) => {
      changed = true;
      return `${head}${nl}  const messages = await getMessages();${nl}`;
    },
  );

  return { content, changed };
}

function fixClientError(content) {
  if (!content.includes('"use client"')) return { content, changed: false };
  if (!content.includes("messages.") || content.includes("useMessages()")) {
    return { content, changed: false };
  }

  let changed = false;
  if (!content.includes("useMessages")) {
    content = content.replace(
      /import \{ useMessages \} from "@\/components\/i18n\/LocaleProvider.client";\n\n/,
      "",
    );
    content = content.replace(
      /("use client";\n\n)/,
      '$1import { useMessages } from "@/components/i18n/LocaleProvider.client";\n\n',
    );
    changed = true;
  }

  content = content.replace(
    /(export default function \w+\([\s\S]*?\) \{)(\n)(?!  const messages = useMessages\(\);)/,
    (match, head, nl) => {
      changed = true;
      return `${head}${nl}  const messages = useMessages();${nl}`;
    },
  );

  return { content, changed };
}

const files = walk("apps/web/src");
let fixed = 0;

for (const file of files) {
  let content = fs.readFileSync(file, "utf8");
  let result = { content, changed: false };

  if (file.includes("/actions/") || file.includes("\\actions\\")) {
    result = fixActionFile(content);
  } else if (file.endsWith("error.tsx")) {
    result = fixClientError(content);
  }

  if (result.changed) {
    fs.writeFileSync(file, result.content);
    fixed++;
  }
}

console.log(JSON.stringify({ fixed }, null, 2));
