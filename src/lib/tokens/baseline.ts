import fs from "node:fs/promises";
import path from "node:path";

const BASELINE_FILE = path.join(
  process.cwd(),
  "src/data/token-value.baseline.json",
);

export interface TokenValueBaseline {
  updatedAt: string;
  scores: Record<string, number>;
}

export async function readTokenValueBaseline(): Promise<Record<string, number>> {
  try {
    const raw = await fs.readFile(BASELINE_FILE, "utf8");
    const parsed = JSON.parse(raw) as TokenValueBaseline;
    return parsed.scores ?? {};
  } catch {
    return {};
  }
}

export async function writeTokenValueBaseline(
  scores: Record<string, number>,
  updatedAt = new Date().toISOString(),
): Promise<void> {
  const payload: TokenValueBaseline = { updatedAt, scores };
  await fs.writeFile(BASELINE_FILE, JSON.stringify(payload, null, 2), "utf8");
}
