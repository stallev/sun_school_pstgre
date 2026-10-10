import fs from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), "src", "data");
const messagesTypeImport =
  'import type { Messages } from "@/lib/messages/types";';

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.name.endsWith(".server.ts")) files.push(full);
  }
  return files;
}

function addMessagesImport(content) {
  if (content.includes(messagesTypeImport)) return content;
  const getMessagesImport = 'import { getMessages } from "@/lib/messages";';
  if (content.includes(getMessagesImport)) {
    return content.replace(
      getMessagesImport,
      `${getMessagesImport}\n${messagesTypeImport}`,
    );
  }
  return content;
}

function addMessagesParamToFunction(content, fnName) {
  const fnRegex = new RegExp(
    `(function ${fnName}\\([^)]*?)\\)(\\s*:\\s*[^\\{]+)?\\{`,
    "g",
  );
  return content.replace(fnRegex, (match, params, returnType = "") => {
    if (params.includes("messages:")) return match;
    const trimmed = params.trimEnd();
    const withParam =
      trimmed.endsWith("(") || trimmed.endsWith(",")
        ? `${trimmed}messages: Messages`
        : `${trimmed}, messages: Messages`;
    return `${withParam})${returnType}{`;
  });
}

function patchMapPolicyErrorCalls(content) {
  return content.replace(
    /return mapPolicyError\(error\);/g,
    "return mapPolicyError(error, messages);",
  );
}

function patchMapValidationErrorCalls(content) {
  return content.replace(
    /return mapValidationError\(([^)]+)\);/g,
    "return mapValidationError($1, messages);",
  );
}

function patchRunTransactionCalls(content) {
  return content.replace(
    /return run(\w+Transaction)\(([^)]+)\);/g,
    (match, fn, args) => {
      if (args.includes("messages")) return match;
      return `return run${fn}(${args}, messages);`;
    },
  );
}

for (const file of walk(dataDir)) {
  let content = fs.readFileSync(file, "utf8");
  if (!content.includes("getMessages") || !content.includes("messages.")) {
    continue;
  }

  const original = content;
  content = addMessagesImport(content);

  const helperNames = [
    ...content.matchAll(/function (map\w+|run\w+Transaction)\(/g),
  ].map((m) => m[1]);

  for (const name of new Set(helperNames)) {
    if (content.includes(`function ${name}(`)) {
      const fnBody = content.match(
        new RegExp(`function ${name}\\([\\s\\S]*?\\n\\}`, "m"),
      )?.[0];
      if (fnBody?.includes("messages.")) {
        content = addMessagesParamToFunction(content, name);
      }
    }
  }

  content = patchMapPolicyErrorCalls(content);
  content = patchMapValidationErrorCalls(content);
  content = patchRunTransactionCalls(content);

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log("patched", path.relative(process.cwd(), file));
  }
}
