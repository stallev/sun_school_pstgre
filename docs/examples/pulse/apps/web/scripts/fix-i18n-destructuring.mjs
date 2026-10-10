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

function fixDestructuringCorruption(content) {
  const badPattern =
    /export async function (\w+)\(\{\s*\r?\n\s*const messages = await getMessages\(\);\r?\n([\s\S]*?\}\): [^{]+\{)/;

  if (!badPattern.test(content)) {
    return content;
  }

  return content.replace(
    /export async function (\w+)\(\{\s*\r?\n\s*const messages = await getMessages\(\);\r?\n([\s\S]*?\}: [^{]+\{)/g,
    (_match, name, rest) =>
      `export async function ${name}({\n${rest}\n  const messages = await getMessages();`,
  );
}

function fixInputTypeCorruption(content) {
  return content.replace(
    /(export async function \w+\(input: \{\s*\r?\n)\s*const messages = await getMessages\(\);\r?\n/g,
    "$1",
  ).replace(
    /(\): Promise<[^>]+> \{)\r?\n(?!\s*const messages = await getMessages)/g,
    (match) => `${match}\n  const messages = await getMessages();\n`,
  );
}

function fixActionEarlyMessages(content) {
  // Move messages to top of function if only declared inside if block
  if (
    content.includes("const messages = await getMessages();") &&
    !content.match(/export async function \w+[^{]*\{\s*\r?\n\s*const messages = await getMessages/)
  ) {
    return content.replace(
      /(export async function \w+[^{]*\{)\r?\n(?!\s*const messages = await getMessages)/,
      "$1\n  const messages = await getMessages();\n",
    ).replace(
      /\r?\n\s*const messages = await getMessages\(\);\r?\n/g,
      "\n",
    );
  }
  return content;
}

const brokenFiles = walk(root).filter((file) => {
  const content = fs.readFileSync(file, "utf8");
  return /\(\{\s*\r?\n\s*const messages = await getMessages/.test(content) ||
    /\(input: \{\s*\r?\n\s*const messages = await getMessages/.test(content);
});

for (const file of brokenFiles) {
  let content = fs.readFileSync(file, "utf8");
  content = fixDestructuringCorruption(content);
  content = fixInputTypeCorruption(content);
  fs.writeFileSync(file, content);
  console.log("fixed destructuring:", path.relative(root, file));
}

// Fix actions with messages only in if blocks
const actionFiles = walk(path.join(root, "actions")).filter((f) =>
  fs.readFileSync(f, "utf8").includes("const messages = await getMessages();"),
);
for (const file of actionFiles) {
  let content = fs.readFileSync(file, "utf8");
  const next = fixActionEarlyMessages(content);
  if (next !== content) {
    fs.writeFileSync(file, next);
    console.log("fixed action:", path.relative(root, file));
  }
}
