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

function needsFix(content) {
  if (!/\bmessages\./.test(content) && !/\bmessages\[/.test(content)) return false;
  if (/const messages = await getMessages\(\)/.test(content)) return false;
  if (/const messages = useMessages\(\)/.test(content)) return false;
  return true;
}

function isClient(content, file) {
  return (
    content.includes('"use client"') ||
    content.includes("'use client'") ||
    /\.client\.(tsx?)$/.test(file)
  );
}

const missing = [];
for (const file of walk(root)) {
  const content = fs.readFileSync(file, "utf8");
  if (needsFix(content)) {
    missing.push(path.relative(root, file));
  }
}
console.log(missing.join("\n"));
console.log(`\nTotal: ${missing.length}`);
