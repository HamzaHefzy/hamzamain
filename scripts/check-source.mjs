import { readdir, readFile, stat } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const ignored = new Set(["node_modules", ".next", ".git"]);
const extensions = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".sql", ".md", ".json", ".yml", ".yaml", ".css",
]);
const forbiddenPathPrefixes = [
  "app/attendance/",
  "app/cases/",
  "app/evidence/",
  "app/funding/",
  "app/recovery/",
  "app/virtual/",
  "app/api/cases/",
  "app/api/recovery/",
  "app/api/students/",
  "app/api/evidence/",
];

async function walk(dir) {
  const entries = await readdir(dir);
  const files = [];
  for (const entry of entries) {
    if (ignored.has(entry)) continue;
    const path = join(dir, entry);
    const info = await stat(path);
    if (info.isDirectory()) files.push(...await walk(path));
    else if (
      extensions.has(extname(path)) ||
      entry === ".env.example"
    ) files.push(path);
  }
  return files;
}

const escapedTick = String.fromCharCode(92, 96);
const escapedExpr = String.fromCharCode(92, 36, 123);
const failures = [];

for (const path of await walk(root)) {
  const rel = relative(root, path).replaceAll("\\", "/");
  if (rel === "scripts/check-source.mjs") continue;

  if (forbiddenPathPrefixes.some((prefix) => rel.startsWith(prefix))) {
    failures.push(rel + ": removed Anchor domain path returned");
  }

  const content = await readFile(path, "utf8");
  if (content.includes(escapedTick)) {
    failures.push(rel + ": escaped template delimiter");
  }
  if (content.includes(escapedExpr)) {
    failures.push(rel + ": escaped template expression");
  }
  if (/\banchor\b/i.test(content)) {
    failures.push(rel + ": Anchor branding/domain residue");
  }
  if (/\b(?:Wafira|Dexyra)\b/i.test(content)) {
    failures.push(rel + ": retired product-brand residue");
  }
  if (/\bdexyra\b/i.test(content)) {
    failures.push(rel + ": discarded Dexyra brand residue");
  }
}

const pkg = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
if (pkg.name !== "wafira") {
  failures.push("package.json: package name must remain wafira");
}

const lock = JSON.parse(await readFile(join(root, "package-lock.json"), "utf8"));
if (lock.name !== "wafira" || lock.packages?.[""]?.name !== "wafira") {
  failures.push("package-lock.json: root package metadata is not Wafira-native");
}

if (failures.length) {
  console.error("Source hygiene check failed:");
  for (const failure of failures) console.error(" - " + failure);
  process.exit(1);
}

console.log("Source hygiene check passed.");
