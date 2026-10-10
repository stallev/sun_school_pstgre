import fs from "node:fs";
import path from "node:path";

const root = path.resolve("src");

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) acc = walk(full, acc);
    else if (/\.(tsx?)$/.test(filePathSafe(full))) acc.push(full);
  }
  return acc;
}

function filePathSafe(p) {
  return p;
}

function isClientFile(content, filePath) {
  return (
    content.includes('"use client"') ||
    content.includes("'use client'") ||
    /\.client\.(tsx?)$/.test(filePath)
  );
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  const original = content;

  // Remove const messages wrongly placed inside destructuring / inline type params
  content = content.replace(
    /(\{\s*\r?\n)\s*const messages = (await getMessages\(\)|useMessages\(\));\s*\r?\n/g,
    "$1",
  );

  const client = isClientFile(content, filePath);
  const decl = client
    ? "  const messages = useMessages();\n"
    : "  const messages = await getMessages();\n";

  if (!/\bmessages\./.test(content)) {
    return false;
  }

  if (
    /const messages = await getMessages\(\)/.test(content) ||
    /const messages = useMessages\(\)/.test(content) ||
    /function \w+\([^)]*messages:\s*Messages/.test(content)
  ) {
    // already has declaration somewhere valid
  } else if (/\bmessages\./.test(content)) {
    content = content.replace(
      /((?:export (?:default )?(?:async )?function \w+[^{]*\{))\r?\n(?!\s*const messages = )/g,
      `$1\n${decl}`,
    );
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    return true;
  }
  return false;
}

const fixed = walk(root).filter(fixFile);
console.log(`Repaired ${fixed.length} files`);
