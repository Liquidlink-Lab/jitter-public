import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const generatedDir = path.resolve(__dirname, "..", "src", "generated");
const PACKAGE_NAME_REPLACEMENTS = new Map([
  ["@local-pkg/demo_adapter", "jitter/demo-adapter"],
  ["@local-pkg/jitter", "jitter/jitter"],
  ["@local-pkg/jitter_extensions", "jitter/jitter-extensions"],
  ["@local-pkg/jitter_admin", "jitter/jitter-admin"],
  ["@local-pkg/jitter_math", "jitter/jitter-math"],
  ["@local-pkg/jitter_oracle", "jitter/jitter-oracle"],
]);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return walk(entryPath);
      }

      return entryPath.endsWith(".ts") ? [entryPath] : [];
    }),
  );

  return files.flat();
}

function normalizeGeneratedImports(filePath, source) {
  const relativePath = path.relative(generatedDir, filePath).split(path.sep).join("/");
  const inDependencySubtree = relativePath.includes("/deps/");

  let next = source.replaceAll("\\", "/");
  next = next.replaceAll("from '~root/", "from './");
  next = next.replaceAll('from "~root/', 'from "./');

  if (inDependencySubtree) {
    next = next.replaceAll(/(?:\.\.\/)+utils\/index\.js/g, "../../../utils/index.js");
    next = next.replaceAll("from './deps/", "from '../");
    next = next.replaceAll('from "./deps/', 'from "../');
  }

  for (const [from, to] of PACKAGE_NAME_REPLACEMENTS) {
    next = next.replaceAll(from, to);
  }

  if (relativePath.endsWith("/deps/sui/vec_set.ts")) {
    next = next.replace(
      /(export function VecSet<K extends BcsType<any>>\(\.\.\.typeParameters:\s*\[\s*K\s*\]\)\s*)\{/s,
      "$1: MoveStruct<any> {",
    );
  }

  return next;
}

async function main() {
  const exists = await stat(generatedDir).catch(() => null);
  if (!exists?.isDirectory()) {
    throw new Error(`Generated directory not found: ${generatedDir}`);
  }

  const files = await walk(generatedDir);

  await Promise.all(
    files.map(async (filePath) => {
      const source = await readFile(filePath, "utf8");
      const normalized = normalizeGeneratedImports(filePath, source);
      if (normalized !== source) {
        await writeFile(filePath, normalized, "utf8");
      }
    }),
  );
}

await main();
