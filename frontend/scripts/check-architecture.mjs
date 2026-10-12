import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";


const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const featureRoot = path.join(frontendRoot, "features");
const violations = [];

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await sourceFiles(absolute));
    if (entry.isFile() && /\.(ts|tsx|css)$/.test(entry.name)) files.push(absolute);
  }
  return files;
}

const pagePath = path.join(frontendRoot, "app", "page.tsx");
const pageSource = await readFile(pagePath, "utf8");
if (pageSource.split("\n").length > 40) {
  violations.push("app/page.tsx must remain a thin composition entry (40 lines maximum)");
}

for (const file of await sourceFiles(featureRoot)) {
  const source = await readFile(file, "utf8");
  const relative = path.relative(frontendRoot, file);
  if (source.split("\n").length > 250) {
    violations.push(`${relative} exceeds the 250-line module limit`);
  }
  if (/from\s+["'][^"']*\/app\//.test(source)) {
    violations.push(`${relative} imports from the Next.js delivery layer`);
  }
}

if (violations.length) {
  console.error(violations.map((violation) => `- ${violation}`).join("\n"));
  process.exit(1);
}

console.log("Frontend module boundaries are valid.");

