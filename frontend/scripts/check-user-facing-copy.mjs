import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const comparisonRoot = path.join(frontendRoot, "features", "comparison");
const checkedFiles = [];

async function collect(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) await collect(absolute);
    if (entry.isFile() && entry.name.endsWith(".tsx")) checkedFiles.push(absolute);
  }
}

await collect(path.join(comparisonRoot, "components"));
checkedFiles.push(path.join(comparisonRoot, "use-comparison-flow.ts"));

const bannedCopy = [
  "langchain",
  "price guardrail",
  "illustrative",
  "example trade-off",
  "deterministic",
  "no llm",
  "invented prices",
  "validated catalogue",
  "optional ai help",
  "ai guide",
  "cannot create, change, or rank",
  "gross premium",
  "eligible offers",
  "bag insurer no.",
  "not supplied",
  "exact database filters",
];

const violations = [];
for (const file of checkedFiles) {
  const source = (await readFile(file, "utf8")).toLowerCase();
  for (const phrase of bannedCopy) {
    if (source.includes(phrase)) {
      violations.push(`${path.relative(frontendRoot, file)} contains “${phrase}”`);
    }
  }
}

if (violations.length) {
  console.error(violations.map((violation) => `- ${violation}`).join("\n"));
  process.exit(1);
}

console.log("User-facing copy contains no internal product terminology.");
