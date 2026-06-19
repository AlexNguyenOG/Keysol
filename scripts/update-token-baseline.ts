import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { keyboardTokens } from "../src/data/keyboard-tokens";
import { computeEffectiveTokenScore } from "../src/lib/tokens/scoring";
import type { AvailabilityMap } from "../src/lib/availability/types";

const snapshotFile = path.join(
  process.cwd(),
  "src/data/availability.snapshot.json",
);
const baselineFile = path.join(
  process.cwd(),
  "src/data/token-value.baseline.json",
);

function main() {
  const availability = JSON.parse(
    readFileSync(snapshotFile, "utf8"),
  ) as AvailabilityMap;

  const scores: Record<string, number> = {};

  for (const token of keyboardTokens) {
    const record = availability[token.keyboardId];
    const stockStatus = record?.status ?? "unknown";
    scores[token.keyboardId] = computeEffectiveTokenScore(
      token.rarityScore,
      stockStatus,
    );
  }

  const payload = {
    updatedAt: new Date().toISOString(),
    scores,
  };

  writeFileSync(baselineFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(
    `Updated ${baselineFile} (${Object.keys(scores).length} tokens)`,
  );
}

main();
