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

const declLine =
  /^\s*const messages = (await getMessages\(\)|useMessages\(\));\s*\r?\n/gm;

function fixInputTypeBlock(content) {
  return content.replace(
    /(export async function \w+\(input: \{)\s*\r?\n\s*const messages = await getMessages\(\);\s*\r?\n/g,
    "$1\n",
  );
}

function fixDestructuredParams(content) {
  return content.replace(
    /(export (?:default )?(?:async )?function \w+\(\{)([\s\S]*?)(\}: [^{]+\) \{)/g,
    (full, open, params, close) => {
      if (!/const messages = (await getMessages\(\)|useMessages\(\))/.test(params)) {
        return full;
      }
      const isClient = /useMessages\(\)/.test(params);
      const cleaned = params.replace(declLine, "");
      const decl = isClient
        ? "  const messages = useMessages();\n"
        : "  const messages = await getMessages();\n";
      return `${open}${cleaned}${close}\n${decl}`;
    },
  );
}

function fixInlineTypeParams(content) {
  return content.replace(
    /(export default function \w+\(\{)([\s\S]*?)(\}: \{[\s\S]*?\) \{)/g,
    (full, open, params, close) => {
      if (!/const messages = useMessages\(\)/.test(params)) {
        return full;
      }
      const cleaned = params.replace(declLine, "");
      return `${open}${cleaned}${close}\n  const messages = useMessages();\n`;
    },
  );
}

function dedupeBodyDecl(content) {
  return content.replace(
    /(const messages = (?:await getMessages\(\)|useMessages\(\));\s*\r?\n)([\s\S]*?)\1/g,
    "$1$2",
  );
}

function ensureActionBodyDecl(content) {
  return content.replace(
    /(export async function \w+\([^{]+\{)\r?\n(?!\s*const messages = await getMessages)/g,
    "$1\n  const messages = await getMessages();\n",
  );
}

let fixed = 0;
for (const file of walk(root)) {
  let content = fs.readFileSync(file, "utf8");
  const original = content;

  content = fixInputTypeBlock(content);
  content = fixDestructuredParams(content);
  content = fixInlineTypeParams(content);
  content = dedupeBodyDecl(content);

  if (file.includes(`${path.sep}actions${path.sep}`)) {
    content = ensureActionBodyDecl(content);
  }

  if (content !== original) {
    fs.writeFileSync(file, content);
    fixed += 1;
    console.log(path.relative(root, file));
  }
}

console.log(`Fixed ${fixed} files`);
