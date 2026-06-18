import { execSync } from "node:child_process";
import { loadEnvLocal } from "./load-env-local.mjs";

loadEnvLocal();

function pm2List() {
  try {
    const output = execSync("npx pm2 jlist", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return JSON.parse(output);
  } catch {
    return [];
  }
}

function isOnline(processes, name) {
  return processes.some(
    (process) =>
      process.name === name && process.pm2_env?.status === "online",
  );
}

const processes = pm2List();
const devRunning = isOnline(processes, "keysol-dev");
const cronRegistered = processes.some(
  (process) => process.name === "keysol-availability-cron",
);

if (devRunning && cronRegistered) {
  console.log("KeySol dev server and availability cron are already managed by PM2.");
  console.log("Use npm run dev:daemon:status to check them.");
  process.exit(0);
}

console.log("Starting KeySol under PM2 (dev server + scheduled stock refresh)…");
execSync("npx pm2 start ecosystem.config.cjs", {
  stdio: "inherit",
});

console.log("\nRunning initial stock refresh…");
try {
  execSync("node scripts/availability-cron.mjs", { stdio: "inherit" });
} catch {
  console.warn("Initial stock refresh failed — cron will retry on schedule.");
}

console.log("\nKeySol is managed by PM2.");
console.log("Dev: http://localhost:3000 or http://localhost:3001");
console.log("Stock refresh: every 6 hours (keysol-availability-cron)");
console.log("Commands: dev:daemon:status | dev:daemon:logs | dev:daemon:stop");
