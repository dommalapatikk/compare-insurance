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
checkedFiles.push(path.join(comparisonRoot, "config.ts"));

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
  "telmed",
  "other models",
  "good to know",
  "care model",
  "detailed model",
  "compare options",
  "lowest premium by deductible",
  "annual deductible",
  "franchise × model",
  "compare the lowest premium with what you pay now",
  "enter five details",
  "confirm whom you must contact first under the insurance model",
  "lowest monthly premium first",
  "10 lowest offers",
  "calculate your possible savings",
  "we’ll match it to the correct municipality and premium region",
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

const profilePath = path.join(
  comparisonRoot,
  "components",
  "guided-advisor.tsx",
);
const profileSource = await readFile(profilePath, "utf8");
for (const label of ["Premium region", "Which age group"]) {
  if (profileSource.includes(label)) {
    violations.push(`guided-advisor.tsx must not ask the customer for “${label}”`);
  }
}
if (/label[^>]*>\s*Gender\b/i.test(profileSource) || /name=["']gender["']/i.test(profileSource)) {
  violations.push("guided-advisor.tsx must not contain a gender input");
}
for (const requiredLabel of ["Postcode", "Birth year"]) {
  if (!profileSource.includes(requiredLabel)) {
    violations.push(`guided-advisor.tsx is missing “${requiredLabel}”`);
  }
}

if (violations.length) {
  console.error(violations.map((violation) => `- ${violation}`).join("\n"));
  process.exit(1);
}

console.log("User-facing copy contains no internal product terminology.");
