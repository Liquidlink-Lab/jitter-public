import { describe, expect, test } from "bun:test";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const SDK_SRC_DIR = fileURLToPath(new URL("../", import.meta.url));

async function listTypeScriptFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "generated") return [];
        if (entry.name === "test") return [];
        return listTypeScriptFiles(path);
      }
      return entry.isFile() && path.endsWith(".ts") ? [path] : [];
    }),
  );
  return files.flat();
}

describe("Sui RPC transport policy", () => {
  test("does not use legacy JSON RPC SDK APIs", async () => {
    const forbidden = [
      "@mysten/sui/jsonRpc",
      "SuiJsonRpcClient",
      "devInspectTransactionBlock",
    ];
    const violations: string[] = [];

    for (const file of await listTypeScriptFiles(SDK_SRC_DIR)) {
      const source = await readFile(file, "utf8");
      for (const token of forbidden) {
        if (source.includes(token)) {
          violations.push(`${file.slice(SDK_SRC_DIR.length)} contains ${token}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
