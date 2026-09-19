import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative, extname } from "node:path";

const root = process.cwd();
const ignored = new Set(["node_modules", ".next", ".git"]);
const extensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

async function walk(dir) {
  const entries = await readdir(dir);
  const files = [];
  for (const entry of entries) {
    if (ignored.has(entry)) continue;
    const path = join(dir, entry);
    const info = await stat(path);
    if (info.isDirectory()) files.push(...await walk(path));
    else if (extensions.has(extname(path))) files.push(path);
  }
  return files;
}

const escapedTick = String.fromCharCode(92, 96);
const escapedExpr = String.fromCharCode(92, 36, 123);
const failures = [];

for (const path of await walk(root)) {
  if (path.endsWith("scripts/check-source.mjs")) continue;
  const content = await readFile(path, "utf8");
  if (content.includes(escapedTick)) failures.push(relative(root, path) + ": escaped template delimiter");
  if (content.includes(escapedExpr)) failures.push(relative(root, path) + ": escaped template expression");
}

if (failures.length) {
  console.error("Generated source artifacts detected:");
  for (const failure of failures) console.error(" - " + failure);
  process.exit(1);
}

console.log("Source hygiene check passed.");
