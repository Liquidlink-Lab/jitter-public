import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { JITTER_CONTRACT_SURFACE } from "../dist/contract/contract-surface.js";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../../../..");

const objectStructNames = {
  Pool: "Pool",
  PyState: "PyState",
  JitterPosition: "JitterPosition",
};

const driftReports = [];

for (const [objectName, surface] of Object.entries(JITTER_CONTRACT_SURFACE.objects)) {
  const sourcePath = path.resolve(repoRoot, surface.source);
  const source = await readFile(sourcePath, "utf8");
  const actualFields = extractMoveStructFields(source, objectStructNames[objectName]);
  const expectedFields = [...surface.fields];
  const diff = diffFields(expectedFields, actualFields);

  if (diff.missing.length > 0 || diff.extra.length > 0) {
    driftReports.push({
      objectName,
      source: surface.source,
      expectedFields,
      actualFields,
      ...diff,
    });
  }
}

if (driftReports.length > 0) {
  console.error("Jitter contract surface drift detected.");
  for (const report of driftReports) {
    console.error("");
    console.error(`${report.objectName} (${report.source})`);
    console.error(`  missing from source: ${formatFieldList(report.missing)}`);
    console.error(`  extra in source: ${formatFieldList(report.extra)}`);
    console.error(`  expected: ${report.expectedFields.join(", ")}`);
    console.error(`  actual:   ${report.actualFields.join(", ")}`);
  }
  process.exit(1);
}

console.log("Jitter contract surface audit passed.");

function extractMoveStructFields(source, structName) {
  const structStart = source.match(
    new RegExp(`public\\s+struct\\s+${structName}(?:\\s*<[^>{}]+>)?\\s+has\\s+[^{}]+\\{`, "u"),
  );
  if (!structStart?.index) {
    throw new Error(`Unable to find public struct ${structName}.`);
  }

  const bodyStart = structStart.index + structStart[0].length;
  const bodyEnd = findMatchingBrace(source, bodyStart - 1);
  const body = source.slice(bodyStart, bodyEnd);

  return body
    .split("\n")
    .map((line) => line.replace(/\/\/.*$/u, "").trim())
    .filter((line) => line.length > 0 && line.includes(":"))
    .map((line) => line.slice(0, line.indexOf(":")).trim())
    .filter((field) => /^[A-Za-z_][A-Za-z0-9_]*$/u.test(field));
}

function findMatchingBrace(source, openBraceIndex) {
  let depth = 0;
  for (let index = openBraceIndex; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }

  throw new Error(`Unable to find matching brace at index ${openBraceIndex}.`);
}

function diffFields(expectedFields, actualFields) {
  return {
    missing: expectedFields.filter((field) => !actualFields.includes(field)),
    extra: actualFields.filter((field) => !expectedFields.includes(field)),
  };
}

function formatFieldList(fields) {
  return fields.length === 0 ? "(none)" : fields.join(", ");
}
