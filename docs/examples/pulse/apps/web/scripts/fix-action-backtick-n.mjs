import fs from "node:fs";
import path from "node:path";

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (/\.ts$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

for (const file of walk("src/actions")) {
  let content = fs.readFileSync(file, "utf8");
  const original = content;
  content = content.replace(
    />> \{`n  const messages = await getMessages\(\);`n/g,
    ">> {\n  const messages = await getMessages();\n",
  );
  content = content.replace(/  }>>/g, " }>>");
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(file);
  }
}
