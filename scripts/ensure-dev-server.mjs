import { execSync } from "node:child_process";

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

const processes = pm2List();
const running = processes.find(
  (process) =>
    process.name === "keysol-dev" &&
    process.pm2_env?.status === "online",
);

if (running) {
  console.log("KeySol dev server is already running under PM2 (keysol-dev).");
  console.log("Use npm run dev:daemon:status to check it.");
  process.exit(0);
}

console.log("Starting KeySol dev server under PM2…");
execSync("npx pm2 start ecosystem.config.cjs", {
  stdio: "inherit",
});

console.log("\nDev server is managed by PM2 and will auto-restart if it stops.");
console.log("Open http://localhost:3000 or http://localhost:3001 once Next.js is ready.");
console.log("Commands: dev:daemon:status | dev:daemon:logs | dev:daemon:stop");
