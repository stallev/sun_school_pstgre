import fs from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), "src", "data");

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

for (const file of walk(dataDir)) {
  let content = fs.readFileSync(file, "utf8");
  const original = content;

  content = content.replace(
    /function mapValidationError\(\n([\s\S]*?)\): (\w+) \{/,
    (match, params, returnType) => {
      if (params.includes("messages: Messages")) return match;
      const trimmed = params.trimEnd();
      return `function mapValidationError(\n${trimmed},\n  messages: Messages,\n): ${returnType} {`;
    },
  );

  content = content.replace(
    /,messages: Messages\)/g,
    ",\n  messages: Messages,\n)",
  );

  content = content.replace(
    /(\w+\?: string,\n)\s*messages: Messages,/,
    "messages: Messages,\n  $1".replace("  messages: Messages,\n  messages: Messages,", "messages: Messages,"),
  );

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log("fixed", path.relative(process.cwd(), file));
  }
}
