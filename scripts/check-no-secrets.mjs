import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const ignoredDirs = new Set([".git", "node_modules"]);
const manifestPattern = "\\/stremio\\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\/"
  + "[^/\\s\"]+\\/manifest\\.json";
const stremioPathPattern = "\\/stremio\\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\/"
  + "[A-Za-z0-9_-]{16,}";
const encodedConfigPattern = "eyJpIjoi" + "[^\"\\s]+";
const suspicious = [
  new RegExp(manifestPattern, "i"),
  new RegExp(stremioPathPattern, "i"),
  new RegExp(encodedConfigPattern, "i"),
  /Authorization["'\s:]+Basic\s+[A-Za-z0-9+/]{24,}={0,2}/i,
  /AIOSTREAMS_PASSWORD\s*=\s*["'](?!<password>)[^"']{8,}["']/i
];

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (ignoredDirs.has(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const hits = [];
for (const file of walk(root)) {
  const text = readFileSync(file, "utf8");
  for (const pattern of suspicious) {
    if (pattern.test(text)) hits.push(relative(root, file));
  }
}

if (hits.length) {
  console.error("Secret-like AIOStreams/Stremio manifest data found:");
  for (const hit of [...new Set(hits)]) console.error(`- ${hit}`);
  process.exit(1);
}

console.log("No tokenized AIOStreams/Stremio manifest URLs found.");
