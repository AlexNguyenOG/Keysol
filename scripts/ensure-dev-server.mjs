import { execSync } from "node:child_process";
import { loadEnvLocal } from "./load-env-local.mjs";

loadEnvLocal();

const APPS = ["keysol-dev", "keysol-availability-cron"];

function pm2(args) {
  execSync(`npx pm2 ${args}`, { stdio: "inherit" });
}

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

function findProcess(processes, name) {
  return processes.find((process) => process.name === name);
}

function isOnline(process) {
  return process?.pm2_env?.status === "online";
}

function ensureApp(processes, name) {
  const process = findProcess(processes, name);

  if (isOnline(process)) {
    return "online";
  }

  if (process) {
    console.log(`Restarting ${name}…`);
    pm2(`restart ${name}`);
    return "restarted";
  }

  return "missing";
}

const processes = pm2List();
const devState = ensureApp(processes, "keysol-dev");
const cronState = ensureApp(processes, "keysol-availability-cron");

if (devState === "missing" || cronState === "missing") {
  console.log("Starting KeySol under PM2 (dev server + scheduled stock refresh)…");
  pm2("start ecosystem.config.cjs");
}

if (devState === "online" && cronState === "online") {
  console.log("KeySol dev server and availability cron are already managed by PM2.");
} else {
  try {
    pm2("save");
  } catch {
    console.warn("Could not persist PM2 process list (pm2 save).");
  }
}

console.log("\nRunning initial stock refresh…");
try {
  execSync("node scripts/availability-cron.mjs", { stdio: "inherit" });
} catch {
  console.warn("Initial stock refresh failed — cron will retry on schedule.");
}

console.log("\nKeySol is managed by PM2.");
console.log("Dev: http://localhost:3000");
console.log("Stock refresh: every 6 hours (keysol-availability-cron)");
console.log("Commands: dev:daemon:status | dev:daemon:logs | dev:daemon:stop");
