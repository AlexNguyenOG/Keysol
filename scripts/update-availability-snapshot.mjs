#!/usr/bin/env node
/** Refresh stock cache and copy to the bundled snapshot shipped on Vercel. */
import { execSync } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";
import path from "node:path";

const cacheFile = path.join(process.cwd(), ".cache/availability.json");
const snapshotFile = path.join(
  process.cwd(),
  "src/data/availability.snapshot.json",
);

execSync("npm run availability:refresh", { stdio: "inherit" });

if (!existsSync(cacheFile)) {
  console.error("Missing .cache/availability.json after refresh.");
  process.exit(1);
}

copyFileSync(cacheFile, snapshotFile);
console.log(`Updated ${snapshotFile}`);
